#!/bin/bash
# ==============================================================================
# Database Initialization and Seed Script
# ==============================================================================

set -e

CONTAINER_NAME="${BACKEND_CONTAINER:-wms_backend}"

echo "=========================================="
echo "Initializing Database and Migrations..."
echo "Container: ${CONTAINER_NAME}"
echo "=========================================="

echo "1. Applying Alembic migrations..."
docker exec -t "${CONTAINER_NAME}" alembic upgrade head

echo "2. Seeding initial data (Roles, Permissions, Super Admin, Master Data)..."
docker exec -t "${CONTAINER_NAME}" python -m app.utils.seed_data

echo "=========================================="
echo "Database initialized successfully!"
echo "Default Super Admin Credentials:"
echo "Email:    admin@stockmanager.local"
echo "Password: Admin@123456"
echo "=========================================="

