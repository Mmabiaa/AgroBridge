#!/bin/bash

# PostgreSQL Restore Script
# Restores PostgreSQL from backup with PITR support

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
S3_BUCKET="${S3_BUCKET:-agrobridge-backups-primary}"
POSTGRES_DATA_DIR="${POSTGRES_DATA_DIR:-/var/lib/postgresql/data}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-agrobridge}"

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
RECOVERY_TARGET_TIME=""
RESTORE_TYPE="full"

while [[ $# -gt 0 ]]; do
    case $1 in
        --date)
            BACKUP_DATE="$2"
            shift 2
            ;;
        --time)
            RECOVERY_TARGET_TIME="$2"
            RESTORE_TYPE="pitr"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --date DATE          Backup date (YYYYMMDD)"
            echo "  --time TIMESTAMP     Recovery target time (YYYY-MM-DD HH:MM:SS)"
            echo "  --help               Show this help message"
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
log_warn "WARNING: This will restore PostgreSQL"
log_warn "All current data will be replaced!"
log_warn "========================================="
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Find backup
BACKUP_NAME="postgresql_${BACKUP_DATE}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

log_info "Starting PostgreSQL restore: ${BACKUP_NAME}"

# Download from S3 if not local
if [ ! -d "${BACKUP_PATH}" ]; then
    log_info "Backup not found locally, downloading from S3..."
    mkdir -p "${BACKUP_PATH}"
    
    if command -v aws &> /dev/null; then
        aws s3 sync "s3://${S3_BUCKET}/postgresql/${BACKUP_NAME}/" "${BACKUP_PATH}/"
        aws s3 cp "s3://${S3_BUCKET}/postgresql/${BACKUP_NAME}.dump" "${BACKUP_PATH}.dump"
    elif command -v mc &> /dev/null; then
        mc mirror "backup/${S3_BUCKET}/postgresql/${BACKUP_NAME}/" "${BACKUP_PATH}/"
        mc cp "backup/${S3_BUCKET}/postgresql/${BACKUP_NAME}.dump" "${BACKUP_PATH}.dump"
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

# Stop PostgreSQL
log_info "Stopping PostgreSQL..."
if command -v systemctl &> /dev/null; then
    systemctl stop postgresql
elif command -v service &> /dev/null; then
    service postgresql stop
else
    pg_ctl stop -D "${POSTGRES_DATA_DIR}"
fi

# Backup current data
log_info "Backing up current data directory..."
if [ -d "${POSTGRES_DATA_DIR}" ]; then
    mv "${POSTGRES_DATA_DIR}" "${POSTGRES_DATA_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Restore base backup
log_info "Restoring base backup..."
mkdir -p "${POSTGRES_DATA_DIR}"

if [ -f "${BACKUP_PATH}/base.tar.gz" ]; then
    tar -xzf "${BACKUP_PATH}/base.tar.gz" -C "${POSTGRES_DATA_DIR}"
else
    log_error "Base backup not found"
    exit 1
fi

# Configure recovery
if [ "${RESTORE_TYPE}" == "pitr" ]; then
    log_info "Configuring point-in-time recovery to: ${RECOVERY_TARGET_TIME}"
    
    cat > "${POSTGRES_DATA_DIR}/recovery.conf" << EOF
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_time = '${RECOVERY_TARGET_TIME}'
recovery_target_action = 'promote'
EOF
else
    log_info "Configuring full recovery"
    
    cat > "${POSTGRES_DATA_DIR}/recovery.conf" << EOF
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_action = 'promote'
EOF
fi

# Set permissions
chown -R postgres:postgres "${POSTGRES_DATA_DIR}"
chmod 700 "${POSTGRES_DATA_DIR}"

# Start PostgreSQL
log_info "Starting PostgreSQL..."
if command -v systemctl &> /dev/null; then
    systemctl start postgresql
elif command -v service &> /dev/null; then
    service postgresql start
else
    pg_ctl start -D "${POSTGRES_DATA_DIR}"
fi

# Wait for PostgreSQL to be ready
log_info "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" > /dev/null 2>&1; then
        log_info "PostgreSQL is ready"
        break
    fi
    sleep 2
done

# Verify recovery
log_info "Verifying recovery..."
if pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" > /dev/null 2>&1; then
    log_info "PostgreSQL restore completed successfully"
    
    # Get database size
    DB_SIZE=$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c "SELECT pg_size_pretty(pg_database_size('${POSTGRES_DB}'))")
    log_info "Database size: ${DB_SIZE}"
    
    # Get table count
    TABLE_COUNT=$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
    log_info "Table count: ${TABLE_COUNT}"
else
    log_error "PostgreSQL restore failed"
    exit 1
fi

# Send metrics to Prometheus Pushgateway
if command -v curl &> /dev/null && [ -n "${PUSHGATEWAY_URL}" ]; then
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/restore/instance/postgresql"
# TYPE restore_duration_seconds gauge
restore_duration_seconds{service="postgresql",type="${RESTORE_TYPE}"} $SECONDS
# TYPE restore_success_total counter
restore_success_total{service="postgresql"} 1
# TYPE restore_timestamp gauge
restore_timestamp{service="postgresql"} $(date +%s)
EOF
fi

log_info "PostgreSQL restore completed successfully"
log_info "Restore type: ${RESTORE_TYPE}"
log_info "Total duration: ${SECONDS} seconds"

exit 0
