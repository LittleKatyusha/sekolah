# Docker Setup Guide

This guide explains how to run the Admin Dashboard using Docker with Nginx reverse proxy.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Architecture

### Development Setup
- **App Container**: Vite dev server with HMR (Hot Module Replacement)
- **Nginx Container**: Reverse proxy with WebSocket support for HMR
- **Network**: Custom bridge network for service communication

### Production Setup
- **Multi-stage Build**: Optimized build process for frontend
- **App Container**: Nginx serving static built files
- **Production Nginx**: Reverse proxy with caching, security headers
- **Network**: Custom bridge network

## Development Environment

### Starting Development Server

```bash
# Build and start containers
docker-compose -f docker-compose.dev.yaml up --build

# Start in detached mode
docker-compose -f docker-compose.dev.yaml up -d

# View logs
docker-compose -f docker-compose.dev.yaml logs -f
```

### Access the Application

- **Frontend via Nginx**: http://localhost (port 80)
- **Frontend Direct Access**: http://localhost:5173

### Development Features

- ✅ **Hot Module Replacement (HMR)** - Instant updates without full reload
- ✅ **File watching with polling** - Works reliably in Docker containers
- ✅ **Volume mounting** - Live code updates without rebuilding
- ✅ **WebSocket support** - Real-time HMR communication
- ✅ **No rebuild needed** - Just save your code and see changes instantly
- ✅ **External API integration** - Connects to external APIs (JSONPlaceholder)
- ✅ **Rate limiting** - Protection against abuse
- ✅ **Security headers** - Production-grade security in development

### How Live Reloading Works

The development setup uses **volume mounting** to sync your local code with the container:

1. Your source code (src/, public/, etc.) is mounted into the container
2. Vite watches for file changes using polling (reliable in Docker)
3. When you save a file, Vite detects the change instantly
4. HMR updates your browser without full page reload
5. **No container rebuild needed!**

```yaml
# This is already configured in docker-compose.dev.yaml
volumes:
  - .:/app                  # Mount entire project
  - /app/node_modules       # Keep node_modules in container
```

**Important**: Only `package.json` changes require a rebuild:
```bash
# After adding/removing npm packages
docker-compose -f docker-compose.dev.yaml up --build
```

### Stopping Development Server

```bash
# Stop containers
docker-compose -f docker-compose.dev.yaml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yaml down -v
```

## Production Environment

### Building for Production

```bash
# Build production image
docker-compose -f docker-compose.prod.yaml build

# Start production containers
docker-compose -f docker-compose.prod.yaml up -d
```

### Access the Application

- **HTTP**: http://localhost
- **HTTPS**: https://localhost (after SSL configuration)

### Production Features

- ✅ Multi-stage optimized build
- ✅ Static file caching
- ✅ Gzip compression
- ✅ Security headers
- ✅ Rate limiting
- ✅ Health checks

### Stopping Production Server

```bash
docker-compose -f docker-compose.prod.yaml down
```

## SSL/HTTPS Configuration

### Generate Self-Signed Certificates (Development)

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Production Certificates

For production, use Let's Encrypt or your certificate provider:

```bash
# Using Let's Encrypt (certbot)
# Make sure to update nginx config with your domain
certbot certonly --standalone -d yourdomain.com
```

Then update the nginx configuration to use the certificates.

## Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_BASE_URL=https://your-api.com

# Environment
NODE_ENV=production
```

## Useful Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yaml logs

# Specific service
docker-compose -f docker-compose.dev.yaml logs app
docker-compose -f docker-compose.dev.yaml logs nginx

# Follow logs
docker-compose -f docker-compose.dev.yaml logs -f
```

### Execute Commands in Container

```bash
# Development
docker-compose -f docker-compose.dev.yaml exec app sh
docker-compose -f docker-compose.dev.yaml exec app npm install new-package

# Production
docker-compose -f docker-compose.prod.yaml exec app sh
```

### Rebuild Containers

```bash
# Development
docker-compose -f docker-compose.dev.yaml up --build --force-recreate

# Production
docker-compose -f docker-compose.prod.yaml build --no-cache
```

### Health Check

```bash
# Check nginx health
curl http://localhost/health

# Check container status
docker-compose -f docker-compose.dev.yaml ps
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 80
# Windows
netstat -ano | findstr :80

# Linux/Mac
lsof -i :80

# Kill the process or change port in docker-compose.yaml
```

### Permission Issues

```bash
# Fix permission issues (Linux/Mac)
sudo chown -R $USER:$USER .
```

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.dev.yaml logs

# Remove all containers and volumes
docker-compose -f docker-compose.dev.yaml down -v
docker system prune -a
```

### HMR Not Working

1. Ensure WebSocket connection is working
2. Check nginx configuration for WebSocket support
3. Verify the app container is accessible

## Performance Optimization

### Production Build Optimization

The production Dockerfile uses:
- Multi-stage builds
- npm ci for faster, reliable installs
- Cache cleaning
- Static file optimization
- Gzip compression

### Nginx Optimization

- Static file caching (1 year)
- Gzip compression
- HTTP/2 support (with SSL)
- Connection pooling
- Worker process optimization

## Security Best Practices

### Implemented Security Features

1. **Security Headers**
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection
   - Referrer-Policy
   - Content-Security-Policy

2. **Rate Limiting**
   - 10 requests per second
   - Burst of 20 requests
   - Connection limiting

3. **SSL/TLS**
   - TLS 1.2 and 1.3 only
   - Strong cipher suites
   - HSTS header

4. **Hidden Files Protection**
   - Deny access to dot files
   - No directory listing

### Additional Security Recommendations

1. Use environment variables for sensitive data
2. Implement proper CORS policies
3. Regular security updates
4. Use Docker secrets for production
5. Implement proper logging and monitoring

## Monitoring

### Container Stats

```bash
# Real-time stats
docker stats

# Specific container
docker stats adminfe-dev
```

### Nginx Access Logs

```bash
# View access logs
docker-compose -f docker-compose.dev.yaml logs nginx | grep "GET\|POST"
```

## Scaling

### Horizontal Scaling

```bash
# Scale app containers
docker-compose -f docker-compose.prod.yaml up --scale app=3
```

Note: You'll need to configure Nginx load balancing for multiple app instances.

## Backup and Restore

### Backup

```bash
# Export container
docker export adminfe-prod > backup.tar

# Backup volumes
docker run --rm -v adminfe_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

### Restore

```bash
# Import container
docker import backup.tar adminfe-restored

# Restore volumes
docker run --rm -v adminfe_data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker-compose -f docker-compose.prod.yaml build
      - name: Deploy
        run: docker-compose -f docker-compose.prod.yaml up -d
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify configuration files
3. Review this documentation
4. Open an issue on GitHub
