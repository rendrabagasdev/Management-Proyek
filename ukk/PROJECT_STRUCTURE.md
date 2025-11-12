# 📁 Project Structure

## Active Files (PM2 Deployment)

```
ukk/
├── app/                          # Next.js pages & routes
├── components/                   # React components
├── lib/                          # Utility functions
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
├── public/                       # Static assets
├── .env                          # Environment variables
├── package.json                  # Dependencies
├── next.config.ts                # Next.js config
├── deploy-vps.sh                 # 🚀 VPS deployment script
├── nginx-cloudflare.conf.template # Nginx config template
├── DEPLOY_VPS_NO_DOCKER.md       # Deployment guide
└── SETUP-DOMAIN-CLOUDFLARE.md    # Domain setup guide
```

## Backup Files (Not Used)

```
.docker-backup/                   # Old Docker configs
├── DockerFile.backup
├── docker-compose.yml.backup
├── docker.sh.backup
├── nginx/                        # Docker nginx config
├── fail2ban/                     # Docker fail2ban config
└── mysql-config/                 # Docker MySQL config
```

**Note**: Docker files are backed up but not used. Production uses PM2 + System Nginx.

---

## 🚀 Quick Start

### Local Development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### VPS Deployment

```bash
./deploy-vps.sh
# Choose option 1 for full setup
```

---

## 📋 Key Files

| File                             | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `deploy-vps.sh`                  | Auto-deploy to VPS (PM2 + Nginx)   |
| `nginx-cloudflare.conf.template` | Production Nginx config            |
| `DEPLOY_VPS_NO_DOCKER.md`        | Complete deployment guide          |
| `.env`                           | Environment variables (not in git) |
| `prisma/schema.prisma`           | Database schema                    |
| `prisma/seed.js`                 | Database seeder                    |

---

## 🔧 Configuration

### Local (Development)

- Database: `mysql://root:password@localhost:3306/db_name`
- Port: `3000`
- Hot reload: ✅

### VPS (Production)

- Database: `mysql://ukk_user:password@localhost:3306/db_name`
- Port: `3000` (internal)
- Nginx: Port `80/443` (public)
- Process Manager: PM2
- Auto-restart: ✅
- SSL: Cloudflare Origin Certificate

---

## 🗑️ Removed (Docker Not Used)

The following are **backed up** but not used in production:

- ❌ `DockerFile` → Use PM2 instead
- ❌ `docker-compose.yml` → Use system services
- ❌ `nginx/` folder → Use system Nginx (`/etc/nginx/`)
- ❌ `fail2ban/` folder → Optional, can install system-wide
- ❌ `mysql-config/` folder → Use system MySQL config

**Why removed?**

- ✅ Faster deployment (30 sec vs 2-3 min)
- ✅ Easier debugging (direct access)
- ✅ Tailwind CSS always works
- ✅ Less complexity
- ✅ Lower resource usage

---

## 📝 Notes

- All Docker files are in `.docker-backup/` (gitignored)
- Can restore Docker setup if needed
- Current setup is production-ready with PM2
- Cloudflare SSL fully supported
- Rate limiting via system Nginx
