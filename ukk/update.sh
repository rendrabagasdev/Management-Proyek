#!/bin/bash

# Quick Update Script - For when you only need to update code without full deployment
# Use this for quick updates after initial deployment

set -e

echo "🔄 Quick update starting..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Pull latest changes (if using Git)
# echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
# git pull
# echo ""

# Install/update dependencies
echo -e "${YELLOW}📦 Updating dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies updated${NC}"
echo ""

# Rebuild application
echo -e "${YELLOW}🏗️  Rebuilding application...${NC}"
NODE_ENV=production npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Reload PM2
echo -e "${YELLOW}🔄 Reloading application...${NC}"
pm2 reload ukk-project-management
echo -e "${GREEN}✅ Application reloaded${NC}"
echo ""

echo -e "${GREEN}✅ Update completed!${NC}"
pm2 status
