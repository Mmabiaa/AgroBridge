#!/bin/bash

# File Storage Restore Script
# Restores file storage from backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/files}"
S3_BUCKET="${S3_BUCKET:-agrobridge-backups-primary}"
TARGET_DIR="${TARGET_DIR:-/var/lib/minio/data}"

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

# Parse arguments
BACKUP_DATE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --date)
            BACKUP_DATE="$2"
            shift 2
            ;;
        --target)
            TARGET_DIR="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --date DATE      Backup date (YYYYMMDD)"
            echo "  --target DIR     Target directory (default: /var/lib/minio/data)"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate arguments
if [ -z "${BACKUP_DATE}" ]; then
    log_error "Backup date is required (--date YYYYMMDD)"
    exit 1
fi

log_warn "========================================="
log_warn "WARNING: This will restore file storage"
log_warn "All current files will be replaced!"
log_warn "========================================="
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Find backup
BACKUP_NAME="files_${BACKUP_DATE}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

log_info "Starting file storage restore: ${BACKUP_NAME}"

# Download from S3 if not local
if [ ! -d "${BACKUP_PATH}" ]; then
    log_info "Backup not found locally, downloading from S3..."
    mkdir -p "${BACKUP_PATH}"
    
    if command -v aws &> /dev/null; then
        aws s3 sync "s3://${S3_BUCKET}/files/${BACKUP_NAME}/" "${BACKUP_PATH}/"
    elif command -v mc &> /dev/null; then
        mc mirror "backup/${S3_BUCKET}/files/${BACKUP_NAME}/" "${BACKUP_PATH}/"
    else
        log_error "Neither AWS CLI nor MinIO client found"
        exit 1
    fi
fi

# Verify backup exists
if [ ! -d "${BACKUP_PATH}" ]; then
    log_error "Backup not found: ${BACKUP_PATH}"
    exit 1
fi

# Backup current data
log_info "Backing up current data..."
if [ -d "${TARGET_DIR}" ]; then
    BACKUP_CURRENT="${TARGET_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    mv "${TARGET_DIR}" "${BACKUP_CURRENT}"
    log_info "Current data backed up to: ${BACKUP_CURRENT}"
fi

# Create target directory
mkdir -p "${TARGET_DIR}"

# Restore files
log_info "Restoring files..."
rsync -av --delete "${BACKUP_PATH}/" "${TARGET_DIR}/"

if [ $? -eq 0 ]; then
    log_info "File restore completed successfully"
else
    log_error "File restore failed"
    
    # Attempt to restore from backup
    if [ -d "${BACKUP_CURRENT}" ]; then
        log_warn "Restoring previous data..."
        rm -rf "${TARGET_DIR}"
        mv "${BACKUP_CURRENT}" "${TARGET_DIR}"
    fi
    
    exit 1
fi

# Verify restore
log_info "Verifying restore..."
FILE_COUNT=$(find "${TARGET_DIR}" -type f | wc -l)
TOTAL_SIZE=$(du -sb "${TARGET_DIR}" | cut -f1)

log_info "Files restored: ${FILE_COUNT}"
log_info "Total size: $(numfmt --to=iec-i --suffix=B ${TOTAL_SIZE})"

# Set permissions
log_info "Setting permissions..."
chown -R minio:minio "${TARGET_DIR}" 2>/dev/null || log_warn "Could not set ownership (may need root)"

# Send metrics to Prometheus Pushgateway
if command -v curl &> /dev/null && [ -n "${PUSHGATEWAY_URL}" ]; then
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/restore/instance/files"
# TYPE restore_duration_seconds gauge
restore_duration_seconds{service="files"} $SECONDS
# TYPE restore_file_count gauge
restore_file_count{service="files"} ${FILE_COUNT}
# TYPE restore_size_bytes gauge
restore_size_bytes{service="files"} ${TOTAL_SIZE}
# TYPE restore_success_total counter
restore_success_total{service="files"} 1
# TYPE restore_timestamp gauge
restore_timestamp{service="files"} $(date +%s)
EOF
fi

log_info "File storage restore completed successfully"
log_info "Total duration: ${SECONDS} seconds"

exit 0
