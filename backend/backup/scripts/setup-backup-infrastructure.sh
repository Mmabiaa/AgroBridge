#!/bin/bash

# Setup Backup Infrastructure
# Configures automated backups, replication, and monitoring

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Banner
echo "========================================="
echo "  AgroBridge Backup Infrastructure Setup"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_warn "This script should be run as root for full functionality"
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "${CONTINUE}" != "yes" ]; then
        exit 1
    fi
fi

# Step 1: Install dependencies
log_step "Step 1: Installing dependencies..."

if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y postgresql-client mongodb-clients redis-tools \
        awscli python3-pip cron rsync gzip tar
elif command -v yum &> /dev/null; then
    yum install -y postgresql mongodb-org-tools redis awscli python3-pip \
        cronie rsync gzip tar
else
    log_warn "Package manager not recognized. Please install dependencies manually."
fi

# Install MinIO client
if ! command -v mc &> /dev/null; then
    log_info "Installing MinIO client..."
    wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
    chmod +x /usr/local/bin/mc
fi

log_info "Dependencies installed successfully"

# Step 2: Create backup directories
log_step "Step 2: Creating backup directories..."

mkdir -p /var/backups/postgresql
mkdir -p /var/backups/mongodb
mkdir -p /var/backups/redis
mkdir -p /var/backups/files
mkdir -p /var/lib/postgresql/wal_archive
mkdir -p /var/log/backups

# Set permissions
chown -R postgres:postgres /var/backups/postgresql /var/lib/postgresql/wal_archive 2>/dev/null || true
chown -R mongodb:mongodb /var/backups/mongodb 2>/dev/null || true
chown -R redis:redis /var/backups/redis 2>/dev/null || true

log_info "Backup directories created successfully"

# Step 3: Configure PostgreSQL WAL archiving
log_step "Step 3: Configuring PostgreSQL WAL archiving..."

POSTGRES_CONF="/etc/postgresql/*/main/postgresql.conf"
if [ -f "${POSTGRES_CONF}" ]; then
    log_info "Configuring PostgreSQL for WAL archiving..."
    
    # Backup original config
    cp "${POSTGRES_CONF}" "${POSTGRES_CONF}.backup.$(date +%Y%m%d)"
    
    # Add WAL archiving configuration
    cat >> "${POSTGRES_CONF}" << 'EOF'

# WAL Archiving Configuration (Added by backup setup)
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 300
max_wal_senders = 10
wal_keep_size = 1GB
hot_standby = on
EOF

    log_info "PostgreSQL WAL archiving configured. Restart PostgreSQL to apply changes."
else
    log_warn "PostgreSQL config not found. Configure WAL archiving manually."
fi

# Step 4: Configure MongoDB oplog
log_step "Step 4: Configuring MongoDB replica set..."

if command -v mongosh &> /dev/null; then
    log_info "MongoDB found. Configure replica set manually if not already done:"
    echo "  rs.initiate()"
    echo "  rs.status()"
else
    log_warn "MongoDB not found. Skip replica set configuration."
fi

# Step 5: Configure Redis persistence
log_step "Step 5: Configuring Redis persistence..."

REDIS_CONF="/etc/redis/redis.conf"
if [ -f "${REDIS_CONF}" ]; then
    log_info "Configuring Redis persistence..."
    
    # Backup original config
    cp "${REDIS_CONF}" "${REDIS_CONF}.backup.$(date +%Y%m%d)"
    
    # Enable RDB and AOF
    sed -i 's/^save.*/save 900 1\nsave 300 10\nsave 60 10000/' "${REDIS_CONF}"
    sed -i 's/^appendonly no/appendonly yes/' "${REDIS_CONF}"
    sed -i 's/^# appendfsync everysec/appendfsync everysec/' "${REDIS_CONF}"
    
    log_info "Redis persistence configured. Restart Redis to apply changes."
else
    log_warn "Redis config not found. Configure persistence manually."
fi

# Step 6: Configure S3/MinIO storage
log_step "Step 6: Configuring backup storage..."

read -p "Configure AWS S3 or MinIO? (s3/minio/skip): " STORAGE_TYPE

if [ "${STORAGE_TYPE}" == "s3" ]; then
    log_info "Configuring AWS S3..."
    read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    echo ""
    read -p "AWS Region: " AWS_REGION
    read -p "S3 Bucket Name: " S3_BUCKET
    
    # Configure AWS CLI
    aws configure set aws_access_key_id "${AWS_ACCESS_KEY_ID}"
    aws configure set aws_secret_access_key "${AWS_SECRET_ACCESS_KEY}"
    aws configure set region "${AWS_REGION}"
    
    # Create bucket if it doesn't exist
    aws s3 mb "s3://${S3_BUCKET}" 2>/dev/null || log_info "Bucket already exists"
    
    # Enable versioning
    aws s3api put-bucket-versioning --bucket "${S3_BUCKET}" \
        --versioning-configuration Status=Enabled
    
    # Enable encryption
    aws s3api put-bucket-encryption --bucket "${S3_BUCKET}" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    
    log_info "AWS S3 configured successfully"
    
elif [ "${STORAGE_TYPE}" == "minio" ]; then
    log_info "Configuring MinIO..."
    read -p "MinIO Endpoint (e.g., http://localhost:9000): " MINIO_ENDPOINT
    read -p "MinIO Access Key: " MINIO_ACCESS_KEY
    read -sp "MinIO Secret Key: " MINIO_SECRET_KEY
    echo ""
    read -p "MinIO Bucket Name: " MINIO_BUCKET
    
    # Configure MinIO client
    mc alias set backup "${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"
    
    # Create bucket if it doesn't exist
    mc mb "backup/${MINIO_BUCKET}" 2>/dev/null || log_info "Bucket already exists"
    
    # Enable versioning
    mc version enable "backup/${MINIO_BUCKET}"
    
    log_info "MinIO configured successfully"
else
    log_warn "Skipping backup storage configuration"
fi

# Step 7: Setup backup scripts
log_step "Step 7: Setting up backup scripts..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPTS_DIR="/usr/local/bin/backup-scripts"

mkdir -p "${BACKUP_SCRIPTS_DIR}"

# Copy backup scripts
cp "${SCRIPT_DIR}/backup-postgresql.sh" "${BACKUP_SCRIPTS_DIR}/"
cp "${SCRIPT_DIR}/backup-mongodb.sh" "${BACKUP_SCRIPTS_DIR}/"
cp "${SCRIPT_DIR}/backup-redis.sh" "${BACKUP_SCRIPTS_DIR}/" 2>/dev/null || log_warn "Redis backup script not found"
cp "${SCRIPT_DIR}/backup-files.sh" "${BACKUP_SCRIPTS_DIR}/" 2>/dev/null || log_warn "Files backup script not found"
cp "${SCRIPT_DIR}/verify-backups.sh" "${BACKUP_SCRIPTS_DIR}/" 2>/dev/null || log_warn "Verification script not found"

# Make scripts executable
chmod +x "${BACKUP_SCRIPTS_DIR}"/*.sh

log_info "Backup scripts installed to ${BACKUP_SCRIPTS_DIR}"

# Step 8: Setup cron jobs
log_step "Step 8: Setting up backup schedules..."

# Create cron file
cat > /etc/cron.d/agrobridge-backups << 'EOF'
# AgroBridge Backup Schedule
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# PostgreSQL full backup - Daily at 2:00 AM UTC
0 2 * * * root /usr/local/bin/backup-scripts/backup-postgresql.sh >> /var/log/backups/postgresql.log 2>&1

# MongoDB full backup - Daily at 3:00 AM UTC
0 3 * * * root /usr/local/bin/backup-scripts/backup-mongodb.sh >> /var/log/backups/mongodb.log 2>&1

# Redis snapshot - Every 6 hours
0 */6 * * * root /usr/local/bin/backup-scripts/backup-redis.sh >> /var/log/backups/redis.log 2>&1

# File storage backup - Daily at 4:00 AM UTC
0 4 * * * root /usr/local/bin/backup-scripts/backup-files.sh >> /var/log/backups/files.log 2>&1

# Backup verification - Daily at midnight
0 0 * * * root /usr/local/bin/backup-scripts/verify-backups.sh >> /var/log/backups/verification.log 2>&1
EOF

chmod 644 /etc/cron.d/agrobridge-backups

log_info "Backup schedules configured"

# Step 9: Setup monitoring
log_step "Step 9: Setting up backup monitoring..."

# Copy alert rules to Prometheus
PROMETHEUS_RULES_DIR="/etc/prometheus/rules"
if [ -d "${PROMETHEUS_RULES_DIR}" ]; then
    cp "${SCRIPT_DIR}/../monitoring/backup-alerts.yml" "${PROMETHEUS_RULES_DIR}/"
    log_info "Backup alert rules installed"
    log_warn "Restart Prometheus to load new alert rules"
else
    log_warn "Prometheus rules directory not found. Install alert rules manually."
fi

# Step 10: Test backup configuration
log_step "Step 10: Testing backup configuration..."

log_info "Running test backups..."

# Test PostgreSQL backup
if command -v pg_isready &> /dev/null && pg_isready > /dev/null 2>&1; then
    log_info "Testing PostgreSQL backup..."
    "${BACKUP_SCRIPTS_DIR}/backup-postgresql.sh" || log_warn "PostgreSQL backup test failed"
else
    log_warn "PostgreSQL not available. Skip backup test."
fi

# Test MongoDB backup
if command -v mongosh &> /dev/null; then
    log_info "Testing MongoDB backup..."
    "${BACKUP_SCRIPTS_DIR}/backup-mongodb.sh" || log_warn "MongoDB backup test failed"
else
    log_warn "MongoDB not available. Skip backup test."
fi

# Summary
echo ""
echo "========================================="
echo "  Backup Infrastructure Setup Complete"
echo "========================================="
echo ""
log_info "Backup directories: /var/backups/"
log_info "Backup scripts: ${BACKUP_SCRIPTS_DIR}"
log_info "Backup logs: /var/log/backups/"
log_info "Cron schedule: /etc/cron.d/agrobridge-backups"
echo ""
log_info "Next steps:"
echo "  1. Restart PostgreSQL: systemctl restart postgresql"
echo "  2. Restart Redis: systemctl restart redis"
echo "  3. Restart Prometheus: systemctl restart prometheus"
echo "  4. Configure MongoDB replica set if not done"
echo "  5. Test restore procedures"
echo "  6. Schedule DR drills"
echo ""
log_info "For more information, see: backend/backup/README.md"

exit 0
