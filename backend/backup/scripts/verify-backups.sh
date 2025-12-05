#!/bin/bash

# Backup Verification Script
# Verifies integrity and completeness of all backups

set -e

# Configuration
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-/var/backups}"
S3_BUCKET="${S3_BUCKET:-agrobridge-backups-primary}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

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

log_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

# Verification functions
verify_file_exists() {
    local file=$1
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "${file}" ]; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        log_error "File not found: ${file}"
        return 1
    fi
}

verify_archive_integrity() {
    local archive=$1
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    log_check "Verifying archive integrity: $(basename ${archive})"
    
    if tar -tzf "${archive}" > /dev/null 2>&1; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        log_info "Archive integrity OK"
        return 0
    else
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        log_error "Archive integrity check failed"
        return 1
    fi
}

verify_backup_age() {
    local backup_dir=$1
    local max_age_hours=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    log_check "Verifying backup age for: $(basename ${backup_dir})"
    
    if [ ! -d "${backup_dir}" ]; then
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        log_error "Backup directory not found"
        return 1
    fi
    
    # Find latest backup
    LATEST_BACKUP=$(find "${backup_dir}" -maxdepth 1 -type d -name "*_*" | sort -r | head -n 1)
    
    if [ -z "${LATEST_BACKUP}" ]; then
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        log_error "No backups found"
        return 1
    fi
    
    # Check age
    BACKUP_TIME=$(stat -c %Y "${LATEST_BACKUP}")
    CURRENT_TIME=$(date +%s)
    AGE_HOURS=$(( (CURRENT_TIME - BACKUP_TIME) / 3600 ))
    
    if [ ${AGE_HOURS} -le ${max_age_hours} ]; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        log_info "Backup age OK: ${AGE_HOURS} hours old"
        return 0
    else
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        log_error "Backup too old: ${AGE_HOURS} hours (max: ${max_age_hours})"
        return 1
    fi
}

verify_metadata() {
    local metadata_file=$1
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    log_check "Verifying metadata: $(basename ${metadata_file})"
    
    if [ ! -f "${metadata_file}" ]; then
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        log_error "Metadata file not found"
        return 1
    fi
    
    # Validate JSON
    if command -v jq &> /dev/null; then
        if jq empty "${metadata_file}" 2>/dev/null; then
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            log_info "Metadata valid"
            return 0
        else
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            log_error "Invalid JSON in metadata"
            return 1
        fi
    else
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        log_warn "jq not installed, skipping JSON validation"
        return 0
    fi
}

verify_s3_backup() {
    local service=$1
    local backup_name=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    log_check "Verifying S3 backup for ${service}: ${backup_name}"
    
    if command -v aws &> /dev/null; then
        if aws s3 ls "s3://${S3_BUCKET}/${service}/${backup_name}" > /dev/null 2>&1; then
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            log_info "S3 backup exists"
            return 0
        else
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            log_error "S3 backup not found"
            return 1
        fi
    elif command -v mc &> /dev/null; then
        if mc ls "backup/${S3_BUCKET}/${service}/${backup_name}" > /dev/null 2>&1; then
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            log_info "MinIO backup exists"
            return 0
        else
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            log_error "MinIO backup not found"
            return 1
        fi
    else
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        log_warn "Neither AWS CLI nor MinIO client found, skipping S3 verification"
        return 0
    fi
}

# Main verification
echo "========================================="
echo "  Backup Verification Report"
echo "  $(date)"
echo "========================================="
echo ""

# Verify PostgreSQL backups
log_info "Verifying PostgreSQL backups..."
verify_backup_age "${BACKUP_BASE_DIR}/postgresql" 26

LATEST_PG_BACKUP=$(find "${BACKUP_BASE_DIR}/postgresql" -maxdepth 1 -type d -name "postgresql_*" | sort -r | head -n 1)
if [ -n "${LATEST_PG_BACKUP}" ]; then
    verify_file_exists "${LATEST_PG_BACKUP}/base.tar.gz"
    verify_archive_integrity "${LATEST_PG_BACKUP}/base.tar.gz"
    verify_metadata "${LATEST_PG_BACKUP}/metadata.json"
    verify_s3_backup "postgresql" "$(basename ${LATEST_PG_BACKUP})"
fi

echo ""

# Verify MongoDB backups
log_info "Verifying MongoDB backups..."
verify_backup_age "${BACKUP_BASE_DIR}/mongodb" 26

LATEST_MONGO_BACKUP=$(find "${BACKUP_BASE_DIR}/mongodb" -maxdepth 1 -name "mongodb_*.tar.gz" | sort -r | head -n 1)
if [ -n "${LATEST_MONGO_BACKUP}" ]; then
    verify_file_exists "${LATEST_MONGO_BACKUP}"
    verify_archive_integrity "${LATEST_MONGO_BACKUP}"
    verify_s3_backup "mongodb" "$(basename ${LATEST_MONGO_BACKUP})"
fi

echo ""

# Verify Redis backups
log_info "Verifying Redis backups..."
verify_backup_age "${BACKUP_BASE_DIR}/redis" 8

LATEST_REDIS_BACKUP=$(find "${BACKUP_BASE_DIR}/redis" -maxdepth 1 -name "redis_*.tar.gz" | sort -r | head -n 1)
if [ -n "${LATEST_REDIS_BACKUP}" ]; then
    verify_file_exists "${LATEST_REDIS_BACKUP}"
    verify_archive_integrity "${LATEST_REDIS_BACKUP}"
    verify_s3_backup "redis" "$(basename ${LATEST_REDIS_BACKUP})"
fi

echo ""

# Verify file storage backups
log_info "Verifying file storage backups..."
verify_backup_age "${BACKUP_BASE_DIR}/files" 26

LATEST_FILES_BACKUP=$(find "${BACKUP_BASE_DIR}/files" -maxdepth 1 -type d -name "files_*" | sort -r | head -n 1)
if [ -n "${LATEST_FILES_BACKUP}" ]; then
    verify_metadata "${LATEST_FILES_BACKUP}/metadata.json"
    verify_s3_backup "files" "$(basename ${LATEST_FILES_BACKUP})"
fi

echo ""

# Summary
echo "========================================="
echo "  Verification Summary"
echo "========================================="
echo "Total checks: ${TOTAL_CHECKS}"
echo -e "${GREEN}Passed: ${PASSED_CHECKS}${NC}"
echo -e "${RED}Failed: ${FAILED_CHECKS}${NC}"
echo ""

# Send metrics to Prometheus Pushgateway
if command -v curl &> /dev/null && [ -n "${PUSHGATEWAY_URL}" ]; then
    cat <<EOF | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/backup_verification"
# TYPE backup_verification_total_checks gauge
backup_verification_total_checks ${TOTAL_CHECKS}
# TYPE backup_verification_passed_checks gauge
backup_verification_passed_checks ${PASSED_CHECKS}
# TYPE backup_verification_failed_checks gauge
backup_verification_failed_checks ${FAILED_CHECKS}
# TYPE backup_verification_failed_total counter
backup_verification_failed_total ${FAILED_CHECKS}
# TYPE backup_last_verification_timestamp gauge
backup_last_verification_timestamp $(date +%s)
EOF
fi

# Exit with error if any checks failed
if [ ${FAILED_CHECKS} -gt 0 ]; then
    log_error "Backup verification failed with ${FAILED_CHECKS} errors"
    exit 1
else
    log_info "All backup verifications passed"
    exit 0
fi
