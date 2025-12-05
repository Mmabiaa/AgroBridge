#!/bin/bash

# MongoDB Restore Script
# Restores MongoDB from backup with oplog replay support

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mongodb}"
S3_BUCKET="${S3_BUCKET:-agrobridge-backups-primary}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-admin}"
MONGO_PASSWORD="${MONGO_PASSWORD}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"

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
OPLOG_REPLAY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --date)
            BACKUP_DATE="$2"
            shift 2
            ;;
        --oplog)
            OPLOG_REPLAY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --date DATE    Backup date (YYYYMMDD)"
            echo "  --oplog        Enable oplog replay"
            echo "  --help         Show this help message"
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
log_warn "WARNING: This will restore MongoDB"
log_warn "All current data will be replaced!"
log_warn "========================================="
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Find backup
BACKUP_NAME="mongodb_${BACKUP_DATE}"
BACKUP_ARCHIVE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

log_info "Starting MongoDB restore: ${BACKUP_NAME}"

# Download from S3 if not local
if [ ! -f "${BACKUP_ARCHIVE}" ]; then
    log_info "Backup not found locally, downloading from S3..."
    
    if command -v aws &> /dev/null; then
        aws s3 cp "s3://${S3_BUCKET}/mongodb/${BACKUP_NAME}.tar.gz" "${BACKUP_ARCHIVE}"
    elif command -v mc &> /dev/null; then
        mc cp "backup/${S3_BUCKET}/mongodb/${BACKUP_NAME}.tar.gz" "${BACKUP_ARCHIVE}"
    else
        log_error "Neither AWS CLI nor MinIO client found"
        exit 1
    fi
fi

# Verify backup exists
if [ ! -f "${BACKUP_ARCHIVE}" ]; then
    log_error "Backup not found: ${BACKUP_ARCHIVE}"
    exit 1
fi

# Extract backup
log_info "Extracting backup archive..."
cd "${BACKUP_DIR}"
tar -xzf "${BACKUP_NAME}.tar.gz"

# Restore MongoDB
log_info "Restoring MongoDB..."

RESTORE_CMD="mongorestore --host ${MONGO_HOST} --port ${MONGO_PORT}"

if [ -n "${MONGO_PASSWORD}" ]; then
    RESTORE_CMD="${RESTORE_CMD} --username ${MONGO_USER} --password ${MONGO_PASSWORD} --authenticationDatabase ${MONGO_AUTH_DB}"
fi

if [ "${OPLOG_REPLAY}" = true ]; then
    log_info "Enabling oplog replay..."
    RESTORE_CMD="${RESTORE_CMD} --oplogReplay"
fi

RESTORE_CMD="${RESTORE_CMD} --drop --gzip ${BACKUP_NAME}"

if eval "${RESTORE_CMD}"; then
    log_info "MongoDB restore completed successfully"
else
    log_error "MongoDB restore failed"
    exit 1
fi

# Cleanup extracted files
log_info "Cleaning up extracted files..."
rm -rf "${BACKUP_NAME}"

# Verify restore
log_info "Verifying restore..."
if [ -n "${MONGO_PASSWORD}" ]; then
    MONGO_CMD="mongosh --host ${MONGO_HOST} --port ${MONGO_PORT} --username ${MONGO_USER} --password ${MONGO_PASSWORD} --authenticationDatabase ${MONGO_AUTH_DB}"
else
    MONGO_CMD="mongosh --host ${MONGO_HOST} --port ${MONGO_PORT}"
fi

# Get database stats
DB_COUNT=$(${MONGO_CMD} --quiet --eval "db.adminCommand('listDatabases').databases.length")
log_info "Databases restored: ${DB_COUNT}"

# Send metrics to Prometheus Pushgateway
if command -v curl &> /dev/null && [ -n "${PUSHGATEWAY_URL}" ]; then
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/restore/instance/mongodb"
# TYPE restore_duration_seconds gauge
restore_duration_seconds{service="mongodb"} $SECONDS
# TYPE restore_success_total counter
restore_success_total{service="mongodb"} 1
# TYPE restore_timestamp gauge
restore_timestamp{service="mongodb"} $(date +%s)
EOF
fi

log_info "MongoDB restore completed successfully"
log_info "Total duration: ${SECONDS} seconds"

exit 0
