#!/bin/bash

# MongoDB Backup Script
# Performs full backup with oplog support

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mongodb}"
S3_BUCKET="${S3_BUCKET:-agrobridge-backups-primary}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-admin}"
MONGO_PASSWORD="${MONGO_PASSWORD}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mongodb_${TIMESTAMP}"
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

log_info "Starting MongoDB backup: ${BACKUP_NAME}"

# Check MongoDB connection
if ! mongosh --host "${MONGO_HOST}" --port "${MONGO_PORT}" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    log_error "MongoDB is not accessible"
    exit 1
fi

# Perform backup with oplog
log_info "Creating MongoDB backup with oplog..."
if [ -n "${MONGO_PASSWORD}" ]; then
    mongodump --host "${MONGO_HOST}" --port "${MONGO_PORT}" \
        --username "${MONGO_USER}" --password "${MONGO_PASSWORD}" \
        --authenticationDatabase "${MONGO_AUTH_DB}" \
        --oplog --gzip --out "${BACKUP_PATH}"
else
    mongodump --host "${MONGO_HOST}" --port "${MONGO_PORT}" \
        --oplog --gzip --out "${BACKUP_PATH}"
fi

if [ $? -eq 0 ]; then
    log_info "MongoDB backup completed successfully"
else
    log_error "MongoDB backup failed"
    exit 1
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
    aws s3 cp "${BACKUP_NAME}.tar.gz" "s3://${S3_BUCKET}/mongodb/${BACKUP_NAME}.tar.gz" --storage-class STANDARD_IA
elif command -v mc &> /dev/null; then
    mc cp "${BACKUP_NAME}.tar.gz" "backup/${S3_BUCKET}/mongodb/${BACKUP_NAME}.tar.gz"
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
  "host": "${MONGO_HOST}",
  "size_bytes": ${BACKUP_SIZE},
  "type": "full",
  "oplog": true,
  "status": "completed"
}
EOF

# Send metrics to Prometheus Pushgateway
if command -v curl &> /dev/null && [ -n "${PUSHGATEWAY_URL}" ]; then
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/backup/instance/mongodb"
# TYPE backup_duration_seconds gauge
backup_duration_seconds{service="mongodb",type="full"} $SECONDS
# TYPE backup_size_bytes gauge
backup_size_bytes{service="mongodb",type="full"} ${BACKUP_SIZE}
# TYPE backup_success_total counter
backup_success_total{service="mongodb"} 1
# TYPE backup_timestamp gauge
backup_timestamp{service="mongodb"} $(date +%s)
EOF
fi

# Cleanup old backups
log_info "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "mongodb_*" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true
find "${BACKUP_DIR}" -name "mongodb_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Cleanup old S3 backups
if command -v aws &> /dev/null; then
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    aws s3 ls "s3://${S3_BUCKET}/mongodb/" | while read -r line; do
        BACKUP_DATE=$(echo $line | awk '{print $1}')
        BACKUP_FILE=$(echo $line | awk '{print $4}')
        if [[ "${BACKUP_DATE}" < "${CUTOFF_DATE}" ]]; then
            log_info "Deleting old backup: ${BACKUP_FILE}"
            aws s3 rm "s3://${S3_BUCKET}/mongodb/${BACKUP_FILE}"
        fi
    done
fi

log_info "MongoDB backup completed successfully: ${BACKUP_NAME}"
log_info "Backup location: ${BACKUP_PATH}"
log_info "Archive: ${BACKUP_NAME}.tar.gz"
log_info "Total duration: ${SECONDS} seconds"

exit 0
