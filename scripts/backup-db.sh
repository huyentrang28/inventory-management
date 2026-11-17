#!/bin/bash
# ==============================================================================
# Database Backup Script for Enterprise Warehouse & Inventory Management System
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/stockmanager_backup_${TIMESTAMP}.sql.gz"

CONTAINER_NAME="${DB_CONTAINER:-wms_postgres}"
DB_NAME="${POSTGRES_DB:-stockmanager}"
DB_USER="${POSTGRES_USER:-stockuser}"

mkdir -p "${BACKUP_DIR}"

echo "=========================================="
echo "Starting PostgreSQL Backup..."
echo "Database:  ${DB_NAME}"
echo "Container: ${CONTAINER_NAME}"
echo "Destination: ${BACKUP_FILE}"
echo "=========================================="

docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

FILESIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "Backup completed successfully!"
echo "Backup File: ${BACKUP_FILE} (Size: ${FILESIZE})"

# Retention policy: Keep backups for 30 days
find "${BACKUP_DIR}" -type f -name "stockmanager_backup_*.sql.gz" -mtime +30 -exec rm -f {} \;
echo "Cleaned up backups older than 30 days."

