# 🐳 Complete Docker Guide - UKK Management Project

> **Panduan lengkap deployment dengan Node.js Latest + Security + Production Ready**

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Security Features](#-security-features)
- [Commands Reference](#-commands-reference)
- [Configuration](#-configuration)
- [Production Deployment](#-production-deployment)
- [Monitoring](#-monitoring)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- Port 80, 443, 3000 available

### 1. Setup Environment

```bash
cd /Users/faimac/development/folder_ukk/ukk

# Edit .env file (sudah ada)
nano .env
```

**Pastikan konfigurasi ini benar:**

```env
# Database (untuk Docker Compose)
DATABASE_URL="mysql://root:rahasia123@db:3306/ukk_project_management"

# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=rajaiblissukasusudenganminimal32karakter

# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

### 2. Build & Run

```bash
# Build image dengan Node.js latest
./docker-build-latest.sh

# Start semua services (dengan security)
./docker-secure.sh up
```

### 3. Access Application

- **Web**: http://localhost:3000
- **With Nginx**: http://localhost

---

## 🏗️ Architecture

### Standard Setup (docker-compose.yml)

```
User → App (Port 3000) → Database (Port 3306)
```

**Services:**

- `app` - Next.js (node:latest-alpine)
- `db` - MySQL 8.0

### Secure Setup (docker-compose.secure.yml)

```
User → Nginx (Port 80/443) → Fail2ban Monitor
         ↓                        ↓
       App (Internal)      Auto-ban Bad IPs
         ↓
     Database (Internal)
```

**Services:**

- `nginx` - Reverse proxy + Rate limiting
- `app` - Next.js (isolated)
- `db` - MySQL (isolated)
- `fail2ban` - DDoS protection

### Multi-stage Build

```
┌─────────────────────────────────────┐
│  Stage 1: Dependencies              │
│  FROM node:latest                   │
│  - Install production deps          │
│  - Network retry logic (10x)        │
│  - NPM mirror (fast download)       │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Stage 2: Builder                   │
│  FROM node:latest                   │
│  - Install ALL dependencies         │
│  - Generate Prisma Client           │
│  - Build Next.js                    │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Stage 3: Runner (Production)       │
│  FROM node:latest-alpine            │
│  - Copy built files only            │
│  - Run as non-root user             │
│  - Final size: ~300MB               │
└─────────────────────────────────────┘
```

---

## 🔐 Security Features

### ✅ Layer 1: Nginx Reverse Proxy

- **Rate Limiting**
  - General: 10 req/s
  - API: 20 req/s
  - Login: 5 req/minute
- **Bad Bot Blocking** (nikto, sqlmap, etc.)
- **SQL Injection Protection**
- **Security Headers** (HSTS, CSP, X-Frame-Options)
- **Static File Caching**

### ✅ Layer 2: Fail2ban DDoS Protection

- **Auto IP Banning**
  - HTTP auth failures: 3 attempts → 2h ban
  - Rate limit violations: 10 attempts → 1h ban
  - 404 abuse: 20 attempts → 1h ban
  - DDoS attempts: 100 req/min → 1h ban
- **Automatic Unban** after timeout
- **Manual Unban** capability

### ✅ Layer 3: Network Isolation

- **Frontend Network**: Public (Nginx only)
- **Backend Network**: Internal (App + DB)
- **No Direct Access** to app/database from internet

### ✅ Layer 4: Docker Security

- Non-root user in containers
- Network retry logic (npm)
- Resource limits
- Health checks

### ✅ Layer 5: Application Security

- NextAuth.js authentication
- Firebase Admin SDK
- Prisma ORM (SQL injection safe)
- Environment variable protection

---

## 📦 Commands Reference

### Build Commands

```bash
# Interactive build (recommended)
./docker-build-latest.sh

# Manual build (standard)
docker-compose build

# Manual build (secure)
docker-compose -f docker-compose.secure.yml build app

# Build tanpa cache
docker-compose build --no-cache app
```

### Run Commands

```bash
# Standard setup
docker-compose up -d

# Secure setup (recommended)
./docker-secure.sh up

# Stop services
./docker-secure.sh down

# Restart services
./docker-secure.sh restart
```

### Logs & Monitoring

```bash
# All logs
./docker-secure.sh logs

# Specific service
./docker-secure.sh logs app
./docker-secure.sh logs nginx
./docker-secure.sh logs db
./docker-secure.sh logs fail2ban

# Follow logs (real-time)
docker-compose -f docker-compose.secure.yml logs -f --tail=100 app

# Container stats
docker stats
```

### Database Operations

```bash
# Run migrations
./docker-secure.sh migrate

# Seed database
./docker-secure.sh seed

# Access MySQL shell
./docker-secure.sh shell db
mysql -u root -p ukk_project_management

# Backup database
docker-compose exec db mysqldump -u root -p ukk_project_management > backup.sql

# Restore database
docker-compose exec -T db mysql -u root -p ukk_project_management < backup.sql
```

### Security Operations

```bash
# Check status
./docker-secure.sh status

# View banned IPs
./docker-secure.sh banned

# Unban specific IP
./docker-secure.sh unban 192.168.1.100

# Reload Nginx config
./docker-secure.sh nginx-reload

# Test security features
./docker-secure.sh test
```

### Container Shell Access

```bash
# App container
./docker-secure.sh shell app

# Database container
./docker-secure.sh shell db

# Nginx container
./docker-secure.sh shell nginx

# Fail2ban container
./docker-secure.sh shell fail2ban
```

### Cleanup

```bash
# Clean containers + volumes
./docker-secure.sh clean

# Clean Docker cache
docker system prune -a -f

# Clean images
docker image prune -a -f

# Full cleanup
docker-compose down -v
docker system prune -a -f --volumes
```

### Quick Reference Card

```bash
# Show all commands
./docker-commands.sh
```

---

## ⚙️ Configuration

### Dockerfile Features

```dockerfile
# Network Retry Logic
npm config set registry https://registry.npmmirror.com
npm config set fetch-retries 10           # Retry 10x
npm config set fetch-retry-mintimeout 20000   # Min 20s
npm config set fetch-retry-maxtimeout 120000  # Max 2m
npm config set fetch-timeout 300000           # Timeout 5m
```

### Environment Variables

**Database:**

```env
DB_ROOT_PASSWORD=rahasia123
DB_NAME=ukk_project_management
DB_USER=root
DB_PORT=3306
DATABASE_URL="mysql://root:rahasia123@db:3306/ukk_project_management"
```

**Application:**

```env
APP_PORT=3000
NODE_ENV=production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=minimal32karakterrandomstring
```

**Firebase:**

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... (existing Firebase config)
```

### Rate Limiting Customization

Edit `nginx/nginx.conf`:

```nginx
# Adjust rate limits
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

Reload:

```bash
./docker-secure.sh nginx-reload
```

### Fail2ban Tuning

Edit `fail2ban/config/jail.local`:

```ini
[nginx-ddos]
maxretry = 100      # Max requests before ban
findtime = 60       # Time window (seconds)
bantime = 3600      # Ban duration (seconds)
```

Restart:

```bash
docker-compose -f docker-compose.secure.yml restart fail2ban
```

---

## 🌐 Production Deployment

### Opsi 1: Direct VPS (No Domain)

```bash
# 1. Update .env
NEXTAUTH_URL=http://your-vps-ip:3000

# 2. Build & run
./docker-build-latest.sh
./docker-secure.sh up

# 3. Access
http://your-vps-ip:3000
```

### Opsi 2: VPS + Domain (No SSL)

```bash
# 1. Setup DNS A Record
# your-domain.com → VPS IP

# 2. Update .env
NEXTAUTH_URL=http://your-domain.com

# 3. Build & run
./docker-build-latest.sh
./docker-secure.sh up

# 4. Access
http://your-domain.com
```

### Opsi 3: VPS + Domain + SSL (Let's Encrypt)

```bash
# 1. Setup DNS
# your-domain.com → VPS IP

# 2. Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# 3. Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 4. Copy certificates
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# 5. Update Nginx config untuk HTTPS
nano nginx/conf.d/app.conf
# Uncomment HTTPS server block

# 6. Update .env
NEXTAUTH_URL=https://your-domain.com

# 7. Build & run
./docker-build-latest.sh
./docker-secure.sh up

# 8. Setup auto-renewal
echo "0 0 * * * certbot renew --quiet && docker-compose -f docker-compose.secure.yml exec nginx nginx -s reload" | sudo crontab -
```

### Opsi 4: Cloudflare + Domain (Recommended)

```bash
# 1. Setup Cloudflare
# - Add domain to Cloudflare
# - Change nameservers
# - Add DNS A Record: @ → VPS IP (Proxy ON)
# - Add DNS A Record: www → VPS IP (Proxy ON)
# - SSL/TLS Mode: Full

# 2. Update Nginx for Cloudflare
cat > nginx/nginx.conf << 'EOF'
# Cloudflare IP whitelist
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
# ... (add all Cloudflare IPs)
real_ip_header CF-Connecting-IP;
EOF

# 3. Update .env
NEXTAUTH_URL=https://your-domain.com

# 4. Build & run
./docker-build-latest.sh
./docker-secure.sh up

# 5. Access (with Cloudflare DDoS protection)
https://your-domain.com
```

### Firewall Setup

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### Resource Limits (Optional)

Add to `docker-compose.secure.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "1"
          memory: 1G
```

---

## 📊 Monitoring

### Health Checks

```bash
# Check services
./docker-secure.sh status

# Test app endpoint
curl http://localhost:3000/api/health

# Check database
docker-compose exec db mysql -u root -p -e "SELECT 1"

# Container stats
docker stats
```

### View Logs

```bash
# Real-time logs
./docker-secure.sh logs -f

# Filter errors
./docker-secure.sh logs app | grep -i error

# Last 100 lines
docker-compose -f docker-compose.secure.yml logs --tail=100 app
```

### Security Monitoring

```bash
# Banned IPs
./docker-secure.sh banned

# Fail2ban status
./docker-secure.sh shell fail2ban
fail2ban-client status

# Nginx access log
./docker-secure.sh logs nginx | grep -v "GET /health"

# Failed login attempts
./docker-secure.sh logs app | grep "Failed login"
```

### Daily Security Report

Create monitoring script:

```bash
cat > /usr/local/bin/security-report.sh << 'EOF'
#!/bin/bash
echo "=== Security Report $(date) ==="
echo ""
echo "Banned IPs:"
docker exec ukk_fail2ban fail2ban-client status 2>/dev/null || echo "Fail2ban not running"
echo ""
echo "Container Status:"
docker-compose -f docker-compose.secure.yml ps
echo ""
echo "Recent Errors (last 10):"
docker logs ukk_app 2>&1 | grep -i error | tail -10
EOF

chmod +x /usr/local/bin/security-report.sh
```

---

## 🐛 Troubleshooting

### ❌ Error: `npm error code ECONNRESET`

**Penyebab:** Network timeout saat download packages

**Solusi:**

```bash
# 1. Clean Docker
./docker-secure.sh clean
docker system prune -a -f

# 2. Build ulang dengan no-cache
./docker-build-latest.sh
# Pilih mode 2 (no cache)

# 3. Jika masih error, cek koneksi internet
ping -c 3 registry.npmjs.org
```

### ❌ Error: Database Connection Failed

**Penyebab:** DATABASE_URL salah atau database belum ready

**Solusi:**

```bash
# 1. Cek .env
cat .env | grep DATABASE_URL
# Harus: mysql://root:password@db:3306/ukk_project_management
# Bukan: mysql://root:password@localhost:3306/...

# 2. Cek database status
docker-compose ps

# 3. Wait for database (first start)
sleep 10

# 4. Restart app
docker-compose restart app
```

### ❌ Error: Port Already in Use

**Penyebab:** Port 3000/80 sudah dipakai

**Solusi:**

```bash
# 1. Find process
lsof -ti:3000
lsof -ti:80

# 2. Kill process
kill -9 $(lsof -ti:3000)

# 3. Atau ubah port di .env
APP_PORT=8080
```

### ❌ Nginx 502 Bad Gateway

**Penyebab:** App container tidak running atau network issue

**Solusi:**

```bash
# 1. Check app status
./docker-secure.sh status

# 2. Check app logs
./docker-secure.sh logs app

# 3. Restart app
docker-compose -f docker-compose.secure.yml restart app

# 4. Jika masih error, rebuild
./docker-secure.sh clean
./docker-build-latest.sh
./docker-secure.sh up
```

### ❌ Build Sangat Lama

**Penyebab:** First build memang lama, atau network lambat

**Solusi:**

```bash
# Normal: 5-10 menit untuk first build
# - Download Node.js image (~900MB)
# - Install npm packages
# - Build Next.js

# Build berikutnya lebih cepat (cache)

# Jika terlalu lama (>20 menit):
# 1. Cek koneksi internet
ping -c 3 google.com

# 2. Gunakan mode detail untuk lihat progress
./docker-build-latest.sh
# Pilih mode 3 (detailed build)
```

### ❌ Legitimate Traffic Blocked

**Penyebab:** Rate limit terlalu ketat atau IP kebanned

**Solusi:**

```bash
# 1. Check banned IPs
./docker-secure.sh banned

# 2. Unban IP
./docker-secure.sh unban YOUR_IP

# 3. Adjust rate limits
nano nginx/nginx.conf
# Ubah: rate=10r/s menjadi rate=20r/s

# 4. Reload
./docker-secure.sh nginx-reload
```

### ❌ Prisma Migration Failed

**Penyebab:** Database tidak ready atau schema error

**Solusi:**

```bash
# 1. Check database
./docker-secure.sh shell db
mysql -u root -p

# 2. Manual migrate
./docker-secure.sh shell app
npx prisma migrate deploy

# 3. Jika schema error, fix schema.prisma lalu:
npx prisma migrate dev --name fix_schema
```

---

## 🧪 Testing

### Test Rate Limiting

```bash
# Should get HTTP 429 after burst
for i in {1..50}; do
  curl -s -o /dev/null -w "Response: %{http_code}\n" http://localhost/
done
```

### Test DDoS Protection

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Rapid requests (should trigger Fail2ban)
ab -n 1000 -c 10 http://localhost/

# Check banned
./docker-secure.sh banned
```

### Test Bad Bot Blocking

```bash
# Should get HTTP 403
curl -A "nikto" http://localhost/
curl -A "sqlmap" http://localhost/
curl -A "masscan" http://localhost/
```

### Test SQL Injection Block

```bash
# Should get HTTP 403
curl "http://localhost/api/test?id=1%20union%20select"
curl "http://localhost/api/test?id=1'%20OR%20'1'='1"
```

---

## 📝 Deployment Checklist

### Local Development

- [x] Docker & Docker Compose installed
- [x] .env configured
- [x] Build: `./docker-build-latest.sh`
- [x] Run: `./docker-secure.sh up`
- [x] Test: http://localhost:3000

### Production (VPS)

- [ ] VPS dengan 2GB RAM minimum
- [ ] Docker installed
- [ ] Port 80, 443 terbuka
- [ ] Domain setup (jika ada)
- [ ] SSL certificate (Let's Encrypt)
- [ ] .env updated (production values)
- [ ] Strong passwords
- [ ] Firewall configured
- [ ] Backup scheduled
- [ ] Monitoring enabled

### Security

- [ ] NEXTAUTH_SECRET changed (32+ chars)
- [ ] DB_ROOT_PASSWORD changed
- [ ] Rate limits configured
- [ ] Fail2ban enabled
- [ ] Network isolation verified
- [ ] SSL/TLS enabled (production)
- [ ] Security headers enabled
- [ ] Bad bot blocking active

---

## 📚 File Structure

```
ukk/
├── DockerFile                      # Multi-stage build (node:latest)
├── .dockerignore                   # Build exclusions
├── .env                            # Environment variables
├── docker-compose.yml              # Standard setup
├── docker-compose.secure.yml       # Secure setup (recommended)
├── docker-build-latest.sh          # Interactive build script
├── docker-secure.sh                # Security management script
├── docker-commands.sh              # Quick reference
├── DOCKER_GUIDE.md                 # This file (complete guide)
├── nginx/
│   ├── nginx.conf                  # Main Nginx config
│   └── conf.d/
│       └── app.conf                # App-specific config
├── fail2ban/
│   └── config/
│       ├── jail.local              # Fail2ban jails
│       └── filter.d/               # Custom filters
└── mysql-config/
    └── my.cnf                      # MySQL config
```

---

## 🎯 Performance Tips

### Docker Build Performance

1. **Use Build Cache**

   - Jangan ubah `package.json` jika tidak perlu
   - Cache akan pakai ulang untuk build lebih cepat

2. **Multi-stage Build**

   - Stage 1 & 2 untuk build (cached)
   - Stage 3 hanya runtime (kecil & cepat)

3. **NPM Mirror**
   - Menggunakan `registry.npmmirror.com`
   - Download lebih cepat (Asia region)

### Runtime Performance

1. **Resource Limits**

   ```yaml
   resources:
     limits:
       cpus: "2"
       memory: 2G
   ```

2. **Enable HTTP/2**

   ```nginx
   listen 443 ssl http2;
   ```

3. **MySQL Tuning**
   ```ini
   innodb_buffer_pool_size = 2G
   max_connections = 1000
   ```

### Monitoring Performance

```bash
# Container stats
docker stats

# App performance
curl -w "@curl-format.txt" http://localhost/

# Database queries
SHOW PROCESSLIST;
SHOW STATUS;
```

---

## 🆘 Emergency Procedures

### Under Active DDoS Attack

```bash
# 1. Check attack source
./docker-secure.sh logs nginx | tail -100

# 2. View banned IPs
./docker-secure.sh banned

# 3. Temporarily block all traffic
docker-compose -f docker-compose.secure.yml stop nginx

# 4. Increase rate limits strictness
nano nginx/nginx.conf
# Change: rate=10r/s → rate=1r/s

# 5. Restart with new limits
./docker-secure.sh nginx-reload
./docker-secure.sh restart
```

### Recovery from Attack

```bash
# 1. Clear all bans
./docker-secure.sh shell fail2ban
fail2ban-client unban --all

# 2. Clear Nginx cache
rm -rf nginx/cache/*

# 3. Restart all services
./docker-secure.sh restart

# 4. Monitor logs
./docker-secure.sh logs -f
```

### Complete System Reset

```bash
# ⚠️ WARNING: Ini akan HAPUS semua data!

# 1. Stop all containers
./docker-secure.sh down

# 2. Remove volumes (DATABASE AKAN HILANG!)
docker-compose -f docker-compose.secure.yml down -v

# 3. Clean Docker
docker system prune -a -f --volumes

# 4. Rebuild
./docker-build-latest.sh

# 5. Start fresh
./docker-secure.sh up

# 6. Restore database backup (jika ada)
docker-compose exec -T db mysql -u root -p < backup.sql
```

---

## 📖 Additional Resources

### Documentation

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
- [Nginx Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)
- [Fail2ban Configuration](https://www.fail2ban.org/wiki/)

### Tools

- [Docker Hub - Node.js](https://hub.docker.com/_/node)
- [Let's Encrypt](https://letsencrypt.org/)
- [Cloudflare](https://www.cloudflare.com/)

### Security

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [MySQL Security](https://dev.mysql.com/doc/refman/8.0/en/security.html)

---

## 💬 Support

### Quick Help

```bash
# Show all commands
./docker-commands.sh

# Check status
./docker-secure.sh status

# View logs
./docker-secure.sh logs

# Emergency stop
./docker-secure.sh down
```

### Common Solutions

1. **Build error** → `docker system prune -a -f` → rebuild
2. **Database error** → Check .env DATABASE_URL
3. **Port error** → `lsof -ti:PORT | xargs kill -9`
4. **Network error** → Check internet → use mode 2 (no cache)

---

## ✅ Summary

### What's Included

✅ **Dockerfile** - Node.js latest dengan network retry  
✅ **Multi-stage Build** - Optimized size (~300MB)  
✅ **Network Retry** - 10x retry, 5min timeout  
✅ **NPM Mirror** - Fast download (Asia)  
✅ **Security Layers** - Nginx + Fail2ban + Isolation  
✅ **DDoS Protection** - Auto IP banning  
✅ **Rate Limiting** - Protect from abuse  
✅ **SSL/TLS Support** - Let's Encrypt ready  
✅ **Cloudflare Ready** - Full integration  
✅ **Monitoring** - Logs + Health checks  
✅ **Easy Management** - Interactive scripts  
✅ **Full Documentation** - This guide

### Ready to Deploy! 🚀

```bash
# Development
./docker-build-latest.sh
./docker-secure.sh up

# Production
# 1. Setup domain + SSL
# 2. Update .env
# 3. Build & run
# 4. Monitor

# Access
http://localhost:3000 (or your domain)
```

---

**Happy Deploying! 🎉**

_Last Updated: 12 November 2025_
