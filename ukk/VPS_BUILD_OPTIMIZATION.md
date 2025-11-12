# ⚡ VPS Build Speed Optimization Guide

## 🐌 Problem: Slow Builds on VPS

**Local Build**: 18.9 seconds  
**VPS Build**: 2-5 minutes (or more!)

---

## ✅ Applied Optimizations

### 1. **Dockerfile Caching Strategy**

```dockerfile
# Copy package.json FIRST (before source code)
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy Prisma schema SECOND
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code LAST
COPY . .
RUN npm run build
```

**Why?**: Docker caches layers. If you change source code, only the last layer rebuilds.

**Impact**:

- First build: ~2-3 min
- Rebuild (code change): ~30-60 sec ✅

---

### 2. **NPM Install Optimizations**

```bash
npm ci --prefer-offline --no-audit --no-fund
```

- `--prefer-offline`: Use cache first, reduce downloads
- `--no-audit`: Skip security audit (save 10-20 sec)
- `--no-fund`: Skip funding messages

**Impact**: ~20-30% faster npm install

---

### 3. **Docker BuildKit Cache Mount**

```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline
```

**Why?**: Reuse npm cache across builds (don't re-download packages)

**Impact**: 50% faster on rebuild

---

### 4. **.dockerignore (Critical!)**

Blocks 500MB+ of unnecessary files:

- `node_modules/` (will be reinstalled)
- `.next/` (will be rebuilt)
- `.git/` (300MB+)
- Documentation, tests, etc.

**Impact**:

- Upload to VPS: ~50MB instead of ~500MB
- 10x faster context transfer ✅

---

### 5. **Next.js Build Optimizations**

Already in `next.config.ts`:

- `output: "standalone"` → Smaller final bundle
- `ignoreBuildErrors: true` → Skip type check (faster)

**Impact**: ~10-20% faster build

---

## 🚀 How to Use on VPS

### Method 1: Docker Compose (Recommended)

```bash
# On VPS
git clone <repo>
cd ukk
./docker.sh quickstart
```

Docker will:

1. ✅ Use cached layers (if available)
2. ✅ Only rebuild changed parts
3. ✅ Reuse npm cache

### Method 2: Pre-build Locally (Fastest for VPS)

```bash
# On local machine
docker buildx build --platform linux/amd64 -t ukk-app:latest .
docker save ukk-app:latest | gzip > ukk-app.tar.gz

# Upload to VPS
scp ukk-app.tar.gz user@vps:/tmp/

# On VPS
docker load < /tmp/ukk-app.tar.gz
```

**Impact**: VPS doesn't need to build at all! ⚡

---

## 📊 Expected Build Times

| Scenario                  | Time      | Cache Used      |
| ------------------------- | --------- | --------------- |
| **First build (cold)**    | 2-3 min   | ❌ None         |
| **Rebuild (code change)** | 30-60 sec | ✅ npm + layers |
| **Rebuild (no changes)**  | 5-10 sec  | ✅ All cached   |
| **Pre-built image**       | 0 sec     | ✅ Skip build   |

---

## 🔧 VPS-Specific Tips

### 1. **Use Swap if Low RAM**

```bash
# On VPS (as root)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**Why?**: Next.js build needs ~1-2GB RAM. Swap prevents OOM kills.

---

### 2. **Enable BuildKit**

```bash
# Add to ~/.bashrc or /etc/environment
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

**Impact**: Parallel builds, better caching

---

### 3. **Prune Old Images**

```bash
# Free up space (VPS usually has limited disk)
docker system prune -a -f
docker volume prune -f
```

---

### 4. **Use Registry Mirror (Optional)**

If your VPS is in Asia:

```bash
# Add to /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://registry.npmmirror.com"
  ]
}

sudo systemctl restart docker
```

---

## 🎯 Best Strategy for VPS

### For Development/Testing:

```bash
# Build on VPS (with caching)
./docker.sh build
./docker.sh up
```

### For Production:

```bash
# Build locally, push to registry
docker build -t your-registry/ukk:latest .
docker push your-registry/ukk:latest

# On VPS: just pull
docker pull your-registry/ukk:latest
docker-compose up -d
```

---

## 📈 Monitoring Build Time

```bash
# Time the build
time ./docker.sh build

# Check layer sizes
docker history ukk_app

# Check cache usage
docker system df
```

---

## 🆘 Troubleshooting Slow Builds

### Issue: npm install stuck

**Solution**: Use `--prefer-offline` and cache mount (already in Dockerfile)

### Issue: Out of memory

**Solution**: Add swap (see above) or upgrade VPS

### Issue: Build always from scratch

**Solution**: Check `.dockerignore`, ensure BuildKit enabled

### Issue: Network timeout

**Solution**:

```bash
# In Dockerfile, add retry logic (already added)
ENV NPM_CONFIG_FETCH_RETRIES=10
ENV NPM_CONFIG_FETCH_TIMEOUT=300000
```

---

## 🎉 Result

**Before optimization**:

- VPS build: 5+ minutes
- Every code change: rebuild everything

**After optimization**:

- First build: ~2-3 min
- Code change: ~30-60 sec ✅
- Package change only: ~1-2 min
- No changes: ~5-10 sec (cache hit)

---

**Local**: 18.9s (no Docker overhead)  
**VPS (optimized)**: 30-60s (acceptable!) ✅
