# ChargePay VPS Deployment Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database (Neon, Supabase, or self-hosted)
- PM2 for process management: `npm install -g pm2`
- Git for version control

---

## Quick Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/chargepay.git
cd chargepay
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Set your database URL:
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

### 3. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Git Auto-Deployment Setup

### On Your VPS:

1. **Create a bare Git repository:**
```bash
mkdir -p /var/www/chargepay.git
cd /var/www/chargepay.git
git init --bare
```

2. **Create the application directory:**
```bash
mkdir -p /var/www/chargepay
```

3. **Set up the post-receive hook:**
```bash
cp post-receive.hook /var/www/chargepay.git/hooks/post-receive
chmod +x /var/www/chargepay.git/hooks/post-receive
```

### On Your Local Machine:

4. **Add VPS as a remote:**
```bash
git remote add production user@your-vps-ip:/var/www/chargepay.git
```

5. **Deploy with a push:**
```bash
git push production main
```

Every push to the `main` branch will automatically:
- Pull the latest code
- Install dependencies
- Build the production bundle
- Restart the application

---

## Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/chargepay`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve QR images directly
    location /uploads/ {
        alias /var/www/chargepay/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/chargepay /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### SSL with Let's Encrypt:
```bash
certbot --nginx -d your-domain.com
```

---

## PM2 Process Management

### Common Commands:

```bash
# View logs
pm2 logs chargepay

# Restart application
pm2 restart chargepay

# Stop application
pm2 stop chargepay

# Monitor all processes
pm2 monit

# View status
pm2 status

# Set PM2 to start on boot
pm2 startup
pm2 save
```

---

## Database Setup

### Option 1: Neon (Recommended - Serverless)

1. Create account at https://neon.tech
2. Create a new project
3. Copy the connection string to `.env`

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb chargepay
sudo -u postgres createuser chargepay_user

# Set password
sudo -u postgres psql -c "ALTER USER chargepay_user PASSWORD 'your_password';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE chargepay TO chargepay_user;"
```

---

## Health Checks

The application exposes the following endpoints for monitoring:

- `GET /api/dashboard/stats` - Returns basic stats (useful for health checks)
- `GET /api/settings` - Returns settings (auth required)

### Example health check script:

```bash
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/dashboard/stats)
if [ "$response" = "200" ]; then
    echo "ChargePay is healthy"
    exit 0
else
    echo "ChargePay is down! Status: $response"
    exit 1
fi
```

---

## Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

---

## Troubleshooting

### Application won't start:
```bash
# Check PM2 logs
pm2 logs chargepay --lines 100

# Check if port is in use
lsof -i :5000
```

### Database connection issues:
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Permission issues:
```bash
# Fix upload directory permissions
chmod -R 755 /var/www/chargepay/uploads
chown -R www-data:www-data /var/www/chargepay/uploads
```

---

## Production Checklist

- [ ] Environment variables configured in `.env`
- [ ] Database connection working
- [ ] PM2 running and set to restart on boot
- [ ] Nginx configured with SSL
- [ ] Firewall configured
- [ ] Uploads directory has correct permissions
- [ ] Git auto-deployment hook installed
- [ ] Health monitoring set up
