# Backup & Disaster Recovery Service

## Overview

Comprehensive backup and disaster recovery solution for AgroBridge microservices platform, ensuring data protection, business continuity, and compliance with recovery objectives.

## Features

- **Automated Backups**: Scheduled backups for all databases and file storage
- **Point-in-Time Recovery**: WAL archiving for PostgreSQL with PITR capability
- **Multi-Region Replication**: Geographic redundancy for critical data
- **Backup Monitoring**: Real-time tracking and alerting for backup operations
- **Disaster Recovery**: Tested procedures with documented RTO/RPO

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Backup Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  PostgreSQL  │───▶│  WAL Archive │───▶│   S3/MinIO   │  │
│  │   Primary    │    │   Streaming  │    │   (Backup)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                         │          │
│         │                                         │          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   MongoDB    │───▶│  mongodump   │───▶│   S3/MinIO   │  │
│  │   Primary    │    │   Backup     │    │   (Backup)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                         │          │
│         │                                         │          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    Redis     │───▶│     RDB      │───▶│   S3/MinIO   │  │
│  │   Primary    │    │   Snapshot   │    │   (Backup)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                         │          │
│         │                                         │          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ File Storage │───▶│    rsync     │───▶│   S3/MinIO   │  │
│  │    MinIO     │    │   Sync       │    │   (Backup)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Backup Monitor  │
                    │   (Prometheus)   │
                    └──────────────────┘
```

## Backup Strategy

### PostgreSQL Backups

**Full Backups**:
- Frequency: Daily at 2:00 AM UTC
- Method: pg_basebackup
- Retention: 30 days
- Compression: gzip
- Encryption: AES-256

**Incremental Backups**:
- Frequency: Continuous WAL archiving
- Method: archive_command
- Retention: 7 days
- Storage: S3/MinIO

**Point-in-Time Recovery**:
- Recovery window: 7 days
- Granularity: Transaction-level
- Testing: Weekly

### MongoDB Backups

**Full Backups**:
- Frequency: Daily at 3:00 AM UTC
- Method: mongodump
- Retention: 30 days
- Compression: gzip
- Encryption: AES-256

**Oplog Backups**:
- Frequency: Continuous
- Method: Oplog tailing
- Retention: 7 days

### Redis Backups

**RDB Snapshots**:
- Frequency: Every 6 hours
- Method: BGSAVE
- Retention: 7 days
- Compression: LZF

**AOF Backups**:
- Frequency: Continuous
- Method: Append-only file
- Retention: 24 hours

### File Storage Backups

**Full Backups**:
- Frequency: Daily at 4:00 AM UTC
- Method: rsync/rclone
- Retention: 30 days
- Versioning: Enabled

**Incremental Backups**:
- Frequency: Every 6 hours
- Method: rsync with --link-dest
- Retention: 7 days

## Recovery Objectives

### RTO (Recovery Time Objective)

| Service | RTO | Notes |
|---------|-----|-------|
| Authentication | 15 minutes | Critical service |
| User Service | 30 minutes | High priority |
| Marketplace | 1 hour | Business critical |
| Payment | 15 minutes | Financial data |
| Farm Management | 2 hours | Standard priority |
| Other Services | 4 hours | Lower priority |

### RPO (Recovery Point Objective)

| Data Type | RPO | Method |
|-----------|-----|--------|
| Transactional Data | 5 minutes | WAL/Oplog streaming |
| User Data | 1 hour | Incremental backups |
| File Storage | 6 hours | Incremental sync |
| Analytics Data | 24 hours | Daily backups |

## Backup Schedule

```
00:00 UTC - Backup verification check
02:00 UTC - PostgreSQL full backup
03:00 UTC - MongoDB full backup
04:00 UTC - File storage full backup
06:00 UTC - Redis snapshot
10:00 UTC - File storage incremental
12:00 UTC - Redis snapshot
16:00 UTC - File storage incremental
18:00 UTC - Redis snapshot
22:00 UTC - File storage incremental
```

## Multi-Region Replication

### PostgreSQL Replication

**Streaming Replication**:
- Primary: us-east-1
- Standby: eu-west-1
- Lag: <10 seconds
- Automatic failover: Yes

**Configuration**:
```ini
# Primary server
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB
hot_standby = on

# Standby server
primary_conninfo = 'host=primary port=5432 user=replicator'
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
```

### MongoDB Replication

**Replica Set**:
- Primary: us-east-1
- Secondary: eu-west-1
- Arbiter: us-west-1
- Read preference: primaryPreferred

**Configuration**:
```javascript
rs.initiate({
  _id: "agrobridge-rs",
  members: [
    { _id: 0, host: "mongo-primary:27017", priority: 2 },
    { _id: 1, host: "mongo-secondary:27017", priority: 1 },
    { _id: 2, host: "mongo-arbiter:27017", arbiterOnly: true }
  ]
})
```

### Redis Replication

**Master-Replica**:
- Master: us-east-1
- Replica: eu-west-1
- Sentinel: 3 nodes
- Automatic failover: Yes

**Configuration**:
```ini
# Master
bind 0.0.0.0
protected-mode yes
requirepass <password>

# Replica
replicaof redis-master 6379
masterauth <password>
```

### File Storage Replication

**MinIO Replication**:
- Source: us-east-1
- Target: eu-west-1
- Method: mc mirror
- Frequency: Real-time

## Backup Monitoring

### Metrics Collected

```python
# Backup metrics
backup_duration_seconds{service="postgresql",type="full"}
backup_size_bytes{service="postgresql",type="full"}
backup_success_total{service="postgresql"}
backup_failure_total{service="postgresql"}
backup_age_seconds{service="postgresql"}

# Replication metrics
replication_lag_seconds{service="postgresql"}
replication_status{service="postgresql"}
```

### Alerts

**Backup Failures**:
```yaml
- alert: BackupFailed
  expr: backup_failure_total > 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Backup failed for {{ $labels.service }}"
```

**Backup Age**:
```yaml
- alert: BackupTooOld
  expr: backup_age_seconds > 86400
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "Backup is older than 24 hours for {{ $labels.service }}"
```

**Replication Lag**:
```yaml
- alert: ReplicationLagHigh
  expr: replication_lag_seconds > 60
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Replication lag is {{ $value }}s for {{ $labels.service }}"
```

## Disaster Recovery Procedures

### PostgreSQL Recovery

**Full Recovery**:
```bash
# Stop PostgreSQL
systemctl stop postgresql

# Restore base backup
pg_basebackup -h backup-server -D /var/lib/postgresql/data -U replicator -P

# Configure recovery
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_time = '2025-12-05 10:00:00'
EOF

# Start PostgreSQL
systemctl start postgresql
```

**Point-in-Time Recovery**:
```bash
# Restore to specific timestamp
pg_restore -d agrobridge -t '2025-12-05 10:00:00' backup.dump
```

### MongoDB Recovery

**Full Recovery**:
```bash
# Stop MongoDB
systemctl stop mongod

# Restore backup
mongorestore --host localhost --port 27017 \
  --username admin --password <password> \
  --authenticationDatabase admin \
  --gzip --archive=/backups/mongodb-backup.gz

# Start MongoDB
systemctl start mongod
```

**Oplog Recovery**:
```bash
# Restore with oplog replay
mongorestore --oplogReplay --oplogLimit "1733400000:1" \
  --gzip --archive=/backups/mongodb-backup.gz
```

### Redis Recovery

**RDB Recovery**:
```bash
# Stop Redis
systemctl stop redis

# Copy RDB file
cp /backups/dump.rdb /var/lib/redis/dump.rdb

# Start Redis
systemctl start redis
```

**AOF Recovery**:
```bash
# Stop Redis
systemctl stop redis

# Copy AOF file
cp /backups/appendonly.aof /var/lib/redis/appendonly.aof

# Start Redis
systemctl start redis
```

### File Storage Recovery

**Full Recovery**:
```bash
# Restore from S3
aws s3 sync s3://agrobridge-backups/files/ /var/lib/minio/data/

# Or from MinIO backup
mc mirror backup-minio/agrobridge primary-minio/agrobridge
```

## Testing

### Backup Verification

**Automated Tests**:
```bash
# Run backup verification
./scripts/verify-backups.sh

# Test restoration
./scripts/test-restore.sh --service postgresql --date 2025-12-05
```

**Manual Tests**:
1. Verify backup files exist
2. Check backup file integrity
3. Test restoration to staging
4. Validate data consistency
5. Measure recovery time

### DR Drills

**Monthly DR Drill**:
1. Simulate primary region failure
2. Promote standby to primary
3. Verify application connectivity
4. Measure failover time
5. Document issues and improvements

**Quarterly Full DR Test**:
1. Complete infrastructure failure
2. Restore from backups
3. Full application testing
4. Performance validation
5. Update DR documentation

## Backup Storage

### Storage Locations

**Primary Backup Storage**:
- Provider: AWS S3 / MinIO
- Region: us-east-1
- Bucket: agrobridge-backups-primary
- Encryption: AES-256
- Versioning: Enabled

**Secondary Backup Storage**:
- Provider: AWS S3 / MinIO
- Region: eu-west-1
- Bucket: agrobridge-backups-secondary
- Encryption: AES-256
- Versioning: Enabled

**Tertiary Backup Storage** (Optional):
- Provider: Google Cloud Storage
- Region: us-central1
- Bucket: agrobridge-backups-tertiary
- Encryption: AES-256

### Storage Costs

**Estimated Monthly Costs**:
- PostgreSQL backups: ~$50 (100GB)
- MongoDB backups: ~$30 (50GB)
- Redis backups: ~$10 (10GB)
- File storage backups: ~$200 (500GB)
- Replication bandwidth: ~$100
- **Total**: ~$390/month

## Security

### Encryption

**At Rest**:
- All backups encrypted with AES-256
- Encryption keys stored in Vault
- Key rotation every 90 days

**In Transit**:
- TLS 1.3 for all transfers
- Certificate validation required
- No plaintext transmission

### Access Control

**Backup Access**:
- IAM roles for backup operations
- MFA required for restore operations
- Audit logging for all access

**Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::agrobridge-backups-primary/*"
      ]
    }
  ]
}
```

## Compliance

### Retention Policies

**Regulatory Requirements**:
- Financial data: 7 years
- User data: 5 years
- Transactional data: 3 years
- Logs: 1 year

**Backup Retention**:
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months
- Yearly backups: 7 years

### Audit Trail

**Backup Operations**:
- All backup operations logged
- Restore operations require approval
- Access logs retained for 1 year
- Regular compliance audits

## Quick Start

### Setup Backup Infrastructure

```bash
# Install dependencies
./scripts/install-backup-tools.sh

# Configure backup storage
./scripts/configure-backup-storage.sh

# Initialize backup schedules
./scripts/setup-backup-schedules.sh

# Test backup configuration
./scripts/test-backups.sh
```

### Manual Backup

```bash
# Backup PostgreSQL
./scripts/backup-postgresql.sh

# Backup MongoDB
./scripts/backup-mongodb.sh

# Backup Redis
./scripts/backup-redis.sh

# Backup file storage
./scripts/backup-files.sh
```

### Manual Restore

```bash
# Restore PostgreSQL
./scripts/restore-postgresql.sh --date 2025-12-05

# Restore MongoDB
./scripts/restore-mongodb.sh --date 2025-12-05

# Restore Redis
./scripts/restore-redis.sh --date 2025-12-05

# Restore file storage
./scripts/restore-files.sh --date 2025-12-05
```

## Monitoring Dashboard

Access backup monitoring at: http://localhost:3000/d/backups

**Panels**:
- Backup success rate
- Backup duration trends
- Backup size trends
- Replication lag
- Storage usage
- Failed backup alerts

## Troubleshooting

### Common Issues

**Backup Fails**:
1. Check disk space
2. Verify credentials
3. Check network connectivity
4. Review backup logs

**Slow Backups**:
1. Check I/O performance
2. Verify network bandwidth
3. Consider compression settings
4. Review backup schedule

**Replication Lag**:
1. Check network latency
2. Verify replica resources
3. Review replication logs
4. Consider scaling replica

## Support

For backup and DR issues:
1. Check backup logs: `/var/log/backups/`
2. Review monitoring dashboard
3. Run verification scripts
4. Contact DevOps team
5. Escalate to DR team if critical

## References

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [MongoDB Backup Methods](https://docs.mongodb.com/manual/core/backups/)
- [Redis Persistence](https://redis.io/topics/persistence)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/backup-best-practices.html)

---

**Last Updated**: December 5, 2025  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
