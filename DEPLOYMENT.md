# Happy Tassie Travel 部署指南

## 📋 部署概述

本项目使用 nginx 反向代理方案，前端和后端 API 通过同一域名提供服务，完全解决 CORS 跨域问题。

## 🚀 一键部署

### 1. 服务器要求
- Ubuntu 18.04+ / CentOS 7+ / Debian 9+
- Root 权限或 sudo 权限
- 已安装 nginx 和 git

### 2. 运行部署脚本
```bash
# 下载仓库
git clone https://github.com/qhdzhm/happyUserFrontEnd.git
cd happyUserFrontEnd

# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本 (需要root权限)
sudo ./deploy.sh
```

### 3. 脚本功能
- ✅ 自动检查依赖
- ✅ 备份现有文件
- ✅ 部署最新前端
- ✅ 配置 nginx 反向代理
- ✅ 测试并重启服务
- ✅ 检查后端状态

## 🔧 手动部署步骤

如果需要手动部署，请按以下步骤：

### 1. 安装 nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 部署前端文件
```bash
# 创建目录
sudo mkdir -p /var/www/htas/frontend

# 复制构建文件
sudo cp -r ./build/* /var/www/htas/frontend/

# 设置权限
sudo chown -R www-data:www-data /var/www/htas/frontend
sudo chmod -R 755 /var/www/htas/frontend
```

### 3. 配置 nginx
创建配置文件 `/etc/nginx/sites-available/htas.com.au`：

```nginx
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
    
    # SSL 证书配置
    ssl_certificate /etc/ssl/certs/htas.com.au.crt;
    ssl_certificate_key /etc/ssl/private/htas.com.au.key;
    
    # 前端静态文件
    location / {
        root /var/www/htas/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # API 反向代理
    location /admin/ {
        proxy_pass http://127.0.0.1:8080/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # ... 其他API路径配置
}
```

### 4. 启用站点
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/htas.com.au /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启服务
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 SSL 证书配置

### 使用 Let's Encrypt 免费证书
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d htas.com.au -d www.htas.com.au

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📁 目录结构

```
/var/www/htas/
├── frontend/          # 前端构建文件
├── backup/           # 备份文件
└── logs/            # 日志文件

/etc/nginx/
├── sites-available/
│   └── htas.com.au   # nginx配置文件
└── sites-enabled/
    └── htas.com.au   # 配置文件软链接
```

## 🔍 故障排除

### 检查服务状态
```bash
# 检查 nginx 状态
sudo systemctl status nginx

# 检查 nginx 配置
sudo nginx -t

# 查看 nginx 日志
sudo tail -f /var/log/nginx/htas.error.log
sudo tail -f /var/log/nginx/htas.access.log

# 检查 Java 后端
netstat -tlnp | grep 8080
```

### 常见问题

**1. CORS 错误**
- 确保使用相对路径访问 API
- 检查 nginx 反向代理配置是否正确

**2. 404 错误**
- 检查前端文件是否正确部署
- 确认 nginx 配置中的 root 路径正确

**3. 502 Bad Gateway**
- 检查 Java 后端是否在 8080 端口运行
- 确认防火墙设置允许内部通信

**4. SSL 证书错误**
- 检查证书文件路径是否正确
- 确认证书未过期

## 📞 支持

如有问题，请检查：
1. nginx 配置文件语法
2. Java 后端服务状态
3. 防火墙和端口设置
4. SSL 证书配置

## 🔄 更新部署

更新前端代码后，重新运行部署脚本即可：

```bash
cd happyUserFrontEnd
git pull origin master
sudo ./deploy.sh
```

---

**注意**: 请确保在部署前备份重要数据！ 