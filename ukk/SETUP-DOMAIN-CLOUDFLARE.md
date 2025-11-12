# 🌐 Setup Domain + Cloudflare (Production Ready)

> **Complete guide untuk setup domain dengan Cloudflare (support subdomain)**

---

## 📋 Yang Kamu Butuhkan

- ✅ Domain (beli dari Namecheap, Niagahoster, GoDaddy, dll)
- ✅ VPS dengan IP public (DigitalOcean, Vultr, AWS, dll)
- ✅ Akun Cloudflare (gratis)
- ✅ Docker sudah terinstall di VPS

---

## 🚀 Quick Start (30 Menit)

### Step 1: Beli Domain (5 menit)

**Recommended providers:**

- [Namecheap](https://namecheap.com) - $8-12/year
- [Niagahoster](https://niagahoster.co.id) - Rp 15k-50k/year
- [Cloudflare Registrar](https://cloudflare.com/products/registrar) - Harga at-cost

**Contoh domain:**

- `yourproject.com`
- `yourname.tech`
- `yourapp.id`

### Step 2: Setup Cloudflare (10 menit)

#### 2.1 Connect Domain ke Cloudflare

**UI Baru (2025):**

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pilih **"Connect a domain"** atau **"Register a domain"**
   - **Connect a domain** → Kalau sudah punya domain (recommended)
   - **Register a domain** → Kalau mau beli domain langsung di Cloudflare
3. Masukkan domain kamu: `yourproject.com`
4. Click **Continue** atau **Add site**
5. Pilih **Free Plan** (sudah cukup untuk production!)
6. Click **Continue**

**Atau UI Lama:**

Kalau UI kamu masih yang lama:

1. Click **Add Site** di dashboard
2. Masukkan domain
3. Pilih Free Plan
4. Continue

#### 2.2 Update Nameservers

Cloudflare akan kasih 2 nameservers, contoh:

```
brenda.ns.cloudflare.com
neil.ns.cloudflare.com
```

**Update di domain provider:**

**Namecheap:**

1. Login → Domain List
2. Click domain → Manage
3. Nameservers → Custom DNS
4. Masukkan 2 nameservers dari Cloudflare
5. Save

**Niagahoster:**

1. Login → Layanan Saya
2. Click domain
3. Name Server → Custom
4. Masukkan nameservers Cloudflare
5. Simpan

⏳ **Wait 5-30 menit** untuk propagasi DNS

#### 2.3 Setup DNS Records

Di Cloudflare Dashboard → DNS → Records:

**Main Domain:**

```
Type: A
Name: @
Content: [VPS_IP_KAMU]
Proxy status: ✅ Proxied (orange cloud)
TTL: Auto
```

**WWW Subdomain:**

```
Type: A
Name: www
Content: [VPS_IP_KAMU]
Proxy status: ✅ Proxied
TTL: Auto
```

**API Subdomain (optional):**

```
Type: A
Name: api
Content: [VPS_IP_KAMU]
Proxy status: ✅ Proxied
TTL: Auto
```

**Admin Subdomain (optional):**

```
Type: A
Name: admin
Content: [VPS_IP_KAMU]
Proxy status: ✅ Proxied
TTL: Auto
```

✅ **Proxy Status = ON (orange cloud)** → DDoS protection + CDN
❌ **Proxy Status = OFF (grey cloud)** → Direct to VPS (no protection)

### Step 3: Setup SSL/TLS di Cloudflare

**SSL/TLS Settings:**

1. Cloudflare Dashboard → SSL/TLS
2. **SSL/TLS encryption mode:** Full (strict) ⭐ **RECOMMENDED**
3. Edge Certificates:
   - ✅ Always Use HTTPS: ON
   - ✅ Automatic HTTPS Rewrites: ON
   - ✅ Minimum TLS Version: 1.2
   - ✅ TLS 1.3: ON

### Step 4: Setup VPS (15 menit)

#### 4.1 Login ke VPS

```bash
ssh root@[VPS_IP]
```

#### 4.2 Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify
docker --version
docker-compose --version
```

#### 4.3 Setup Firewall

```bash
# Install UFW
apt install ufw -y

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Enable firewall
ufw enable

# Check status
ufw status
```

#### 4.4 Clone Project

```bash
# Clone your project
git clone https://github.com/your-username/your-repo.git
cd your-repo/ukk
```

#### 4.5 Setup Environment

```bash
# Edit .env
nano .env
```

**Update these values:**

```env
# Database
DATABASE_URL="mysql://root:STRONG_PASSWORD@db:3306/ukk_project_management"
DB_ROOT_PASSWORD=STRONG_PASSWORD

# NextAuth (PENTING!)
NEXTAUTH_URL=https://yourproject.com
NEXTAUTH_SECRET=GENERATE_NEW_SECRET_32_CHARS_MIN

# App
APP_PORT=3000
NODE_ENV=production

# Firebase (existing config - no change)
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... (keep existing Firebase config)
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

#### 4.6 Update Nginx Config untuk Cloudflare

```bash
nano nginx/nginx.conf
```

Add Cloudflare IPs untuk real IP detection:

```nginx
# Cloudflare IP whitelist
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2c0f:f248::/32;
set_real_ip_from 2a06:98c0::/29;

real_ip_header CF-Connecting-IP;
```

Update server block untuk domain:

```nginx
server {
    listen 80;
    server_name yourproject.com www.yourproject.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req zone=general burst=20 nodelay;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;

        # Cloudflare headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4.7 Build & Deploy

```bash
# Build Docker images
./docker.sh build

# Start services
./docker.sh up

# Check status
./docker.sh status

# View logs
./docker.sh logs app
```

---

## 🎯 Setup Subdomain

### Untuk Subdomain Berbeda (Misalnya: api.yourproject.com)

#### 1. Add DNS Record di Cloudflare

```
Type: A
Name: api
Content: [VPS_IP_KAMU]
Proxy: ✅ Proxied
```

#### 2. Update Nginx Config

```bash
nano nginx/conf.d/api.conf
```

```nginx
server {
    listen 80;
    server_name api.yourproject.com;

    location / {
        proxy_pass http://app:3000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. Reload Nginx

```bash
./docker.sh nginx-reload
```

### Subdomain untuk Service Berbeda

Jika punya service lain (misalnya admin panel terpisah):

#### 1. Add DNS Record

```
Type: A
Name: admin
Content: [VPS_IP_KAMU]
Proxy: ✅ Proxied
```

#### 2. Run Service di Port Berbeda

```bash
# docker-compose.admin.yml
services:
  admin:
    build: ./admin
    ports:
      - "3001:3000"
```

#### 3. Add Nginx Config

```nginx
server {
    listen 80;
    server_name admin.yourproject.com;

    location / {
        proxy_pass http://admin:3001;
        # ... (same proxy settings)
    }
}
```

---

## 🔐 Security Best Practices

### 1. Cloudflare Security Settings

**Security → WAF:**

- ✅ Security Level: Medium atau High
- ✅ Challenge Passage: 30 minutes
- ✅ Browser Integrity Check: ON

**Security → Bots:**

- ✅ Bot Fight Mode: ON (Free Plan)
- ✅ Super Bot Fight Mode: ON (jika Pro Plan)

**Firewall Rules (Free: 5 rules):**

**Block known bad countries (optional):**

```
(ip.geoip.country in {"CN" "RU" "KP"})
Action: Block
```

**Rate limiting for login:**

```
(http.request.uri.path contains "/api/auth/signin")
Action: Challenge (CAPTCHA)
```

### 2. Page Rules (Free: 3 rules)

**Force HTTPS:**

```
URL: http://*yourproject.com/*
Setting: Always Use HTTPS
```

**Cache static assets:**

```
URL: *yourproject.com/*.{jpg,jpeg,png,gif,css,js}
Settings:
  - Browser Cache TTL: 4 hours
  - Cache Level: Standard
```

### 3. Speed Settings

**Speed → Optimization:**

- ✅ Auto Minify: CSS, JavaScript, HTML
- ✅ Brotli: ON
- ✅ Early Hints: ON (if available)
- ✅ HTTP/2 to Origin: ON
- ✅ HTTP/3 (with QUIC): ON

---

## 📊 Monitoring

### Cloudflare Analytics

Dashboard → Analytics:

- Requests overview
- Bandwidth
- Threats mitigated
- Status codes

### Check Website Status

```bash
# From local machine
curl -I https://yourproject.com

# Check response headers
curl -v https://yourproject.com

# Test from different locations
https://tools.pingdom.com
https://www.webpagetest.org
```

### VPS Monitoring

```bash
# Check Docker status
./docker.sh status

# View logs
./docker.sh logs

# Check resource usage
docker stats

# Check disk space
df -h

# Check memory
free -h
```

---

## 🧪 Testing

### Test Main Domain

```bash
curl https://yourproject.com
curl https://www.yourproject.com
```

### Test Subdomain

```bash
curl https://api.yourproject.com
curl https://admin.yourproject.com
```

### Test SSL

```bash
# Check SSL certificate
openssl s_client -connect yourproject.com:443 -servername yourproject.com

# Or use online tool
https://www.ssllabs.com/ssltest/
```

### Test Performance

```bash
# Speed test
curl -w "@curl-format.txt" -o /dev/null -s https://yourproject.com

# Where curl-format.txt contains:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

---

## 🐛 Troubleshooting

### Website Not Accessible

1. **Check DNS propagation:**

   ```bash
   nslookup yourproject.com
   dig yourproject.com
   ```

   Or use: https://dnschecker.org

2. **Check Cloudflare status:**

   - Cloudflare Dashboard → Overview
   - Status should be "Active"

3. **Check VPS firewall:**

   ```bash
   ufw status
   # Should allow 80 and 443
   ```

4. **Check Docker:**
   ```bash
   ./docker.sh status
   ./docker.sh logs nginx
   ```

### SSL Error / Certificate Invalid

1. **Check Cloudflare SSL mode:**

   - Should be "Full (strict)"

2. **Wait for certificate:**

   - First time setup bisa 15-30 menit
   - Check: SSL/TLS → Edge Certificates

3. **Force HTTPS:**
   - Enable "Always Use HTTPS"

### 522 Error (Connection Timed Out)

```bash
# Check if app is running
./docker.sh status

# Check if port is open
netstat -tuln | grep 80

# Check firewall
ufw status

# Restart services
./docker.sh restart
```

### 502 Bad Gateway

```bash
# Check app logs
./docker.sh logs app

# Check if app is running
docker ps

# Restart app
./docker.sh restart
```

### Real IP Not Showing (All IPs are Cloudflare)

- Make sure Nginx config has Cloudflare IP ranges
- Check `real_ip_header CF-Connecting-IP;`

---

## 📝 Maintenance Checklist

### Daily

- [ ] Check `./docker.sh status`
- [ ] Review `./docker.sh logs` for errors

### Weekly

- [ ] Check Cloudflare Analytics
- [ ] Review security threats
- [ ] Check disk space: `df -h`

### Monthly

- [ ] Update Docker images: `./docker.sh build`
- [ ] Review firewall rules
- [ ] Check SSL certificate expiry
- [ ] Update system: `apt update && apt upgrade`

### Backup (Weekly)

```bash
# Backup database
docker-compose exec db mysqldump -u root -p ukk_project_management > backup-$(date +%Y%m%d).sql

# Backup .env and configs
tar -czf config-backup-$(date +%Y%m%d).tar.gz .env nginx/ fail2ban/

# Upload to cloud storage (optional)
# aws s3 cp backup-*.sql s3://your-bucket/
```

---

## 💰 Cost Breakdown

### Minimal Setup

- **Domain:** $8-12/year (Namecheap) atau Rp 15k-50k/year (Niagahoster)
- **VPS:** $5-10/month (1GB RAM, DigitalOcean, Vultr)
- **Cloudflare:** FREE
- **SSL:** FREE (via Cloudflare)

**Total:** ~$8-10/month (~Rp 120k-150k/month)

### Recommended Setup

- **Domain:** $10-15/year
- **VPS:** $12-20/month (2GB RAM, better performance)
- **Cloudflare Pro:** $20/month (optional, extra features)

**Total:** ~$15-25/month

---

## 🚀 Example Complete Setup

### Your Project: `myproject.com`

**DNS Records:**

```
A    @       123.45.67.89    Proxied (orange)
A    www     123.45.67.89    Proxied
A    api     123.45.67.89    Proxied
A    admin   123.45.67.89    Proxied
```

**Nginx Config:**

```nginx
# Main app: myproject.com
server {
    listen 80;
    server_name myproject.com www.myproject.com;
    location / {
        proxy_pass http://app:3000;
    }
}

# API: api.myproject.com
server {
    listen 80;
    server_name api.myproject.com;
    location / {
        proxy_pass http://app:3000/api;
    }
}
```

**.env:**

```env
NEXTAUTH_URL=https://myproject.com
DATABASE_URL="mysql://root:strongpass@db:3306/myproject"
```

**Access:**

- Main: https://myproject.com
- API: https://api.myproject.com
- Admin: https://admin.myproject.com

---

## 📚 Additional Resources

### Documentation

- [Cloudflare Docs](https://developers.cloudflare.com)
- [Nginx Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

### Tools

- [DNS Checker](https://dnschecker.org)
- [SSL Test](https://www.ssllabs.com/ssltest/)
- [Speed Test](https://tools.pingdom.com)
- [Security Headers](https://securityheaders.com)

### Communities

- [Cloudflare Community](https://community.cloudflare.com)
- [r/selfhosted](https://reddit.com/r/selfhosted)
- [DigitalOcean Community](https://www.digitalocean.com/community)

---

## ✅ Quick Checklist

Setup checklist untuk deploy production:

- [ ] Domain dibeli
- [ ] Domain added ke Cloudflare
- [ ] Nameservers updated di domain provider
- [ ] DNS records added (A record untuk @ dan www)
- [ ] SSL/TLS mode set ke "Full (strict)"
- [ ] VPS setup (Docker installed)
- [ ] Firewall configured (80, 443 open)
- [ ] Project cloned ke VPS
- [ ] .env updated (NEXTAUTH_URL, secrets, dll)
- [ ] Nginx config updated (Cloudflare IPs, domain name)
- [ ] Build & deploy: `./docker.sh build && ./docker.sh up`
- [ ] Test website: https://yourdomain.com
- [ ] Test SSL: https://ssllabs.com
- [ ] Enable Cloudflare security features
- [ ] Setup monitoring & alerts
- [ ] Create backup script

---

**Need Help?**

- Check logs: `./docker.sh logs`
- Read full guide: `cat DOCKER_GUIDE.md`
- Test connection: `curl -v https://yourdomain.com`

**Happy Deploying! 🚀**

_Last updated: 12 November 2025_
