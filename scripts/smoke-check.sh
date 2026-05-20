#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$ROOT_DIR/infra"

load_root_env() {
  local env_file="$ROOT_DIR/.env"
  local line key value

  [[ -f "$env_file" ]] || return

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*$ || "$line" =~ ^[[:space:]]*# ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    [[ "${!key+x}" == "x" ]] && continue
    export "$key=$value"
  done < "$env_file"
}

load_root_env

FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${FOX_BACKEND_PORT:-8080}"
BACKEND_BASE_URL="${BACKEND_BASE_URL:-http://localhost:${BACKEND_PORT}}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:${FRONTEND_PORT}}"
HTTP_TIMEOUT="${SMOKE_HTTP_TIMEOUT:-8}"
TMP_DIR="$(mktemp -d)"
FAILURES=0
WARNINGS=0

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

ok() {
  printf '[OK]   %s\n' "$*"
}

warn() {
  WARNINGS=$((WARNINGS + 1))
  printf '[WARN] %s\n' "$*"
}

fail() {
  FAILURES=$((FAILURES + 1))
  printf '[FAIL] %s\n' "$*"
}

require_command() {
  local name="$1"

  if command -v "$name" >/dev/null 2>&1; then
    ok "Found command: ${name}"
  else
    fail "Missing command: ${name}"
  fi
}

check_tcp() {
  local label="$1"
  local host="$2"
  local port="$3"
  local required="$4"

  if command -v nc >/dev/null 2>&1; then
    if nc -z "$host" "$port" >/dev/null 2>&1; then
      ok "${label} is listening on ${host}:${port}"
      return
    fi
  elif (: > /dev/tcp/"$host"/"$port") >/dev/null 2>&1; then
    ok "${label} is listening on ${host}:${port}"
    return
  fi

  if [[ "$required" == "required" ]]; then
    fail "${label} is not listening on ${host}:${port}"
  else
    warn "${label} is not listening on ${host}:${port}"
  fi
}

http_check() {
  local label="$1"
  local url="$2"
  local needle="${3:-}"
  local required="${4:-required}"
  local body="$TMP_DIR/${label//[^A-Za-z0-9]/_}.body"
  local err="$TMP_DIR/${label//[^A-Za-z0-9]/_}.err"
  local status

  status="$(curl -fsS --max-time "$HTTP_TIMEOUT" -o "$body" -w '%{http_code}' "$url" 2>"$err")"
  local curl_status=$?

  if [[ "$curl_status" -ne 0 ]]; then
    if [[ "$required" == "required" ]]; then
      fail "${label} request failed: ${url} ($(tr '\n' ' ' < "$err"))"
    else
      warn "${label} request failed: ${url} ($(tr '\n' ' ' < "$err"))"
    fi
    return
  fi

  if [[ "$status" != "200" ]]; then
    if [[ "$required" == "required" ]]; then
      fail "${label} returned HTTP ${status}: ${url}"
    else
      warn "${label} returned HTTP ${status}: ${url}"
    fi
    return
  fi

  if [[ -n "$needle" ]] && ! grep -Fq "$needle" "$body"; then
    if [[ "$required" == "required" ]]; then
      fail "${label} did not include expected text: ${needle}"
    else
      warn "${label} did not include expected text: ${needle}"
    fi
    return
  fi

  ok "${label} returned HTTP 200"
}

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
    return 0
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
    return 0
  fi

  return 1
}

check_compose_config() {
  local compose

  if ! command -v docker >/dev/null 2>&1; then
    warn "Docker is unavailable; skipping Docker Compose config check"
    return
  fi

  if compose="$(compose_cmd)"; then
    if (cd "$ROOT_DIR" && ${compose} -f "$INFRA_DIR/docker-compose.yml" config >/dev/null); then
      ok "Docker Compose config parses"
    else
      fail "Docker Compose config failed to parse"
    fi
  else
    warn "Docker Compose is unavailable; skipping Compose config check"
  fi
}

print_targets() {
  echo
  echo "Fox Procureflow MVP smoke targets"
  echo "Frontend:     ${FRONTEND_URL}"
  echo "Backend:      ${BACKEND_BASE_URL}/api/health"
  echo "Swagger UI:   ${BACKEND_BASE_URL}/swagger-ui.html"
  echo "RabbitMQ UI:  http://localhost:15672"
  echo "MinIO UI:     http://localhost:9001"
  echo
  echo "Read-only checks only: this script uses GET/HEAD-style checks and never creates, approves, cancels, receives, invoices, resolves, or deletes procurement records."
  echo
}

print_targets
require_command curl

check_compose_config

check_tcp "MySQL core data store" "127.0.0.1" "3306" "required"
check_tcp "MongoDB AI audit store" "127.0.0.1" "27017" "optional"
check_tcp "MinIO attachment API" "127.0.0.1" "9000" "optional"
check_tcp "RabbitMQ reserved broker" "127.0.0.1" "5672" "optional"

http_check "Backend health" "${BACKEND_BASE_URL}/api/health" "Fox Procureflow"
http_check "OpenAPI JSON" "${BACKEND_BASE_URL}/v3/api-docs" "/api/purchase-requests"
http_check "Swagger UI" "${BACKEND_BASE_URL}/swagger-ui/index.html"
http_check "Frontend workspace" "${FRONTEND_URL}"

http_check "Master data context" "${BACKEND_BASE_URL}/api/master-data/context" "星河控股集团"
http_check "Shared supplier pool" "${BACKEND_BASE_URL}/api/master-data/suppliers" "supplier-yunzhou"
http_check "Group dashboard" "${BACKEND_BASE_URL}/api/procurement-dashboard?scope=GROUP&actorId=user-digital-admin" "success"
http_check "Digital company purchase requests" "${BACKEND_BASE_URL}/api/purchase-requests?companyId=company-digital" "PR-"
http_check "Digital company approval tasks" "${BACKEND_BASE_URL}/api/approvals/tasks?companyId=company-digital&approverId=user-digital-approver" "AP-"
http_check "Digital company RFQs" "${BACKEND_BASE_URL}/api/rfqs?companyId=company-digital" "RFQ-"
http_check "Digital company purchase orders" "${BACKEND_BASE_URL}/api/purchase-orders?companyId=company-digital" "PO-"
http_check "Digital company fulfillment summary" "${BACKEND_BASE_URL}/api/receipts-invoices/purchase-orders?companyId=company-digital" "PO-"
http_check "Manufacturing company matching exceptions" "${BACKEND_BASE_URL}/api/three-way-matching/exceptions?companyId=company-manufacturing" "PO-"
http_check "RFQ attachment metadata" "${BACKEND_BASE_URL}/api/attachments?companyId=company-digital&targetType=RFQ_QUOTE&targetId=RFQ-20260518-0301&supplierId=supplier-yunzhou" "RFQ-20260518-0301-Q02-A01" "optional"

echo
if (( FAILURES == 0 )); then
  if (( WARNINGS == 0 )); then
    echo "MVP smoke check passed with no warnings."
  else
    echo "MVP smoke check passed with ${WARNINGS} warning(s). Core procurement demo is reachable; review warnings for AI, attachments, or reserved infrastructure readiness."
  fi
  exit 0
fi

echo "MVP smoke check failed with ${FAILURES} failure(s) and ${WARNINGS} warning(s)."
exit 1
