# 🐳 Docker Files - Quick Reference

## 📁 File Structure

```
ukk/
├── DOCKER_GUIDE.md               # 📖 Complete documentation (READ THIS FIRST!)
├── DockerFile                    # 🐳 Multi-stage build (node:latest)
├── .dockerignore                 # 🚫 Build exclusions
├── .env                          # ⚙️  Environment variables
│
├── docker-compose.yml            # 🔵 Standard setup
├── docker-compose.secure.yml     # 🔐 Secure setup (RECOMMENDED)
│
└── docker.sh                     # � ALL-IN-ONE script (Build, Deploy, Manage)
```

---

## ⚡ Quick Start

### 1️⃣ Build

```bash
./docker.sh build
```

### 2️⃣ Run

```bash
# Secure (RECOMMENDED - with Nginx + Fail2ban)
./docker.sh up
```

### 3️⃣ Access

- Secure: http://localhost

---

## 📖 Documentation

### Main Guide

**[DOCKER_GUIDE.md](DOCKER_GUIDE.md)** - Complete guide dengan:

- ✅ Quick start
- ✅ Architecture
- ✅ Security features
- ✅ Commands reference
- ✅ Configuration
- ✅ Production deployment
- ✅ Monitoring
- ✅ Troubleshooting

### Quick Commands

```bash
./docker.sh commands
```

---

## 🔧 Common Commands

```bash
# Build
./docker.sh build

# Start (secure)
./docker.sh up

# Stop
./docker.sh down

# Logs
./docker.sh logs app

# Status
./docker.sh status

# Shell
./docker.sh shell app

# Clean
./docker.sh clean

# Quick reference
./docker.sh commands
```

---

## 🎯 Which File to Use?

### For Build

- `docker-build-latest.sh` ⭐ **Interactive, recommended**
- `docker-compose build` - Manual

### For Run

- `./docker-secure.sh` ⭐ **Security enabled, recommended**
- `docker-compose up -d` - Standard (no security)

### For Help

- `DOCKER_GUIDE.md` ⭐ **Complete guide**
- `./docker-commands.sh` - Quick reference

---

## 🔐 Security

**docker-compose.secure.yml** includes:

- ✅ Nginx reverse proxy
- ✅ Rate limiting (10 req/s)
- ✅ Fail2ban DDoS protection
- ✅ Network isolation
- ✅ Bad bot blocking
- ✅ Auto IP banning

**Use secure setup for production!**

---

## 📚 Documentation Breakdown

| File                   | Purpose                     | When to Read                       |
| ---------------------- | --------------------------- | ---------------------------------- |
| **README-DOCKER.md**   | This file - Quick reference | First time, quick lookup           |
| **DOCKER_GUIDE.md**    | Complete guide (21KB)       | Setup, deployment, troubleshooting |
| **docker-commands.sh** | Command cheatsheet          | Need specific command              |

---

## 🚀 Next Steps

1. **Read**: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
2. **Build**: `./docker-build-latest.sh`
3. **Run**: `./docker-secure.sh up`
4. **Access**: http://localhost

---

## 💡 Tips

- First build takes 5-10 minutes (normal)
- Use `docker-compose.secure.yml` for production
- Check logs: `./docker-secure.sh logs`
- Get help: `./docker-commands.sh`

---

**Need detailed help? Read [DOCKER_GUIDE.md](DOCKER_GUIDE.md)** 📖
