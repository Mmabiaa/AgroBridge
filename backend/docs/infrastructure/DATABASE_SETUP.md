# Database Infrastructure Setup Guide

This guide covers the setup and configuration of the complete database infrastructure for AgroBridge microservices.

## Overview

The AgroBridge platform uses multiple database technologies optimized for different use cases:

- **PostgreSQL**: Primary relational database for transactional data
- **TimescaleDB**: Time-series database for IoT sensor data
- **MongoDB**: Document database for AI conversations and logs
- **Redis**: In-memory cache and session store
- **Elasticsearch**: Search engine for products, courses, and content

## Architecture

### Database per Service Pattern

Each microservice has its own isolated PostgreSQL database:

```
agrobridge_authentication  - User authentication and tokens
agrobridge_users          - User profiles and preferences
agrobridge_farms          - Farm management and crops
agrobridge_marketplace    - Products and orders
agrobridge_ai_assistant   - AI service metadata
agrobridge_crop_detection - Disease detection results
agrobridge_financial      - Financial records and budgets
agrobridge_learning       - Courses and progress
agrobridge_community      - Social posts and messages
agrobridge_iot            - IoT device management
agrobridge_notifications  - Notification metadata
agrobridge_analytics      - Analytics metadata
agrobridge_scheduling     - Tasks and schedules
agrobridge_payments       - Payment transactions
agrobridge_blockchain     - Blockchain certificates
agrobridge_export_docs    - Export documentation
agrobridge_emergency      - Emergency alerts
agrobridge_storage        - File metadata
agrobridge_admin          - Admin data
```

### Connection Pooling

All PostgreSQL connections use connection pooling with:
- Maximum connection age: 10 minutes
- Health checks before each request
- Automatic reconnection on failure
- Query timeout: 30 seconds

### Caching Strategy

Redis is used for multiple caching layers:
- **default**: General application cache
- **sessions**: User session storage
- **api_throttle**: Rate limiting counters

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 5432, 5433, 6379, 9200, 27017 available

### Installation

#### Linux/Mac

```bash
cd backend
chmod +x scripts/setup-infrastructure.sh
./scripts/setup-infrastructure.sh
```

#### Windows

```powershell
cd backend
.\scripts\setup-infrastructure.ps1
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.infrastructure.example .env.infrastructure
```

2. Update credentials in `.env.infrastructure`:
```env
POSTGRES_PASSWORD=your_secure_password
MONGODB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_secure_password
```

3. Start the infrastructure:
```bash
docker-compose -f docker-compose.infrastructure.yml up -d
```

### Initialize Databases

1. Run Django migrations for all databases:
```bash
python manage.py migrate --database=default
python manage.py migrate --database=authentication_db
python manage.py migrate --database=users_db
# ... repeat for each service database
```

Or use the migration script:
```bash
python scripts/migrate_all_databases.py
```

2. Setup MongoDB indexes:
```bash
python manage.py setup_mongodb
```

3. Setup Elasticsearch indexes:
```bash
python manage.py setup_elasticsearch
```

## Database Configuration

### PostgreSQL

Each service connects to its own database using the configuration in `shared/database/postgres.py`:

```python
from shared.database.postgres import get_postgres_config

DATABASES = {
    'authentication_db': get_postgres_config('authentication'),
    'users_db': get_postgres_config('users'),
    # ... other services
}
```

### MongoDB

Services using MongoDB (AI Assistant, Crop Detection, Analytics):

```python
from shared.database.mongodb import MongoDBConnection

# Get MongoDB connection
mongo = MongoDBConnection.get_instance('ai_assistant')
collection = mongo.get_collection('conversations')

# Use the collection
collection.insert_one({'user_id': user_id, 'message': message})
```

### Redis

Redis is configured through Django's cache framework:

```python
from django.core.cache import cache

# Cache data
cache.set('key', 'value', timeout=300)

# Get cached data
value = cache.get('key')
```

### Elasticsearch

Search functionality using Elasticsearch:

```python
from shared.database.elasticsearch_config import ElasticsearchManager

# Get Elasticsearch instance
es = ElasticsearchManager.get_instance('marketplace')

# Search products
results = es.search('marketplace_products', {
    'match': {'name': 'tomatoes'}
})
```

## High Availability

### Redis Sentinel

For production, use Redis Sentinel for automatic failover:

1. Update `.env.infrastructure`:
```env
REDIS_MODE=sentinel
REDIS_SENTINEL_HOSTS=sentinel1:26379,sentinel2:26379,sentinel3:26379
```

2. Start with sentinel configuration:
```bash
docker-compose -f docker-compose.infrastructure.yml up -d redis-sentinel
```

### PostgreSQL Replication

For read scaling, configure read replicas:

```python
from shared.database.settings import get_read_replica_config

DATABASES = {
    'default': get_postgres_config('default'),
    'default_read': get_read_replica_config('default'),
}
```

## Monitoring

### Health Checks

Check database health:

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

### Management Tools

Access management interfaces (dev mode):

- **PgAdmin**: http://localhost:5050
- **Mongo Express**: http://localhost:8081
- **Redis Commander**: http://localhost:8082
- **Kibana**: http://localhost:5601

Start with dev tools:
```bash
docker-compose -f docker-compose.infrastructure.yml --profile dev up -d
```

## Backup and Recovery

### Automated Backups

Backups are configured in `.env.infrastructure`:

```env
DB_BACKUP_ENABLED=true
DB_BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
DB_BACKUP_RETENTION_DAYS=30
```

### Manual Backup

#### PostgreSQL

```bash
# Backup single database
docker exec agrobridge-postgres pg_dump -U agrobridge agrobridge_marketplace > marketplace_backup.sql

# Backup all databases
docker exec agrobridge-postgres pg_dumpall -U agrobridge > all_databases_backup.sql
```

#### MongoDB

```bash
# Backup MongoDB
docker exec agrobridge-mongodb mongodump --out=/backup

# Copy backup from container
docker cp agrobridge-mongodb:/backup ./mongodb_backup
```

#### Redis

```bash
# Trigger Redis save
docker exec agrobridge-redis redis-cli BGSAVE

# Copy RDB file
docker cp agrobridge-redis:/data/dump.rdb ./redis_backup.rdb
```

### Restore

#### PostgreSQL

```bash
# Restore database
docker exec -i agrobridge-postgres psql -U agrobridge agrobridge_marketplace < marketplace_backup.sql
```

#### MongoDB

```bash
# Copy backup to container
docker cp ./mongodb_backup agrobridge-mongodb:/backup

# Restore
docker exec agrobridge-mongodb mongorestore /backup
```

#### Redis

```bash
# Stop Redis
docker-compose -f docker-compose.infrastructure.yml stop redis

# Copy RDB file
docker cp ./redis_backup.rdb agrobridge-redis:/data/dump.rdb

# Start Redis
docker-compose -f docker-compose.infrastructure.yml start redis
```

## Troubleshooting

### Connection Issues

1. Check if services are running:
```bash
docker-compose -f docker-compose.infrastructure.yml ps
```

2. View service logs:
```bash
docker-compose -f docker-compose.infrastructure.yml logs -f postgres
```

3. Test connections:
```bash
# PostgreSQL
psql -h localhost -U agrobridge -d agrobridge_default

# MongoDB
mongosh mongodb://localhost:27017 -u agrobridge

# Redis
redis-cli -h localhost -p 6379
```

### Performance Issues

1. Check PostgreSQL connections:
```sql
SELECT count(*) FROM pg_stat_activity;
```

2. Monitor Redis memory:
```bash
docker exec agrobridge-redis redis-cli INFO memory
```

3. Check Elasticsearch cluster health:
```bash
curl http://localhost:9200/_cluster/health?pretty
```

### Data Migration

When migrating between environments:

1. Export data from source
2. Update connection strings in `.env.infrastructure`
3. Import data to target
4. Verify data integrity
5. Update application configuration

## Security Best Practices

1. **Change default passwords** in production
2. **Use SSL/TLS** for all database connections
3. **Enable authentication** on all services
4. **Restrict network access** using firewalls
5. **Regular security updates** for database images
6. **Encrypt backups** before storing
7. **Use secrets management** (HashiCorp Vault)
8. **Enable audit logging** for compliance

## Scaling

### Horizontal Scaling

- **PostgreSQL**: Use read replicas for read-heavy workloads
- **MongoDB**: Enable sharding for large datasets
- **Redis**: Use Redis Cluster for distributed caching
- **Elasticsearch**: Add more nodes to the cluster

### Vertical Scaling

Adjust resource limits in `docker-compose.infrastructure.yml`:

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Production Deployment

For production deployment:

1. Use managed database services (AWS RDS, MongoDB Atlas, etc.)
2. Configure SSL/TLS certificates
3. Set up monitoring and alerting
4. Implement automated backups
5. Configure disaster recovery
6. Use connection pooling (PgBouncer for PostgreSQL)
7. Enable query performance monitoring
8. Set up log aggregation

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.infrastructure.yml logs`
- Review documentation in `backend/docs/`
- Contact DevOps team

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [TimescaleDB Documentation](https://docs.timescale.com/)
