#!/bin/bash
# ==============================================================================
# Health Check Verification Script
# ==============================================================================

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"

echo "=========================================="
echo "Checking System Health Status..."
echo "=========================================="

echo "Checking Backend Health at ${BACKEND_URL}/health ..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health" || echo "FAILED")

if [ "${BACKEND_STATUS}" = "200" ]; then
  echo "Backend API: OK (HTTP 200)"
  curl -s "${BACKEND_URL}/health" | jq . || curl -s "${BACKEND_URL}/health"
  echo ""
else
  echo "Backend API: FAILED (Status: ${BACKEND_STATUS})"
  exit 1
fi

echo "Checking Frontend HTTP Response at ${FRONTEND_URL} ..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" || echo "FAILED")

if [ "${FRONTEND_STATUS}" = "200" ]; then
  echo "Frontend Web: OK (HTTP 200)"
else
  echo "Frontend Web: WARNING / FAILED (Status: ${FRONTEND_STATUS})"
fi

echo "=========================================="
echo "All Core Services are Operational!"
echo "=========================================="

