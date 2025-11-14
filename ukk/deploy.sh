#!/bin/bash

# Production Deployment Script for UKK Project Management
# This script handles the complete deployment process

set -e # Exit on error

echo "🚀 Starting production deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Push database schema (comment out if using migrations)
echo -e "${YELLOW}🗄️  Syncing database schema...${NC}"
npx prisma db push --accept-data-loss
echo -e "${GREEN}✅ Database schema synced${NC}"
echo ""

# Optional: Seed database (uncomment if needed)
# echo -e "${YELLOW}🌱 Seeding database...${NC}"
# npx prisma db seed
# echo -e "${GREEN}✅ Database seeded${NC}"
# echo ""

# Type check
echo -e "${YELLOW}🔍 Running TypeScript type check...${NC}"
npm run type-check
echo -e "${GREEN}✅ Type check passed${NC}"
echo ""

# Build application
echo -e "${YELLOW}🏗️  Building production application...${NC}"
NODE_ENV=production npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Create logs directory
mkdir -p logs

# Stop existing PM2 process if running
echo -e "${YELLOW}🔄 Stopping existing processes...${NC}"
pm2 stop ukk-project-management 2>/dev/null || echo "No existing process to stop"
pm2 delete ukk-project-management 2>/dev/null || echo "No existing process to delete"
echo ""

# Start with PM2
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
pm2 start ecosystem.config.js
echo ""

# Save PM2 configuration
echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
pm2 save
echo ""

# Setup PM2 startup script
echo -e "${YELLOW}⚙️  Setting up PM2 startup script...${NC}"
pm2 startup || echo "PM2 startup already configured"
echo ""

# Show status
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Application status:"
pm2 status
echo ""
echo "To view logs, run: pm2 logs ukk-project-management"
echo "To monitor: pm2 monit"
echo "To restart: pm2 restart ukk-project-management"
echo ""
echo -e "${GREEN}🎉 Your application is now running in production mode!${NC}"
