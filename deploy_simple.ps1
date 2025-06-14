# 简化的PowerShell部署脚本
Write-Host "🚀 开始部署到服务器..." -ForegroundColor Green

# 执行SSH命令进行部署
ssh root@103.252.200.15 "
echo '📦 停止现有服务...'
pkill -f 'sky-server' || echo '后端服务未运行'
pm2 stop all || echo '前端服务未运行'

echo '🗑️ 清理旧代码...'
if [ -d '/root/sky-take-out' ]; then
    mv /root/sky-take-out /root/sky-take-out-backup-\$(date +%Y%m%d_%H%M%S)
fi
if [ -d '/root/happyUserEnd-main' ]; then
    mv /root/happyUserEnd-main /root/happyUserEnd-main-backup-\$(date +%Y%m%d_%H%M%S)
fi

echo '📥 克隆最新代码...'
cd /root
git clone -b email-system-update https://github.com/qhdzhm/sky-takeout-backend.git sky-take-out
git clone https://github.com/qhdzhm/happyUserFrontEnd.git happyUserEnd-main

echo '📦 构建后端...'
cd /root/sky-take-out
mvn clean package -DskipTests -Pprod

echo '🔄 更新nginx配置...'
cat > /etc/nginx/sites-available/htas << 'EOF'
server {
    listen 80;
    server_name htas.com.au www.htas.com.au;
    
    location / {
        root /root/happyUserEnd-main/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }
    }
    
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

nginx -t && systemctl reload nginx

echo '🚀 启动服务...'
cd /root/sky-take-out
nohup java -jar sky-server/target/sky-server-1.0-SNAPSHOT.jar --spring.profiles.active=prod > /root/backend.log 2>&1 &

sleep 5

echo '🔍 检查服务状态...'
if pgrep -f 'sky-server' > /dev/null; then
    echo '✅ 后端服务运行正常'
else
    echo '❌ 后端服务启动失败'
fi

if systemctl is-active --quiet nginx; then
    echo '✅ Nginx服务运行正常'
else
    echo '❌ Nginx服务异常'
fi

echo '✅ 部署完成！'
echo '后端日志: tail -f /root/backend.log'
echo '前端访问: http://www.htas.com.au'
"

Write-Host "🎉 部署脚本执行完成！" -ForegroundColor Green 