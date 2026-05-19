#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
INFRA_DIR="$ROOT_DIR/infra"

FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${FOX_BACKEND_PORT:-8080}"

node_version_ok() {
  node -e '
    const [major, minor] = process.versions.node.split(".").map(Number);
    process.exit((major > 20 || (major === 20 && minor >= 19)) ? 0 : 1);
  '
}

ensure_java() {
  if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
    return 0
  fi

  local mac_java_home
  local candidate
  mac_java_home="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"

  for candidate in "${JAVA_HOME:-}" "$mac_java_home" /opt/homebrew/opt/openjdk@21 /usr/local/opt/openjdk@21; do
    [[ -n "$candidate" ]] || continue
    if [[ -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      export PATH="$candidate/bin:$PATH"
      return 0
    fi
  done

  return 1
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

print_urls() {
  echo
  echo "Fox Procureflow local URLs"
  echo "Frontend:     http://localhost:${FRONTEND_PORT}"
  echo "Backend:      http://localhost:${BACKEND_PORT}/api/health"
  echo "Swagger UI:   http://localhost:${BACKEND_PORT}/swagger-ui.html"
  echo "RabbitMQ UI:  http://localhost:15672 (reserved)"
  echo "MinIO UI:     http://localhost:9001 (reserved)"
}

stop_existing_listener() {
  local port="$1"
  local label="$2"
  local pids

  if ! command -v lsof >/dev/null 2>&1; then
    return
  fi

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN || true)"
  if [[ -z "$pids" ]]; then
    return
  fi

  echo "Stopping existing ${label} listener(s) on port ${port}: ${pids//$'\n'/ }"
  kill $pids >/dev/null 2>&1 || true
  sleep 1

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN || true)"
  if [[ -n "$pids" ]]; then
    echo "Force stopping existing ${label} listener(s) on port ${port}: ${pids//$'\n'/ }"
    kill -9 $pids >/dev/null 2>&1 || true
  fi
}

start_infra() {
  if [[ "${SKIP_INFRA:-0}" == "1" ]]; then
    echo "Skipping infrastructure because SKIP_INFRA=1."
    return
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed. Start MySQL manually for current core flows; MongoDB, Redis, RabbitMQ, and MinIO are reserved for later slices. Then rerun with SKIP_INFRA=1."
    return
  fi

  if COMPOSE="$(compose_cmd)"; then
    echo "Starting infrastructure with ${COMPOSE}..."
    (cd "$INFRA_DIR" && ${COMPOSE} up -d)
  else
    echo "Docker Compose is not available. Install the Docker Compose plugin or docker-compose, then run:"
    echo "  cd infra && docker compose up -d"
  fi
}

start_backend() {
  if [[ "${SKIP_BACKEND:-0}" == "1" ]]; then
    echo "Skipping backend because SKIP_BACKEND=1."
    return
  fi

  if ! ensure_java; then
    echo "Java 21 runtime is not available. Install Java 21, then run:"
    echo "  cd backend && ./gradlew bootRun"
    return
  fi

  stop_existing_listener "$BACKEND_PORT" "backend"
  echo "Starting backend on port ${BACKEND_PORT}..."
  (cd "$BACKEND_DIR" && FOX_BACKEND_PORT="$BACKEND_PORT" ./gradlew bootRun) &
  BACKEND_PID=$!
}

start_frontend() {
  if [[ "${SKIP_FRONTEND:-0}" == "1" ]]; then
    echo "Skipping frontend because SKIP_FRONTEND=1."
    return
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "npm is not installed. Install Node.js and npm, then run:"
    echo "  cd frontend && npm install && npm run dev"
    return
  fi

  if ! command -v node >/dev/null 2>&1 || ! node_version_ok; then
    echo "Node.js >=20.19 is required for the current Vite toolchain."
    echo "Current node: $(command -v node >/dev/null 2>&1 && node -v || echo missing)"
    echo "Install or activate a newer Node.js runtime, then run:"
    echo "  cd frontend && npm install && npm run dev"
    return
  fi

  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    echo "Installing frontend dependencies..."
    (cd "$FRONTEND_DIR" && npm install)
  fi

  stop_existing_listener "$FRONTEND_PORT" "frontend"
  echo "Starting frontend on port ${FRONTEND_PORT}..."
  (cd "$FRONTEND_DIR" && npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT") &
  FRONTEND_PID=$!
}

cleanup() {
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" >/dev/null 2>&1 || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT

start_infra
start_backend
start_frontend
print_urls

if [[ -n "${BACKEND_PID:-}${FRONTEND_PID:-}" ]]; then
  wait
fi
