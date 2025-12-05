# Backup Service - Quick Start Guide

Get the AgroBridge backup and disaster recovery system up and running in minutes.

## Prerequisites

- PostgreSQL, MongoDB, Redis installed
- AWS CLI or MinIO client installed
- Sufficient storage space for backups
- Root/Administrator access (for setup)

## Quick Setup (Linux/macOS)

### 1. Run Setup Script

```bash
cd backend/backup/scripts
sudo chmod +x *.sh
sudo ./setup-backup-infrastructure.sh
```

The script will:
- Install required dependencies
- Create backup directories
- Configure database WAL/oplog
- Set up S3/MinIO storage
- Install backup scripts
- Configure cron schedules
- Set up monitoring

### 2. Configure Storage

When prompted, choose your backup storage:

**For AWS S3**:
```
Configure AWS S3 or MinIO? s3
AWS Access Key ID: YOUR_ACCESS_KEY
AWS Secret Access Key: YOUR_SECRET_KEY
AWS Region: us-east-1
S3 Bucket Name: agrobridge-backups
```

**For MinIO**:
```
Configure AWS S3 or MinIO? minio
MinIO Endpoint: http://localhost:9000
MinIO Access Key: YOUR_ACCESS_KEY
MinIO Secret Key: YOUR_SECRET_KEY
MinIO Bucket Name: agrobridge-backups
```

### 3. Restart Services

```bash
sudo systemctl restart postgresql
sudo systemctl restart redis
sudo systemctl restart prometheus  # If using monitoring
```

### 4. Test Backups

```bash
# Test PostgreSQL backup
./backup-postgresql.sh

# Test MongoDB backup
./backup-mongodb.sh

# Test Redis backup
./backup-redis.sh

# Test file storage backup
./backup-files.sh

# Verify all backups
./verify-backups.sh
```

## Quick Setup (Windows)

### 1. Run PowerShell Setup

Open PowerShell as Administrator:

```powershell
cd backend\backup\scripts
Set-ExecutionPolicy Bypass -Scope Process
.\setup-backup-infrastructure.ps1
```

### 2. Configure Storage

Follow the prompts to configure S3 or MinIO (same as Linux).

### 3. Restart Services

```powershell
Restart-Service postgresql
Restart-Service redis
```

### 4. Test Backups

Check Task Scheduler for scheduled backup tasks or run manually.

## Manual Backup

### PostgreSQL

```bash
export BACKUP_DIR=/var/backups/postgresql
export S3_BUCKET=agrobridge-backups-primary
export POSTGRES_HOST=localhost
export POSTGRES_USER=postgres
export POSTGRES_DB=agrobridge

./backup-postgresql.sh
```

### MongoDB

```bash
export BACKUP_DIR=/var/backups/mongodb
export S3_BUCKET=agrobridge-backups-primary
export MONGO_HOST=localhost
export MONGO_USER=admin
export MONGO_PASSWORD=your_password

./backup-mongodb.sh
```

### Redis

```bash
export BACKUP_DIR=/var/backups/redis
export S3_BUCKET=agrobridge-backups-primary
export REDIS_HOST=localhost

./backup-redis.sh
```

### File Storage

```bash
export BACKUP_DIR=/var/backups/files
export S3_BUCKET=agrobridge-backups-primary
export SOURCE_DIR=/var/lib/minio/data
export BACKUP_TYPE=full  # or incremental

./backup-files.sh
```

## Manual Restore

### PostgreSQL

```bash
# Full restore
./restore-postgresql.sh --date 20251205

# Point-in-time restore
./restore-postgresql.sh --date 20251205 --time "2025-12-05 10:00:00"
```

### MongoDB

```bash
# Full restore
./restore-mongodb.sh --date 20251205

# With oplog replay
./restore-mongodb.sh --date 20251205 --oplog
```

### Redis

```bash
./restore-redis.sh --date 20251205
```

### File Storage

```bash
./restore-files.sh --date 20251205
```

## Verify Backups

Run the verification script to check all backups:

```bash
./verify-backups.sh
```

This will:
- Check backup file existence
- Verify archive integrity
- Validate backup age
- Check S3/MinIO uploads
- Generate verification report

## Run DR Drill

Test your disaster recovery procedures:

```bash
./dr-drill.sh
```

This will:
- Verify all backups are available
- Check backup integrity
- Validate RTO/RPO compliance
- Test remote backup access
- Generate drill report

## Monitoring

### View Backup Status

**Grafana Dashboard**: http://localhost:3000/d/backups

**Prometheus Metrics**:
```bash
curl http://localhost:9090/api/v1/query?query=backup_success_total
```

### Check Backup Logs

```bash
# PostgreSQL backup log
tail -f /var/log/backups/postgresql.log

# MongoDB backup log
tail -f /var/log/backups/mongodb.log

# Redis backup log
tail -f /var/log/backups/redis.log

# Verification log
tail -f /var/log/backups/verification.log
```

## Backup Schedule

Default backup schedule (can be customized in cron):

```
02:00 UTC - PostgreSQL full backup
03:00 UTC - MongoDB full backup
04:00 UTC - File storage full backup
06:00 UTC - Redis snapshot (repeats every 6 hours)
00:00 UTC - Backup verification
```

## Common Issues

### Backup Fails with Permission Error

```bash
# Fix permissions
sudo chown -R postgres:postgres /var/backups/postgresql
sudo chown -R mongodb:mongodb /var/backups/mongodb
sudo chown -R redis:redis /var/backups/redis
```

### S3 Upload Fails

```bash
# Check AWS credentials
aws configure list

# Test S3 access
aws s3 ls s3://agrobridge-backups-primary/
```

### Backup Too Slow

```bash
# Check disk I/O
iostat -x 1

# Check network bandwidth
iftop

# Consider:
# - Using faster storage
# - Adjusting compression level
# - Running backups during off-peak hours
```

### Restore Fails

```bash
# Check backup integrity
tar -tzf /var/backups/postgresql/postgresql_20251205.tar.gz

# Verify backup exists
ls -lh /var/backups/postgresql/

# Check available disk space
df -h
```

## Environment Variables

### Common Variables

```bash
# Backup directories
export BACKUP_DIR=/var/backups
export BACKUP_BASE_DIR=/var/backups

# S3/MinIO
export S3_BUCKET=agrobridge-backups-primary

# Retention
export RETENTION_DAYS=30

# Monitoring
export PUSHGATEWAY_URL=http://localhost:9091
```

### PostgreSQL Variables

```bash
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=postgres
export POSTGRES_DB=agrobridge
export POSTGRES_DATA_DIR=/var/lib/postgresql/data
```

### MongoDB Variables

```bash
export MONGO_HOST=localhost
export MONGO_PORT=27017
export MONGO_USER=admin
export MONGO_PASSWORD=your_password
export MONGO_AUTH_DB=admin
```

### Redis Variables

```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=your_password
export REDIS_DATA_DIR=/var/lib/redis
```

## Next Steps

1. **Review Configuration**: Check `backend/backup/README.md` for detailed configuration
2. **Customize Schedule**: Adjust backup schedules in cron/Task Scheduler
3. **Set Up Monitoring**: Configure Grafana dashboards and alerts
4. **Test Restore**: Practice restore procedures in staging
5. **Schedule DR Drills**: Plan monthly disaster recovery drills
6. **Document Procedures**: Update runbooks for your environment

## Support

For issues or questions:
1. Check logs in `/var/log/backups/`
2. Review `backend/backup/README.md`
3. Run verification script: `./verify-backups.sh`
4. Contact DevOps team

## Additional Resources

- [Full Documentation](README.md)
- [Task Completion Report](../docs/tasks/TASK_22_COMPLETION.md)
- [Alert Rules](monitoring/backup-alerts.yml)
- [PostgreSQL Backup Docs](https://www.postgresql.org/docs/current/backup.html)
- [MongoDB Backup Docs](https://docs.mongodb.com/manual/core/backups/)
- [Redis Persistence](https://redis.io/topics/persistence)

---

**Last Updated**: December 5, 2025  
**Version**: 1.0.0
