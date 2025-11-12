# 🐳 Docker Quick Start Guide

## ✅ What's Fixed

### 1. **Tailwind CSS v4 Styling Issue** ✨

- **Problem**: CSS tidak muncul di production build
- **Solution**:
  - Dockerfile sekarang explicitly copy `.next/static` dengan lengkap
  - Verifikasi CSS generation di build stage
  - Node.js 20 (pinned version) untuk stability

### 2. **Prisma Seeder Issue** 🌱

- **Problem**: `npx prisma db seed` gagal
- **Solution**:
  - Sekarang pakai: `node prisma/seed.js` (langsung)
  - Prisma client & dependencies di-copy ke production image
  - Package.json sudah ada config: `"prisma": { "seed": "node prisma/seed.js" }`

### 3. **Unified Docker Compose** 🔄

- **Old**: `docker-compose.yml` (simple) + `docker-compose.secure.yml` (production)
- **New**: Satu file `docker-compose.yml` dengan 2 mode:
  - **Simple Mode**: Direct access (dev/test)
  - **Secure Mode**: Nginx + Fail2ban + Cloudflare ready (production)

---

## 🚀 Quick Commands

### First Time Setup (Recommended)

```bash
# Interactive: Build + Start + Migrate + Seed
./docker.sh quickstart
```

Pilih mode saat ditanya:

- **Mode 1 (Simple)**: Langsung akses `http://localhost:3000`
- **Mode 2 (Secure)**: Akses via Nginx `http://localhost` [RECOMMENDED untuk VPS]

### Manual Steps

```bash
# 1. Build image
./docker.sh build

# 2. Start services (akan ditanya mode)
./docker.sh up

# 3. Check status
./docker.sh status

# 4. View logs
./docker.sh logs app
./docker.sh logs nginx
```

---

## 🎯 Mode Comparison

| Feature        | Simple Mode      | Secure Mode            |
| -------------- | ---------------- | ---------------------- |
| **Access**     | `localhost:3000` | `localhost:80` (Nginx) |
| **MySQL Port** | `3307` exposed   | Internal only          |
| **Security**   | ❌ None          | ✅ Nginx + Fail2ban    |
| **Cloudflare** | ❌ Not ready     | ✅ Ready (SSL proxy)   |
| **Use Case**   | Local dev/test   | Production VPS         |

---

## 🔧 Troubleshooting

### ❌ Tailwind CSS masih tidak muncul?

```bash
# 1. Clean build
./docker.sh clean
docker system prune -a -f

# 2. Rebuild dari scratch
./docker.sh build  # Pilih mode 2 (no cache)

# 3. Check CSS files di container
docker exec ukk_app ls -lah .next/static/css/
```

### ❌ Seeder error?

```bash
# Check seed file
docker exec ukk_app node prisma/seed.js

# Manual seed
docker-compose exec app node prisma/seed.js
```

### ❌ Port already in use?

```bash
# Stop all
./docker.sh down

# Kill process (contoh port 3000)
lsof -ti:3000 | xargs kill -9

# Start again
./docker.sh up
```

---

## 📋 Architecture

### Simple Mode

```
User → App:3000 → MySQL:3307
```

### Secure Mode (Production)

```
Internet/Cloudflare
    ↓
Nginx:80/443 (Rate limit, DDoS protection)
    ↓
Fail2ban (Auto-ban malicious IPs)
    ↓
App:3000 (Internal network only)
    ↓
MySQL:3306 (Internal network only)
```

---

## 🎨 Tailwind CSS v4 Notes

- **No config file needed** (tailwind.config.ts tidak perlu)
- **Auto setup**: `@import "tailwindcss"` di `globals.css`
- **Build**: Next.js 16 + Vite handle otomatis
- **Dependencies**: `@tailwindcss/postcss` & `tailwindcss` harus di `devDependencies`

---

## 🔐 Security Features (Secure Mode)

- ✅ Nginx reverse proxy
- ✅ Rate limiting (10 req/s general, 20 req/s API)
- ✅ Fail2ban auto IP banning
- ✅ Network isolation (backend internal only)
- ✅ Non-root user in containers
- ✅ Health checks
- ✅ Cloudflare SSL ready

---

## 📦 What's Included

- **Node.js 20** (pinned, not "latest")
- **Next.js 16** (standalone mode)
- **Tailwind CSS v4** (Vite-based)
- **Prisma** (MySQL client)
- **MySQL 8.0**
- **Nginx Alpine** (lightweight)
- **Fail2ban** (security)

---

## 🆘 Need Help?

```bash
./docker.sh help      # Full documentation
./docker.sh commands  # Quick reference
./docker.sh status    # Check container status
```

---

## 🎯 Production Checklist

Before deploying to VPS:

- [ ] Set strong `NEXTAUTH_SECRET` di `.env`
- [ ] Set strong `DB_ROOT_PASSWORD` & `DB_PASSWORD`
- [ ] Configure SSL certificates di `nginx/ssl/`
- [ ] Setup Cloudflare DNS (if using)
- [ ] Configure fail2ban email alerts
- [ ] Test security: `./docker.sh test`
- [ ] Backup database: `./docker.sh backup` (TODO)

---

**Created**: Nov 2025  
**Docker Compose**: v3.8  
**Node.js**: 20-slim (builder), 20-alpine (runner)
