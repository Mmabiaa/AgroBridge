# Database Infrastructure - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Start Infrastructure

**Linux/Mac:**
```bash
cd backend
chmod +x scripts/setup-infrastructure.sh
./scripts/setup-infrastructure.sh
```

**Windows:**
```powershell
cd backend
.\scripts\setup-infrastructure.ps1
```

### 2. Verify Services

```bash
docker-compose -f docker-compose.infrastructure.yml ps
```

All services should show "healthy" status.

### 3. Initialize Databases

```bash
# Setup MongoDB indexes
python manage.py setup_mongodb

# Setup Elasticsearch indexes
python manage.py setup_elasticsearch
```

## 📊 Access Management Tools

- **PgAdmin** (PostgreSQL): http://localhost:5050
- **Mongo Express** (MongoDB): http://localhost:8081
- **Redis Commander** (Redis): http://localhost:8082
- **Kibana** (Elasticsearch): http://localhost:5601

Start with dev tools:
```bash
docker-compose -f docker-compose.infrastructure.yml --profile dev up -d
```

## 🔌 Connection Strings

### PostgreSQL
```
Host: localhost
Port: 5432
User: agrobridge
Password: (see .env.infrastructure)
Databases: agrobridge_* (one per service)
```

### MongoDB
```
URI: mongodb://localhost:27017/
User: agrobridge
Password: (see .env.infrastructure)
```

### Redis
```
Host: localhost
Port: 6379
Password: (see .env.infrastructure)
```

### Elasticsearch
```
URL: http://localhost:9200
```

### TimescaleDB
```
Host: localhost
Port: 5433
User: agrobridge
Database: agrobridge_iot_timeseries
```

## 🛠️ Common Commands

### Start Services
```bash
docker-compose -f docker-compose.infrastructure.yml up -d
```

### Stop Services
```bash
docker-compose -f docker-compose.infrastructure.yml down
```

### View Logs
```bash
docker-compose -f docker-compose.infrastructure.yml logs -f [service-name]
```

### Restart Service
```bash
docker-compose -f docker-compose.infrastructure.yml restart [service-name]
```

## 🔍 Health Checks

```bash
# PostgreSQL
docker exec agrobridge-postgres pg_isready

# MongoDB
docker exec agrobridge-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec agrobridge-redis redis-cli ping

# Elasticsearch
curl http://localhost:9200/_cluster/health
```

## 💾 Backup

### PostgreSQL
```bash
docker exec agrobridge-postgres pg_dump -U agrobridge agrobridge_marketplace > backup.sql
```

### MongoDB
```bash
docker exec agrobridge-mongodb mongodump --out=/backup
docker cp agrobridge-mongodb:/backup ./mongodb_backup
```

### Redis
```bash
docker exec agrobridge-redis redis-cli BGSAVE
docker cp agrobridge-redis:/data/dump.rdb ./redis_backup.rdb
```

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Check port conflicts
netstat -an | grep -E "5432|6379|9200|27017"

# View detailed logs
docker-compose -f docker-compose.infrastructure.yml logs
```

### Connection refused
```bash
# Wait for services to be healthy (may take 30-60 seconds)
docker-compose -f docker-compose.infrastructure.yml ps

# Restart problematic service
docker-compose -f docker-compose.infrastructure.yml restart [service-name]
```

### Out of memory
```bash
# Check Docker resources
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Recommended: At least 4GB RAM
```

## 📚 Full Documentation

See `backend/docs/infrastructure/DATABASE_SETUP.md` for complete documentation.

## 🔐 Security Notes

⚠️ **Important**: Change default passwords in `.env.infrastructure` before production deployment!

```env
POSTGRES_PASSWORD=your_secure_password_here
MONGODB_PASSWORD=your_secure_password_here
REDIS_PASSWORD=your_secure_password_here
```

## 🎯 Next Steps

1. ✅ Infrastructure is running
2. Configure Django settings to use the databases
3. Run migrations: `python manage.py migrate`
4. Start developing microservices!

## 💡 Tips

- Use `--profile dev` to start management tools
- Keep `.env.infrastructure` secure and never commit it
- Regular backups are automated (see `DB_BACKUP_SCHEDULE`)
- Monitor logs for any issues
- Use connection pooling for better performance

## 🆘 Need Help?

- Check logs: `docker-compose -f docker-compose.infrastructure.yml logs`
- Review documentation: `backend/docs/infrastructure/DATABASE_SETUP.md`
- Verify configuration: `.env.infrastructure`
