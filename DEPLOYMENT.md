# Ubuntu 服务器部署指南

## 一、服务器环境准备

### 1. 更新系统
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. 安装必要工具
```bash
sudo apt install -y curl git wget build-essential
```

---

## 二、安装 Node.js

### 安装 Node.js 20.x (LTS)
```bash
# 使用 NodeSource 仓库安装
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v
npm -v
```

---

## 三、安装 MongoDB

### 安装 MongoDB 7.0
```bash
# 导入 MongoDB 公钥
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# 添加 MongoDB 仓库
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 更新并安装
sudo apt update
sudo apt install -y mongodb-org

# 启动 MongoDB 服务
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证运行状态
sudo systemctl status mongod
```

### 配置 MongoDB 远程访问（可选）
如果需要从其他机器连接MongoDB：
```bash
sudo nano /etc/mongod.conf
```

修改 `net` 部分：
```yaml
net:
  port: 27017
  bindIp: 0.0.0.0  # 允许远程连接
```

重启MongoDB：
```bash
sudo systemctl restart mongod
```

配置防火墙：
```bash
sudo ufw allow 27017
```

---

## 四、上传项目代码

### 方法1：使用 Git（推荐）
```bash
# 克隆项目（如果代码已推送到GitHub/GitLab）
cd /var/www
sudo git clone <你的仓库地址> lab-inventory
cd lab-inventory
```

### 方法2：使用 SCP 上传
```bash
# 在本地Windows执行（PowerShell）
scp -r .\no1_express\ root@你的服务器IP:/var/www/lab-inventory
```

### 方法3：使用 FTP 工具
- 使用 FileZilla 或 WinSCP 上传项目文件到 `/var/www/lab-inventory`

---

## 五、配置项目

### 1. 安装依赖
```bash
cd /var/www/lab-inventory
npm install --production
```

### 2. 创建必要的目录
```bash
mkdir -p public/avatar
chmod 755 public/avatar
```

### 3. 修改 CORS 配置
编辑 `app.js`，添加你的服务器域名：

```javascript
app.use(cros({
    origin: [
        'http://localhost:10086',
        'http://192.168.67.48:10086',
        /^http:\/\/192\.168\.\d+\.\d+:10086$/,
        'http://你的服务器IP:前端端口',  // 添加这行
        'http://你的域名:前端端口'       // 如果有域名，添加这行
    ],
    credentials: true
}))
```

### 4. 修改 MongoDB 连接（如果需要）
检查 `utils/mongoDB.js`，确保连接地址正确。

---

## 六、安装并配置 PM2

### 安装 PM2
```bash
sudo npm install -g pm2
```

### 启动应用
```bash
cd /var/www/lab-inventory
pm2 start app.js --name lab-inventory
```

### 设置 PM2 开机自启
```bash
pm2 startup
# 执行输出的命令

pm2 save
```

### PM2 常用命令
```bash
pm2 list              # 查看所有进程
pm2 logs lab-inventory # 查看日志
pm2 stop lab-inventory  # 停止应用
pm2 restart lab-inventory # 重启应用
pm2 delete lab-inventory  # 删除进程
pm2 monit             # 监控面板
```

---

## 七、配置 Nginx 反向代理（可选但推荐）

### 安装 Nginx
```bash
sudo apt install -y nginx
```

### 创建站点配置
```bash
sudo nano /etc/nginx/sites-available/lab-inventory
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件代理
    location /public {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 前端静态文件（如果有）
    location / {
        root /var/www/lab-inventory/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### 启用站点
```bash
sudo ln -s /etc/nginx/sites-available/lab-inventory /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 八、配置防火墙

```bash
# 允许 SSH
sudo ufw allow 22

# 允许 HTTP
sudo ufw allow 80

# 允许 HTTPS
sudo ufw allow 443

# 允许 Node.js 端口（如果不使用 Nginx）
sudo ufw allow 3000

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

---

## 九、配置 SSL 证书（HTTPS）

### 使用 Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d 你的域名

# 自动续期
sudo certbot renew --dry-run
```

---

## 十、故障排查

### 查看 PM2 日志
```bash
pm2 logs lab-inventory --lines 100
```

### 查看 MongoDB 日志
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

### 查看 Nginx 日志
```bash
sudo tail -f /var/log/nginx/error.log
```

### 检查端口占用
```bash
sudo netstat -tlnp | grep 3000
```

### 测试 API
```bash
curl http://localhost:3000/user/login
```

---

## 十一、部署检查清单

- [ ] Node.js 已安装
- [ ] MongoDB 已安装并运行
- [ ] 项目代码已上传
- [ ] `npm install` 已执行
- [ ] public/avatar 目录已创建
- [ ] CORS 配置已更新
- [ ] PM2 已配置开机自启
- [ ] 防火墙规则已配置
- [ ] Nginx 反向代理已配置（可选）
- [ ] SSL 证书已安装（可选）

---

## 快速部署脚本

将以下内容保存为 `deploy.sh`：

```bash
#!/bin/bash

echo "开始部署实验室耗材管理系统..."

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx

# 安装项目依赖
cd /var/www/lab-inventory
npm install --production

# 创建必要目录
mkdir -p public/avatar
chmod 755 public/avatar

# 启动应用
pm2 start app.js --name lab-inventory
pm2 save
pm2 startup

echo "部署完成！"
echo "请手动配置 Nginx 和 CORS 设置"
```

运行脚本：
```bash
chmod +x deploy.sh
sudo ./deploy.sh
```
