#!/bin/bash
# ==============================================================================
# Database Restore Script for Enterprise Warehouse & Inventory Management System
# ==============================================================================

set -e

BACKUP_FILE="$1"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  echo "Example: $0 ./backups/stockmanager_backup_20261106_120000.sql.gz"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found at '${BACKUP_FILE}'"
  exit 1
fi

CONTAINER_NAME="${DB_CONTAINER:-wms_postgres}"
DB_NAME="${POSTGRES_DB:-stockmanager}"
DB_USER="${POSTGRES_USER:-stockuser}"

echo "=========================================="
echo "WARNING: Restoring will overwrite existing data in '${DB_NAME}'!"
echo "Backup File: ${BACKUP_FILE}"
echo "Container:   ${CONTAINER_NAME}"
echo "=========================================="
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore aborted by user."
  exit 0
fi

echo "Restoring database..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "Database restored successfully from ${BACKUP_FILE}!"

