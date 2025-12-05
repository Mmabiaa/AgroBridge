#!/bin/bash

# File Storage Backup Script
# Performs incremental backup of MinIO/file storage

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/files}"
S3_BUCKET="${S3_BUCKET:-agrobridge-backups-primary}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
SOURCE_DIR="${SOURCE_DIR:-/var/lib/minio/data}"
BACKUP_TYPE="${BACKUP_TYPE:-incremental}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="files_${TIMESTAMP}"
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

log_info "Starting file storage backup: ${BACKUP_NAME} (${BACKUP_TYPE})"

# Check source directory
if [ ! -d "${SOURCE_DIR}" ]; then
    log_error "Source directory not found: ${SOURCE_DIR}"
    exit 1
fi

# Perform backup based on type
if [ "${BACKUP_TYPE}" == "full" ]; then
    log_info "Performing full backup..."
    rsync -av --delete "${SOURCE_DIR}/" "${BACKUP_PATH}/"
else
    log_info "Performing incremental backup..."
    
    # Find latest full backup for hard linking
    LATEST_FULL=$(find "${BACKUP_DIR}" -name "files_*" -type d | sort -r | head -n 1)
    
    if [ -n "${LATEST_FULL}" ]; then
        log_info "Using ${LATEST_FULL} as base for incremental backup"
        rsync -av --delete --link-dest="${LATEST_FULL}" "${SOURCE_DIR}/" "${BACKUP_PATH}/"
    else
        log_warn "No previous backup found, performing full backup"
        rsync -av --delete "${SOURCE_DIR}/" "${BACKUP_PATH}/"
    fi
fi

if [ $? -eq 0 ]; then
    log_info "File backup completed successfully"
else
    log_error "File backup failed"
    exit 1
fi

# Calculate backup size
BACKUP_SIZE=$(du -sb "${BACKUP_PATH}" | cut -f1)
log_info "Backup size: $(numfmt --to=iec-i --suffix=B ${BACKUP_SIZE})"

# Upload to S3/MinIO
log_info "Uploading backup to S3..."
if command -v aws &> /dev/null; then
    aws s3 sync "${BACKUP_PATH}" "s3://${S3_BUCKET}/files/${BACKUP_NAME}/" --storage-class STANDARD_IA
elif command -v mc &> /dev/null; then
    mc mirror "${BACKUP_PATH}" "backup/${S3_BUCKET}/files/${BACKUP_NAME}/"
else
    log_warn "Neither AWS CLI nor MinIO client found, skipping upload"
fi

# Create backup metadata
FILE_COUNT=$(find "${BACKUP_PATH}" -type f | wc -l)
cat > "${BACKUP_PATH}/metadata.json" << EOF
{
  "backup_name": "${BACKUP_NAME}",
  "timestamp": "${TIMESTAMP}",
  "source": "${SOURCE_DIR}",
  "size_bytes": ${BACKUP_SIZE},
  "file_count": ${FILE_COUNT},
  "type": "${BACKUP_TYPE}",
  "status": "completed"
}
EOF

# Send metrics to Prometheus Pushgateway
if command -v curl &> /dev/null && [ -n "${PUSHGATEWAY_URL}" ]; then
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/backup/instance/files"
# TYPE backup_duration_seconds gauge
backup_duration_seconds{service="files",type="${BACKUP_TYPE}"} $SECONDS
# TYPE backup_size_bytes gauge
backup_size_bytes{service="files",type="${BACKUP_TYPE}"} ${BACKUP_SIZE}
# TYPE backup_file_count gauge
backup_file_count{service="files"} ${FILE_COUNT}
# TYPE backup_success_total counter
backup_success_total{service="files"} 1
# TYPE backup_timestamp gauge
backup_timestamp{service="files"} $(date +%s)
EOF
fi

# Cleanup old backups
log_info "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "files_*" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true

log_info "File storage backup completed successfully: ${BACKUP_NAME}"
log_info "Total duration: ${SECONDS} seconds"

exit 0
