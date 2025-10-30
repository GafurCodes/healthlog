# Docker Deployment Guide

This guide explains how to deploy HealthLog using Docker Compose on your DigitalOcean droplet.

## Prerequisites

- Docker and Docker Compose installed on your droplet
- A domain name pointing to your droplet IP
- Environment variables configured

## Setup Instructions

### 1. Clone and Configure

```bash
cd /var/www/healthlog
git clone <your-repo> .

# Copy environment template and update with production values
cp .env.example .env
nano .env  # Update with your production credentials
```

### 2. Environment Variables to Set

Edit `.env` and configure:

```
JWT_ACCESS_SECRET=<generate-secure-random-string>
JWT_REFRESH_SECRET=<generate-secure-random-string>
CORS_ORIGIN=https://yourdomain.com
EMAIL_FROM=noreply@healthlog.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
APP_BASE_URL=https://yourdomain.com
API_BASE_URL=https://yourdomain.com/api
VITE_API_BASE_URL=/api
LOG_LEVEL=info
```

To generate secure random strings:
```bash
openssl rand -base64 32
```

### 3. MongoDB Credentials

The docker-compose.yml includes MongoDB with default credentials:
- **Username:** `mongo`
- **Password:** `healthlog_password`

**IMPORTANT:** Change these in production! Edit `docker-compose.yml`:

```yaml
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: <your-username>
    MONGO_INITDB_ROOT_PASSWORD: <your-secure-password>
```

And update the API's MONGODB_URI to match.

### 4. Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 5. Verify Services

```bash
# Check API health
curl http://localhost:4000/api/health

# Check web is serving
curl http://localhost

# Check MongoDB is running
docker-compose exec mongodb mongosh admin -u mongo -p healthlog_password --eval "db.runCommand('ping')"
```

## Nginx Reverse Proxy

For production, set up Nginx on the host to reverse proxy to the Docker containers:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # API reverse proxy
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Web app
    location / {
        proxy_pass http://localhost;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then update `.env`:
```
CORS_ORIGIN=https://yourdomain.com
APP_BASE_URL=https://yourdomain.com
API_BASE_URL=https://yourdomain.com/api
```

## Common Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# View API logs
docker-compose logs api

# View MongoDB logs
docker-compose logs mongodb

# Restart a service
docker-compose restart api

# Rebuild without cache
docker-compose build --no-cache

# Update and restart
git pull origin main
docker-compose build
docker-compose up -d
```

## MongoDB Backup

```bash
# Backup database
docker-compose exec mongodb mongodump --username mongo --password healthlog_password --out /data/backup

# Restore database
docker-compose exec mongodb mongorestore --username mongo --password healthlog_password /data/backup
```

## Troubleshooting

### API can't connect to MongoDB
- Check MongoDB is healthy: `docker-compose ps`
- Verify credentials in docker-compose.yml
- Check logs: `docker-compose logs mongodb`

### Web app not loading
- Check Nginx logs: `docker-compose logs web`
- Verify VITE_API_BASE_URL is correct
- Check API health: `curl http://localhost:4000/api/health`

### Port already in use
- Change ports in docker-compose.yml (e.g., `4001:4000`)
- Or kill existing process: `lsof -i :4000`

## Production Checklist

- [ ] Change MongoDB credentials
- [ ] Generate secure JWT secrets
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure Nginx reverse proxy
- [ ] Set CORS_ORIGIN to production domain
- [ ] Configure email credentials
- [ ] Set LOG_LEVEL to `info` or `warn`
- [ ] Set up automated backups
- [ ] Test health checks
- [ ] Set up monitoring/alerts
