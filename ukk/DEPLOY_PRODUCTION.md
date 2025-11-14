# 🚀 Production Deployment Guide

Panduan lengkap untuk deploy aplikasi UKK Project Management ke production server (VPS/Cloud).

## 📋 Prerequisites

- **Node.js** v18 atau lebih baru
- **MySQL** database server
- **PM2** untuk process management
- **Nginx** (optional, untuk reverse proxy)
- Domain (optional, untuk SSL)

## 🔧 Setup Environment

### 1. Clone Repository

\`\`\`bash
git clone <repository-url>
cd ukk
\`\`\`

### 2. Setup Environment Variables

\`\`\`bash

# Copy template ke production env

cp .env.production.example .env.production

# Edit dengan nilai production

nano .env.production
\`\`\`

**Penting:** Update semua nilai berikut:

- `DATABASE_URL` - Connection string MySQL production
- `NEXTAUTH_URL` - URL production (https://yourdomain.com)
- `NEXTAUTH_SECRET` - Generate secret baru (min 32 karakter)
- Firebase credentials (jika menggunakan Firebase berbeda)

### 3. Install PM2 (jika belum)

\`\`\`bash
npm install -g pm2
\`\`\`

## 🚀 Deployment

### Metode 1: Automatic Deployment (Recommended)

\`\`\`bash

# Berikan execute permission

chmod +x deploy.sh

# Jalankan deployment script

./deploy.sh
\`\`\`

Script ini akan otomatis:

- ✅ Install dependencies
- ✅ Generate Prisma Client
- ✅ Sync database schema
- ✅ Run type checking
- ✅ Build production bundle
- ✅ Start dengan PM2
- ✅ Save PM2 configuration

### Metode 2: Manual Deployment

\`\`\`bash

# 1. Install dependencies

npm install

# 2. Generate Prisma Client

npx prisma generate

# 3. Sync database

npx prisma db push

# 4. Build application

NODE_ENV=production npm run build

# 5. Start with PM2

pm2 start ecosystem.config.js
pm2 save
\`\`\`

## 🔄 Update Application

Untuk update kode setelah deployment awal:

\`\`\`bash

# Gunakan quick update script

chmod +x update.sh
./update.sh
\`\`\`

Atau manual:
\`\`\`bash
git pull
npm install
npm run build
pm2 reload ukk-project-management
\`\`\`

## 📊 Manage Application

### PM2 Commands

\`\`\`bash

# Lihat status

pm2 status

# Lihat logs

pm2 logs ukk-project-management

# Monitor resources

pm2 monit

# Restart aplikasi

pm2 restart ukk-project-management

# Stop aplikasi

pm2 stop ukk-project-management

# Hapus dari PM2

pm2 delete ukk-project-management
\`\`\`

## 🌐 Nginx Configuration (Optional)

Jika menggunakan Nginx sebagai reverse proxy:

\`\`\`nginx
server {
listen 80;
server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

}
\`\`\`

## 🔐 SSL dengan Let's Encrypt (Optional)

\`\`\`bash

# Install Certbot

sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate

sudo certbot --nginx -d yourdomain.com
\`\`\`

## 🗄️ Database Management

### Backup Database

\`\`\`bash

# Backup MySQL

mysqldump -u username -p database*name > backup*$(date +%Y%m%d).sql
\`\`\`

### Restore Database

\`\`\`bash
mysql -u username -p database_name < backup_20240101.sql
\`\`\`

### Seed Database (Initial Setup)

\`\`\`bash
npx prisma db seed
\`\`\`

Default admin credentials:

- Email: `admin@ukk.com`
- Password: `password123`

⚠️ **Penting:** Ganti password admin setelah login pertama!

## 📈 Monitoring

### Application Logs

\`\`\`bash

# PM2 logs

pm2 logs ukk-project-management

# Logs directory

tail -f logs/pm2-out.log
tail -f logs/pm2-error.log
\`\`\`

### Database Logs

\`\`\`bash

# MySQL logs (location may vary)

sudo tail -f /var/log/mysql/error.log
\`\`\`

## 🔧 Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs`
2. Verify environment: `cat .env.production`
3. Test database connection: `npx prisma studio`
4. Check port availability: `lsof -i :3000`

### Database Connection Error

1. Verify DATABASE_URL format
2. Check MySQL is running: `sudo systemctl status mysql`
3. Test connection: `mysql -u username -p`
4. Check firewall rules

### Build Errors

1. Clear build cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node version: `node -v` (minimum v18)

### Memory Issues

Increase PM2 memory limit in `ecosystem.config.js`:
\`\`\`javascript
max_memory_restart: '2G', // Increase from 1G to 2G
\`\`\`

## 🎯 Performance Optimization

### 1. Enable Caching

Update Nginx config untuk cache static assets:
\`\`\`nginx
location /\_next/static {
proxy_pass http://localhost:3000;
expires 365d;
add_header Cache-Control "public, immutable";
}
\`\`\`

### 2. Enable Compression

Nginx gzip compression:
\`\`\`nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
\`\`\`

### 3. Database Optimization

- Add indexes untuk queries yang sering digunakan
- Enable MySQL query cache
- Monitor slow queries

## 🔒 Security Checklist

- [ ] Environment variables aman (tidak di-commit ke Git)
- [ ] Database password kuat
- [ ] Admin password diganti dari default
- [ ] Firewall configured (hanya buka port yang diperlukan)
- [ ] SSL/HTTPS enabled
- [ ] Regular security updates
- [ ] Backup database teratur
- [ ] Monitor error logs

## 📝 Maintenance Tasks

### Daily

- Monitor application logs
- Check disk space
- Verify backups

### Weekly

- Review error logs
- Check database size
- Update dependencies (if needed)

### Monthly

- Security updates
- Database optimization
- Performance review
- Backup verification

## 🆘 Support

Jika menemui masalah:

1. Check logs terlebih dahulu
2. Review PRODUCTION_DEPLOYMENT.md
3. Verify environment variables
4. Test database connection
5. Check server resources (CPU, RAM, Disk)

---

**Happy Deploying! 🚀**

For detailed production checklist, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
