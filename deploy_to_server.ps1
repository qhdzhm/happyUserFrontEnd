# PowerShell 服务器部署脚本
$SERVER_IP = "103.252.200.15"
$SERVER_USER = "root"

Write-Host "🚀 开始部署到服务器..." -ForegroundColor Green

# 创建SSH命令
$sshCommand = @"
echo "📦 停止现有服务..."

# 停止后端服务
pkill -f "sky-server" || echo "后端服务未运行"

# 停止前端服务 (如果使用pm2)
pm2 stop all || echo "前端服务未运行"

echo "🗑️ 清理旧代码..."

# 备份并删除旧的后端代码
if [ -d "/root/sky-take-out" ]; then
    mv /root/sky-take-out /root/sky-take-out-backup-`$(date +%Y%m%d_%H%M%S)
fi

# 备份并删除旧的前端代码
if [ -d "/root/happyUserEnd-main" ]; then
    mv /root/happyUserEnd-main /root/happyUserEnd-main-backup-`$(date +%Y%m%d_%H%M%S)
fi

echo "📥 克隆最新代码..."

# 克隆后端代码
cd /root
git clone -b email-system-update https://github.com/qhdzhm/sky-takeout-backend.git sky-take-out

# 克隆前端代码
git clone https://github.com/qhdzhm/happyUserFrontEnd.git happyUserEnd-main

echo "🔧 配置环境..."

# 进入后端目录
cd /root/sky-take-out

# 复制生产环境配置
if [ -f "/root/production.env" ]; then
    cp /root/production.env .
    echo "已复制生产环境配置"
fi

echo "📦 构建后端..."

# 构建后端项目
mvn clean package -DskipTests -Pprod

echo "🌐 配置前端..."

# 进入前端目录
cd /root/happyUserEnd-main

# 前端已经打包好了，直接配置nginx
echo "前端构建文件已包含在仓库中"

echo "🔄 更新nginx配置..."

# 更新nginx配置以移除CORS设置（避免与后端冲突）
cat > /etc/nginx/sites-available/htas << 'NGINX_EOF'
server {
    listen 80;
    server_name htas.com.au www.htas.com.au;
    
    # 前端静态文件
    location / {
        root /root/happyUserEnd-main/build;
        index index.html index.htm;
        try_files `$uri `$uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)`$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理到后端 - 移除CORS配置，由后端处理
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_EOF

# 重新加载nginx配置
nginx -t && systemctl reload nginx

echo "🚀 启动服务..."

# 启动后端服务
cd /root/sky-take-out
nohup java -jar sky-server/target/sky-server-1.0-SNAPSHOT.jar --spring.profiles.active=prod > /root/backend.log 2>&1 &

echo "✅ 部署完成！"
echo "后端日志: tail -f /root/backend.log"
echo "前端访问: http://www.htas.com.au"

# 等待几秒让服务启动
sleep 5

# 检查服务状态
echo "🔍 检查服务状态..."
if pgrep -f "sky-server" > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务启动失败"
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx服务运行正常"
else
    echo "❌ Nginx服务异常"
fi
"@

# 执行SSH命令
try {
    ssh "$SERVER_USER@$SERVER_IP" $sshCommand
    Write-Host "🎉 部署脚本执行完成！" -ForegroundColor Green
} catch {
    Write-Host "❌ 部署过程中出现错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请手动连接服务器检查问题" -ForegroundColor Yellow
} 