#!/bin/bash

# Redis Backup Script
# Performs RDB snapshot backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/redis}"
S3_BUCKET="${S3_BUCKET:-agrobridge-backups-primary}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"
REDIS_DATA_DIR="${REDIS_DATA_DIR:-/var/lib/redis}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="redis_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log_info "Starting Redis backup: ${BACKUP_NAME}"

# Check Redis connection
if [ -n "${REDIS_PASSWORD}" ]; then
    REDIS_CLI="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} -a ${REDIS_PASSWORD}"
else
    REDIS_CLI="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT}"
fi

if ! ${REDIS_CLI} ping > /dev/null 2>&1; then
    log_error "Redis is not accessible"
    exit 1
fi

# Trigger BGSAVE
log_info "Triggering Redis BGSAVE..."
${REDIS_CLI} BGSAVE > /dev/null

# Wait for BGSAVE to complete
log_info "Waiting for BGSAVE to complete..."
while true; do
    SAVE_STATUS=$(${REDIS_CLI} LASTSAVE)
    sleep 2
    NEW_SAVE_STATUS=$(${REDIS_CLI} LASTSAVE)
    if [ "${SAVE_STATUS}" != "${NEW_SAVE_STATUS}" ]; then
        break
    fi
done

log_info "BGSAVE completed successfully"

# Copy RDB file
log_info "Copying RDB snapshot..."
mkdir -p "${BACKUP_PATH}"
cp "${REDIS_DATA_DIR}/dump.rdb" "${BACKUP_PATH}/dump.rdb"

# Copy AOF file if exists
if [ -f "${REDIS_DATA_DIR}/appendonly.aof" ]; then
    log_info "Copying AOF file..."
    cp "${REDIS_DATA_DIR}/appendonly.aof" "${BACKUP_PATH}/appendonly.aof"
fi

# Create archive
log_info "Creating backup archive..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"

# Calculate backup size
BACKUP_SIZE=$(du -sb "${BACKUP_NAME}.tar.gz" | cut -f1)
log_info "Backup size: $(numfmt --to=iec-i --suffix=B ${BACKUP_SIZE})"

# Upload to S3/MinIO
log_info "Uploading backup to S3..."
if command -v aws &> /dev/null; then
    aws s3 cp "${BACKUP_NAME}.tar.gz" "s3://${S3_BUCKET}/redis/${BACKUP_NAME}.tar.gz" --storage-class STANDARD_IA
elif command -v mc &> /dev/null; then
    mc cp "${BACKUP_NAME}.tar.gz" "backup/${S3_BUCKET}/redis/${BACKUP_NAME}.tar.gz"
else
    log_warn "Neither AWS CLI nor MinIO client found, skipping upload"
fi

# Verify backup
log_info "Verifying backup integrity..."
if tar -tzf "${BACKUP_NAME}.tar.gz" > /dev/null 2>&1; then
    log_info "Backup verification successful"
else
    log_error "Backup verification failed"
    exit 1
fi

# Create backup metadata
cat > "${BACKUP_PATH}/metadata.json" << EOF
{
  "backup_name": "${BACKUP_NAME}",
  "timestamp": "${TIMESTAMP}",
  "host": "${REDIS_HOST}",
  "size_bytes": ${BACKUP_SIZE},
  "type": "snapshot",
  "status": "completed"
}
EOF

# Send metrics to Prometheus Pushgateway
if command -v curl &> /dev/null && [ -n "${PUSHGATEWAY_URL}" ]; then
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/backup/instance/redis"
# TYPE backup_duration_seconds gauge
backup_duration_seconds{service="redis",type="snapshot"} $SECONDS
# TYPE backup_size_bytes gauge
backup_size_bytes{service="redis",type="snapshot"} ${BACKUP_SIZE}
# TYPE backup_success_total counter
backup_success_total{service="redis"} 1
# TYPE backup_timestamp gauge
backup_timestamp{service="redis"} $(date +%s)
EOF
fi

# Cleanup old backups
log_info "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "redis_*" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true
find "${BACKUP_DIR}" -name "redis_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

log_info "Redis backup completed successfully: ${BACKUP_NAME}"
log_info "Total duration: ${SECONDS} seconds"

exit 0
