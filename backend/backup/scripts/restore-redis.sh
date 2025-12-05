#!/bin/bash

# Redis Restore Script
# Restores Redis from RDB/AOF backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/redis}"
S3_BUCKET="${S3_BUCKET:-agrobridge-backups-primary}"
REDIS_DATA_DIR="${REDIS_DATA_DIR:-/var/lib/redis}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"

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
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --date DATE    Backup date (YYYYMMDD)"
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
log_warn "WARNING: This will restore Redis"
log_warn "All current data will be replaced!"
log_warn "========================================="
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Find backup
BACKUP_NAME="redis_${BACKUP_DATE}"
BACKUP_ARCHIVE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

log_info "Starting Redis restore: ${BACKUP_NAME}"

# Download from S3 if not local
if [ ! -f "${BACKUP_ARCHIVE}" ]; then
    log_info "Backup not found locally, downloading from S3..."
    
    if command -v aws &> /dev/null; then
        aws s3 cp "s3://${S3_BUCKET}/redis/${BACKUP_NAME}.tar.gz" "${BACKUP_ARCHIVE}"
    elif command -v mc &> /dev/null; then
        mc cp "backup/${S3_BUCKET}/redis/${BACKUP_NAME}.tar.gz" "${BACKUP_ARCHIVE}"
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

# Stop Redis
log_info "Stopping Redis..."
if command -v systemctl &> /dev/null; then
    systemctl stop redis
elif command -v service &> /dev/null; then
    service redis stop
else
    if [ -n "${REDIS_PASSWORD}" ]; then
        redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" -a "${REDIS_PASSWORD}" shutdown
    else
        redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" shutdown
    fi
fi

# Backup current data
log_info "Backing up current data..."
if [ -f "${REDIS_DATA_DIR}/dump.rdb" ]; then
    mv "${REDIS_DATA_DIR}/dump.rdb" "${REDIS_DATA_DIR}/dump.rdb.backup.$(date +%Y%m%d_%H%M%S)"
fi
if [ -f "${REDIS_DATA_DIR}/appendonly.aof" ]; then
    mv "${REDIS_DATA_DIR}/appendonly.aof" "${REDIS_DATA_DIR}/appendonly.aof.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Restore RDB file
log_info "Restoring RDB snapshot..."
cp "${BACKUP_NAME}/dump.rdb" "${REDIS_DATA_DIR}/dump.rdb"

# Restore AOF file if exists
if [ -f "${BACKUP_NAME}/appendonly.aof" ]; then
    log_info "Restoring AOF file..."
    cp "${BACKUP_NAME}/appendonly.aof" "${REDIS_DATA_DIR}/appendonly.aof"
fi

# Set permissions
chown redis:redis "${REDIS_DATA_DIR}/dump.rdb" 2>/dev/null || true
if [ -f "${REDIS_DATA_DIR}/appendonly.aof" ]; then
    chown redis:redis "${REDIS_DATA_DIR}/appendonly.aof" 2>/dev/null || true
fi

# Start Redis
log_info "Starting Redis..."
if command -v systemctl &> /dev/null; then
    systemctl start redis
elif command -v service &> /dev/null; then
    service redis start
else
    redis-server /etc/redis/redis.conf &
fi

# Wait for Redis to be ready
log_info "Waiting for Redis to be ready..."
for i in {1..30}; do
    if [ -n "${REDIS_PASSWORD}" ]; then
        REDIS_CLI="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT} -a ${REDIS_PASSWORD}"
    else
        REDIS_CLI="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT}"
    fi
    
    if ${REDIS_CLI} ping > /dev/null 2>&1; then
        log_info "Redis is ready"
        break
    fi
    sleep 2
done

# Verify restore
log_info "Verifying restore..."
if ${REDIS_CLI} ping > /dev/null 2>&1; then
    log_info "Redis restore completed successfully"
    
    # Get key count
    KEY_COUNT=$(${REDIS_CLI} dbsize | awk '{print $2}')
    log_info "Keys restored: ${KEY_COUNT}"
    
    # Get memory usage
    MEMORY_USED=$(${REDIS_CLI} info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    log_info "Memory used: ${MEMORY_USED}"
else
    log_error "Redis restore failed"
    exit 1
fi

# Cleanup extracted files
log_info "Cleaning up extracted files..."
rm -rf "${BACKUP_NAME}"

# Send metrics to Prometheus Pushgateway
if command -v curl &> /dev/null && [ -n "${PUSHGATEWAY_URL}" ]; then
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/restore/instance/redis"
# TYPE restore_duration_seconds gauge
restore_duration_seconds{service="redis"} $SECONDS
# TYPE restore_success_total counter
restore_success_total{service="redis"} 1
# TYPE restore_timestamp gauge
restore_timestamp{service="redis"} $(date +%s)
EOF
fi

log_info "Redis restore completed successfully"
log_info "Total duration: ${SECONDS} seconds"

exit 0
