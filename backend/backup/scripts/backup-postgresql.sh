#!/bin/bash

# PostgreSQL Backup Script
# Performs full backup with WAL archiving support

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
S3_BUCKET="${S3_BUCKET:-agrobridge-backups-primary}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-agrobridge}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="postgresql_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

log_info "Starting PostgreSQL backup: ${BACKUP_NAME}"

# Check PostgreSQL connection
if ! pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" > /dev/null 2>&1; then
    log_error "PostgreSQL is not accessible"
    exit 1
fi

# Perform base backup
log_info "Creating base backup..."
pg_basebackup -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" \
    -D "${BACKUP_PATH}" -Ft -z -P -X fetch

if [ $? -eq 0 ]; then
    log_info "Base backup completed successfully"
else
    log_error "Base backup failed"
    exit 1
fi

# Dump database for additional safety
log_info "Creating database dump..."
pg_dump -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" -Fc -f "${BACKUP_PATH}.dump"

if [ $? -eq 0 ]; then
    log_info "Database dump completed successfully"
else
    log_error "Database dump failed"
    exit 1
fi

# Calculate backup size
BACKUP_SIZE=$(du -sb "${BACKUP_PATH}" | cut -f1)
log_info "Backup size: $(numfmt --to=iec-i --suffix=B ${BACKUP_SIZE})"

# Upload to S3/MinIO
log_info "Uploading backup to S3..."
if command -v aws &> /dev/null; then
    aws s3 sync "${BACKUP_PATH}" "s3://${S3_BUCKET}/postgresql/${BACKUP_NAME}/" --storage-class STANDARD_IA
    aws s3 cp "${BACKUP_PATH}.dump" "s3://${S3_BUCKET}/postgresql/${BACKUP_NAME}.dump" --storage-class STANDARD_IA
elif command -v mc &> /dev/null; then
    mc mirror "${BACKUP_PATH}" "backup/${S3_BUCKET}/postgresql/${BACKUP_NAME}/"
    mc cp "${BACKUP_PATH}.dump" "backup/${S3_BUCKET}/postgresql/${BACKUP_NAME}.dump"
else
    log_warn "Neither AWS CLI nor MinIO client found, skipping upload"
fi

# Verify backup
log_info "Verifying backup integrity..."
if [ -f "${BACKUP_PATH}/base.tar.gz" ]; then
    if tar -tzf "${BACKUP_PATH}/base.tar.gz" > /dev/null 2>&1; then
        log_info "Backup verification successful"
    else
        log_error "Backup verification failed"
        exit 1
    fi
fi

# Create backup metadata
cat > "${BACKUP_PATH}/metadata.json" << EOF
{
  "backup_name": "${BACKUP_NAME}",
  "timestamp": "${TIMESTAMP}",
  "database": "${POSTGRES_DB}",
  "host": "${POSTGRES_HOST}",
  "size_bytes": ${BACKUP_SIZE},
  "type": "full",
  "status": "completed"
}
EOF

# Send metrics to Prometheus Pushgateway
if command -v curl &> /dev/null && [ -n "${PUSHGATEWAY_URL}" ]; then
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/backup/instance/postgresql"
# TYPE backup_duration_seconds gauge
backup_duration_seconds{service="postgresql",type="full"} $SECONDS
# TYPE backup_size_bytes gauge
backup_size_bytes{service="postgresql",type="full"} ${BACKUP_SIZE}
# TYPE backup_success_total counter
backup_success_total{service="postgresql"} 1
# TYPE backup_timestamp gauge
backup_timestamp{service="postgresql"} $(date +%s)
EOF
fi

# Cleanup old backups
log_info "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "postgresql_*" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true
find "${BACKUP_DIR}" -name "postgresql_*.dump" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Cleanup old S3 backups
if command -v aws &> /dev/null; then
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    aws s3 ls "s3://${S3_BUCKET}/postgresql/" | while read -r line; do
        BACKUP_DATE=$(echo $line | awk '{print $1}')
        BACKUP_DIR=$(echo $line | awk '{print $2}')
        if [[ "${BACKUP_DATE}" < "${CUTOFF_DATE}" ]]; then
            log_info "Deleting old backup: ${BACKUP_DIR}"
            aws s3 rm "s3://${S3_BUCKET}/postgresql/${BACKUP_DIR}" --recursive
        fi
    done
fi

log_info "PostgreSQL backup completed successfully: ${BACKUP_NAME}"
log_info "Backup location: ${BACKUP_PATH}"
log_info "Total duration: ${SECONDS} seconds"

exit 0
