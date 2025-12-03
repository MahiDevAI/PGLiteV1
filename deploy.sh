#!/bin/bash

# ChargePay Deployment Script
# Usage: ./deploy.sh

set -e

echo "=== ChargePay Deployment ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure your database:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm ci --production=false

echo -e "${YELLOW}Step 2: Building production bundle...${NC}"
npm run build

echo -e "${YELLOW}Step 3: Pushing database schema...${NC}"
npx drizzle-kit push

echo -e "${YELLOW}Step 4: Creating logs directory...${NC}"
mkdir -p logs

echo -e "${YELLOW}Step 5: Starting application with PM2...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 delete chargepay 2>/dev/null || true
    pm2 start ecosystem.config.cjs --env production
    pm2 save
    echo -e "${GREEN}Application started with PM2!${NC}"
    echo ""
    echo "Useful PM2 commands:"
    echo "  pm2 logs chargepay    - View logs"
    echo "  pm2 restart chargepay - Restart app"
    echo "  pm2 stop chargepay    - Stop app"
    echo "  pm2 monit             - Monitor all apps"
else
    echo -e "${YELLOW}PM2 not installed. Starting with Node directly...${NC}"
    echo "For production, install PM2: npm install -g pm2"
    NODE_ENV=production node dist/index.cjs
fi

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo "Application running on port ${PORT:-5000}"
