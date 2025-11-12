# 🚀 VPS Deployment Guide (Non-Docker)

**Simple, Fast, Production-Ready with PM2 + Nginx**

---

## ✅ Advantages vs Docker

| Aspect               | Docker                        | PM2 (Non-Docker)       |
| -------------------- | ----------------------------- | ---------------------- |
| **Build Time**       | 2-3 min                       | 30 sec                 |
| **Debugging**        | Complex (exec into container) | Simple (direct access) |
| **Tailwind CSS**     | Sometimes broken              | ✅ Always works        |
| **Resource Usage**   | +200MB overhead               | Lighter                |
| **Setup Complexity** | High                          | Low                    |

---

## 📋 Prerequisites

- Ubuntu 20.04+ or Debian 11+ VPS
- Root or sudo access
- Domain pointed to VPS IP (optional)

---

## 🚀 Quick Start

### 1. Clone Repository on VPS

```bash
# SSH to VPS
ssh root@your-vps-ip

# Clone project
git clone https://github.com/rendrabagasdev/Management-Proyek.git
cd Management-Proyek/ukk
```

### 2. Run Deployment Script

```bash
# Make script executable (if not already)
chmod +x deploy-vps.sh

# Run deployment
./deploy-vps.sh
```

### 3. Choose Option

**Option 1: Full Setup** (Fresh VPS)

- Installs Node.js, PM2, MySQL, Nginx
- Creates database
- Deploys app
- Configures everything

**Option 2: Deploy App Only** (If dependencies installed)

- Setup database
- Deploy application
- Start with PM2

**Option 3: Update App** (After code changes)

- Pull latest code
- Rebuild and restart

---

## 🔧 Manual Setup (Step by Step)

### 1. Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Should show v22.x.x
```

### 2. Install PM2

```bash
sudo npm install -g pm2
pm2 -v
```

### 3. Install MySQL

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Create database
sudo mysql << EOF
CREATE DATABASE ukk_project_management;
CREATE USER 'ukk_user'@'localhost' IDENTIFIED BY 'ukk_password';
GRANT ALL PRIVILEGES ON ukk_project_management.* TO 'ukk_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 4. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5. Deploy Application

```bash
cd ~/Management-Proyek/ukk

# Create .env file
cp .env.example .env
nano .env

# Update these values:
DATABASE_URL="mysql://ukk_user:ukk_password@localhost:3306/ukk_project_management"
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Install dependencies
npm ci --production

# Setup Prisma
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js

# Build Next.js
npm run build

# Start with PM2
pm2 start npm --name "ukk-app" -- start
pm2 save
pm2 startup  # Follow instructions
```

### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/ukk-app
```

Paste this config:

```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;

server {
    listen 80;
    server_name your-domain.com;

    location / {
        limit_req zone=general burst=20 nodelay;

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

    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/ukk-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 Setup SSL with Cloudflare (Recommended)

### Cloudflare Dashboard:

1. SSL/TLS → **Full (strict)** mode
2. Edge Certificates → Always Use HTTPS: **ON**
3. DNS → Add A record: `your-domain.com` → `your-vps-ip`

### VPS (Origin Certificate):

```bash
# Download cert from Cloudflare → SSL/TLS → Origin Server
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/cert.pem    # Paste certificate
sudo nano /etc/ssl/cloudflare/key.pem     # Paste private key
sudo chmod 600 /etc/ssl/cloudflare/*.pem
```

Update Nginx config:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/cloudflare/cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/key.pem;

    # ... rest of proxy config
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 PM2 Commands

```bash
# Status
pm2 status

# Logs (real-time)
pm2 logs ukk-app

# Logs (last 100 lines)
pm2 logs ukk-app --lines 100

# Restart app
pm2 restart ukk-app

# Stop app
pm2 stop ukk-app

# Monitor resources
pm2 monit

# List all processes
pm2 list

# Delete process
pm2 delete ukk-app
```

---

## 🔄 Update Application

```bash
# Quick update script
cd ~/Management-Proyek/ukk

# Pull latest code
git pull

# Install new dependencies (if any)
npm ci --production

# Update Prisma
npx prisma generate
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
pm2 restart ukk-app

# Check logs
pm2 logs ukk-app --lines 50
```

Or use deployment script:

```bash
./deploy-vps.sh  # Choose option 3
```

---

## 🐛 Troubleshooting

### App not starting

```bash
# Check PM2 logs
pm2 logs ukk-app

# Check .env file
cat .env | grep DATABASE_URL

# Test database connection
mysql -u ukk_user -pukk_password ukk_project_management -e "SELECT 1"

# Test build locally
npm run build
```

### Nginx errors

```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Database errors

```bash
# Check MySQL status
sudo systemctl status mysql

# Reset database
sudo mysql << EOF
DROP DATABASE ukk_project_management;
CREATE DATABASE ukk_project_management;
EOF

npx prisma migrate deploy
node prisma/seed.js
```

### Tailwind CSS not showing

```bash
# Check if CSS files exist
ls -la .next/static/css/

# Rebuild
npm run build

# Clear browser cache
# Or use incognito mode
```

---

## 📈 Performance Tips

### 1. Enable Gzip in Nginx

```nginx
# Add to /etc/nginx/nginx.conf (http block)
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 2. PM2 Cluster Mode

```bash
# Use multiple CPU cores
pm2 delete ukk-app
pm2 start npm --name "ukk-app" -i max -- start
pm2 save
```

### 3. MySQL Optimization

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add:
[mysqld]
innodb_buffer_pool_size = 256M
max_connections = 100
```

---

## 🆘 Need Help?

- Check logs: `pm2 logs ukk-app`
- Check status: `pm2 status`
- Restart: `pm2 restart ukk-app`
- Full restart: `pm2 restart ukk-app && sudo systemctl restart nginx`

---

## 📝 Architecture

```
Internet/Cloudflare (SSL)
    ↓
Nginx (Port 80/443) - Reverse Proxy + Rate Limiting
    ↓
PM2 → Next.js App (Port 3000)
    ↓
MySQL (Port 3306, localhost only)
```

---

**Deployed:** Simple, Fast, Production-Ready ✅
