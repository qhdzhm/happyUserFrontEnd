#!/bin/bash

# Happy Tassie Travel 服务器端自动配置脚本
# 功能：删除旧文件，克隆最新代码，配置nginx，重启服务

set -e  # 遇到错误立即停止

# 配置变量
OLD_FRONTEND_DIR="/opt/frontend"
NEW_FRONTEND_DIR="/var/www/htas/frontend"
BACKUP_DIR="/var/www/htas/backup"
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
SITE_NAME="htas.com.au"
REPO_URL="https://github.com/qhdzhm/happyUserFrontEnd.git"
TEMP_DIR="/tmp/happyUserFrontEnd"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用root用户运行此脚本，或使用sudo"
        exit 1
    fi
}

# 检查必要工具
check_dependencies() {
    print_status "检查依赖工具..."
    
    if ! command -v nginx &> /dev/null; then
        print_error "nginx 未安装，请先安装nginx"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git 未安装，请先安装git"
        exit 1
    fi
    
    print_success "依赖检查完成"
}

# 备份并删除旧的前端文件
cleanup_old_frontend() {
    print_status "处理旧的前端文件..."
    
    # 如果旧目录存在，先备份
    if [ -d "$OLD_FRONTEND_DIR" ]; then
        print_status "备份旧的前端文件..."
        mkdir -p "$BACKUP_DIR"
        BACKUP_NAME="old_frontend_backup_$(date +%Y%m%d_%H%M%S)"
        cp -r "$OLD_FRONTEND_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        print_success "备份已创建: $BACKUP_DIR/$BACKUP_NAME"
        
        # 删除旧目录
        print_status "删除旧的前端目录..."
        rm -rf "$OLD_FRONTEND_DIR"
        print_success "旧前端目录已删除"
    else
        print_warning "旧前端目录不存在，跳过删除"
    fi
    
    # 如果新目录存在，也备份
    if [ -d "$NEW_FRONTEND_DIR" ]; then
        print_status "备份现有的新前端文件..."
        BACKUP_NAME="new_frontend_backup_$(date +%Y%m%d_%H%M%S)"
        cp -r "$NEW_FRONTEND_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        print_success "新前端文件已备份: $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# 克隆最新代码
clone_latest_code() {
    print_status "克隆最新前端代码..."
    
    # 清理临时目录
    rm -rf "$TEMP_DIR"
    
    # 克隆代码
    git clone "$REPO_URL" "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # 检查build目录是否存在
    if [ ! -d "build" ]; then
        print_error "build目录不存在，代码可能没有预构建"
        print_error "请确保仓库中包含build文件夹"
        exit 1
    fi
    
    print_success "最新代码克隆完成"
}

# 部署新的前端文件
deploy_new_frontend() {
    print_status "部署新的前端文件..."
    
    # 创建新的前端目录
    mkdir -p "$NEW_FRONTEND_DIR"
    
    # 复制构建文件
    cp -r "$TEMP_DIR/build"/* "$NEW_FRONTEND_DIR/"
    
    # 设置正确的权限
    chown -R www-data:www-data "$NEW_FRONTEND_DIR"
    chmod -R 755 "$NEW_FRONTEND_DIR"
    
    print_success "新前端文件部署完成"
}

# 配置nginx
configure_nginx() {
    print_status "配置nginx..."
    
    # 创建nginx配置文件
    cat > "$NGINX_CONFIG_DIR/$SITE_NAME" << 'EOF'
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name htas.com.au www.htas.com.au;
    return 301 https://htas.com.au$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name htas.com.au www.htas.com.au;
    
    # SSL 证书配置 (请根据实际情况修改)
    ssl_certificate /etc/ssl/certs/htas.com.au.crt;
    ssl_certificate_key /etc/ssl/private/htas.com.au.key;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 启用 HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 日志配置
    access_log /var/log/nginx/htas.access.log;
    error_log /var/log/nginx/htas.error.log;
    
    # 前端静态文件配置
    location / {
        root /var/www/htas/frontend;
        try_files $uri $uri/ /index.html;
        
        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 反向代理配置
    location /admin/ {
        proxy_pass http://127.0.0.1:8080/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    location /agent/ {
        proxy_pass http://127.0.0.1:8080/agent/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    location /user/ {
        proxy_pass http://127.0.0.1:8080/user/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    location /auth/ {
        proxy_pass http://127.0.0.1:8080/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    location /orders/ {
        proxy_pass http://127.0.0.1:8080/orders/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    location /chatbot/ {
        proxy_pass http://127.0.0.1:8080/chatbot/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # API文档访问
    location /doc.html {
        proxy_pass http://127.0.0.1:8080/doc.html;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Swagger相关资源
    location ~ ^/(webjars|swagger-resources|v2/api-docs)/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    # 启用站点
    if [ ! -L "$NGINX_ENABLED_DIR/$SITE_NAME" ]; then
        ln -s "$NGINX_CONFIG_DIR/$SITE_NAME" "$NGINX_ENABLED_DIR/$SITE_NAME"
    fi
    
    print_success "nginx配置完成"
}

# 测试nginx配置
test_nginx() {
    print_status "测试nginx配置..."
    
    if nginx -t; then
        print_success "nginx配置测试通过"
    else
        print_error "nginx配置测试失败"
        exit 1
    fi
}

# 重启nginx
restart_nginx() {
    print_status "重启nginx服务..."
    
    systemctl restart nginx
    systemctl enable nginx
    
    if systemctl is-active --quiet nginx; then
        print_success "nginx服务启动成功"
    else
        print_error "nginx服务启动失败"
        exit 1
    fi
}

# 检查Java后端状态
check_backend() {
    print_status "检查Java后端状态..."
    
    if netstat -tlnp | grep -q ":8080 "; then
        print_success "Java后端服务正在运行 (端口8080)"
    else
        print_warning "Java后端服务未在8080端口运行"
        print_warning "请确保启动Java后端服务"
    fi
}

# 清理临时文件
cleanup() {
    print_status "清理临时文件..."
    rm -rf "$TEMP_DIR"
    print_success "临时文件清理完成"
}

# 显示部署信息
show_deployment_info() {
    echo
    print_success "🎉 配置完成！"
    echo
    echo "部署信息："
    echo "• 前端文件位置: $NEW_FRONTEND_DIR"
    echo "• nginx配置文件: $NGINX_CONFIG_DIR/$SITE_NAME"
    echo "• 备份位置: $BACKUP_DIR"
    echo "• 访问地址: https://htas.com.au"
    echo
    echo "重要变化："
    echo "• 旧前端目录 $OLD_FRONTEND_DIR 已删除"
    echo "• 新前端部署到 $NEW_FRONTEND_DIR"
    echo "• nginx已配置反向代理，消除CORS问题"
    echo "• 前端现在通过相对路径调用API"
    echo
    echo "有用的命令："
    echo "• 查看nginx状态: systemctl status nginx"
    echo "• 查看nginx日志: tail -f /var/log/nginx/htas.error.log"
    echo "• 重新加载nginx: systemctl reload nginx"
    echo "• 查看Java后端: netstat -tlnp | grep 8080"
}

# 主函数
main() {
    echo "=================================================="
    echo "  Happy Tassie Travel 服务器自动配置脚本"
    echo "=================================================="
    echo
    
    check_root
    check_dependencies
    cleanup_old_frontend
    clone_latest_code
    deploy_new_frontend
    configure_nginx
    test_nginx
    restart_nginx
    check_backend
    cleanup
    show_deployment_info
}

# 运行主函数
main "$@" 