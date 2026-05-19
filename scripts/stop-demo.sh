#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="${FOX_LOCAL_PID_DIR:-$ROOT_DIR/.local/pids}"
BACKEND_LABEL="com.foxprocureflow.backend"
FRONTEND_LABEL="com.foxprocureflow.frontend"

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

stop_launchctl_job() {
  local label="$1"
  local name="$2"

  if ! command -v launchctl >/dev/null 2>&1; then
    return 0
  fi

  if launchctl list "$label" >/dev/null 2>&1; then
    echo "Stopping ${name} launchctl job ${label}..."
    launchctl remove "$label" >/dev/null 2>&1 || true
  fi
}

stop_pid_file() {
  local file="$1"
  local label="$2"
  local pid

  if [[ ! -f "$file" ]]; then
    return 0
  fi
  pid="$(cat "$file" 2>/dev/null || true)"
  rm -f "$file"

  if [[ -z "$pid" ]]; then
    return
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "Stopping ${label} process ${pid}..."
    kill "$pid" >/dev/null 2>&1 || true
  fi
}

stop_port_listener() {
  local port="$1"
  local label="$2"
  local pids

  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi

  echo "Stopping ${label} listener(s) on port ${port}: ${pids//$'\n'/ }"
  kill $pids >/dev/null 2>&1 || true
  sleep 1

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN || true)"
  if [[ -n "$pids" ]]; then
    echo "Force stopping ${label} listener(s) on port ${port}: ${pids//$'\n'/ }"
    kill -9 $pids >/dev/null 2>&1 || true
  fi
}

stop_launchctl_job "$BACKEND_LABEL" "backend"
stop_launchctl_job "$FRONTEND_LABEL" "frontend"
stop_pid_file "$PID_DIR/backend.pid" "backend"
stop_pid_file "$PID_DIR/frontend.pid" "frontend"
stop_port_listener "$BACKEND_PORT" "backend"
stop_port_listener "$FRONTEND_PORT" "frontend"

if [[ "${STOP_INFRA:-0}" == "1" ]]; then
  if docker compose version >/dev/null 2>&1; then
    (cd "$ROOT_DIR/infra" && docker compose down)
  elif command -v docker-compose >/dev/null 2>&1; then
    (cd "$ROOT_DIR/infra" && docker-compose down)
  else
    echo "Docker Compose is unavailable; infrastructure was not stopped."
  fi
fi

echo "Fox Procureflow local demo processes stopped."
