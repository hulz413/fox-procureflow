#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
INFRA_DIR="$ROOT_DIR/infra"
LOG_DIR="${FOX_LOCAL_LOG_DIR:-$ROOT_DIR/.local/logs}"
PID_DIR="${FOX_LOCAL_PID_DIR:-$ROOT_DIR/.local/pids}"
DETACH_MODE=0
BACKEND_LABEL="com.foxprocureflow.backend"
FRONTEND_LABEL="com.foxprocureflow.frontend"
ROOT_ENV_KEYS=()

usage() {
  cat <<'USAGE'
Usage: ./scripts/launch.sh [--detach]

Starts Fox Procureflow local infrastructure, backend, and frontend.

Options:
  --detach, -d   Start backend and frontend in the background and write logs to .local/logs/
  --help, -h     Show this help

Environment:
  SKIP_INFRA=1      Do not start Docker infrastructure
  SKIP_BACKEND=1    Do not start Spring Boot backend
  SKIP_FRONTEND=1   Do not start Vite frontend
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --detach|-d)
      DETACH_MODE=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 2
      ;;
  esac
done

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
    ROOT_ENV_KEYS+=("$key")
    [[ "${!key+x}" == "x" ]] && continue
    export "$key=$value"
  done < "$env_file"
}

load_root_env

FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PORT="${FOX_BACKEND_PORT:-8080}"
LAUNCH_WARNINGS=0

warn_launch() {
  LAUNCH_WARNINGS=$((LAUNCH_WARNINGS + 1))
  echo "WARNING: $*"
}

node_version_ok() {
  node -e '
    const [major, minor] = process.versions.node.split(".").map(Number);
    process.exit((major > 20 || (major === 20 && minor >= 19)) ? 0 : 1);
  '
}

java_version_ok() {
  local version major

  version="$(java -version 2>&1 | awk -F\" '/version/ { print $2; exit }')"
  [[ -n "$version" ]] || return 1

  if [[ "$version" == 1.* ]]; then
    major="${version#1.}"
    major="${major%%.*}"
  else
    major="${version%%.*}"
  fi

  [[ "$major" =~ ^[0-9]+$ ]] && (( major >= 21 ))
}

ensure_java() {
  if command -v java >/dev/null 2>&1 && java_version_ok; then
    return 0
  fi

  local mac_java_home
  local candidate
  mac_java_home="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"

  for candidate in \
    "${JAVA_HOME:-}" \
    "$mac_java_home" \
    /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
    /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
    /opt/homebrew/opt/openjdk@21 \
    /usr/local/opt/openjdk@21; do
    [[ -n "$candidate" ]] || continue
    if [[ -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      export PATH="$candidate/bin:$PATH"
      java_version_ok && return 0
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
  echo "RabbitMQ UI:  http://localhost:15672"
  echo "MinIO UI:     http://localhost:9001"
  echo "Smoke check:  ./scripts/smoke-check.sh"
  if (( DETACH_MODE == 1 )); then
    echo "Logs:         .local/logs/backend.log"
    echo "              .local/logs/frontend.log"
    echo "Stop:         ./scripts/stop-demo.sh"
  fi
  if (( LAUNCH_WARNINGS > 0 )); then
    echo
    echo "Launch completed with ${LAUNCH_WARNINGS} warning(s). Resolve them and run ./scripts/smoke-check.sh before treating this environment as demo-ready."
  else
    echo
    if (( DETACH_MODE == 1 )); then
      echo "Detached launch started without preflight warnings. Run ./scripts/smoke-check.sh after services finish booting to confirm demo readiness."
    else
      echo "Launch started without preflight warnings. Run ./scripts/smoke-check.sh after services finish booting to confirm demo readiness."
    fi
  fi
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

write_detached_env_file() {
  local env_file="$1"
  local key

  : > "$env_file"
  chmod 600 "$env_file"
  printf 'export PATH=%q\n' "$PATH" >> "$env_file"
  printf 'export JAVA_HOME=%q\n' "${JAVA_HOME:-}" >> "$env_file"
  for key in "${ROOT_ENV_KEYS[@]}"; do
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    [[ "${!key+x}" == "x" ]] || continue
    printf 'export %s=%q\n' "$key" "${!key}" >> "$env_file"
  done
}

write_detached_run_file() {
  local run_file="$1"
  local env_file="$2"
  local workdir="$3"
  local pid_file="$4"
  local command="$5"

  cat > "$run_file" <<SCRIPT
#!/usr/bin/env bash
set -euo pipefail
source "$env_file"
cd "$workdir"
echo \$\$ > "$pid_file"
exec $command
SCRIPT
  chmod 700 "$run_file"
}

submit_detached_job() {
  local label="$1"
  local name="$2"
  local workdir="$3"
  local log_file="$4"
  local pid_file="$5"
  local command="$6"
  local env_file="$PID_DIR/${name}.env"
  local run_file="$PID_DIR/${name}.run.sh"

  mkdir -p "$LOG_DIR" "$PID_DIR"
  : > "$log_file"
  write_detached_env_file "$env_file"
  write_detached_run_file "$run_file" "$env_file" "$workdir" "$pid_file" "$command"

  if command -v launchctl >/dev/null 2>&1; then
    launchctl remove "$label" >/dev/null 2>&1 || true
    launchctl submit -l "$label" -o "$log_file" -e "$log_file" -- /bin/bash "$run_file"
    echo "Started ${name} with launchctl label ${label}."
    return
  fi

  nohup /bin/bash "$run_file" > "$log_file" 2>&1 < /dev/null &
  echo "Started ${name} with nohup."
}

start_infra() {
  if [[ "${SKIP_INFRA:-0}" == "1" ]]; then
    echo "Skipping infrastructure because SKIP_INFRA=1."
    return
  fi

  if ! command -v docker >/dev/null 2>&1; then
    warn_launch "Docker is not installed. Start MySQL manually for the core procurement flow, MongoDB for AI audit, and MinIO for attachment upload/download; then rerun with SKIP_INFRA=1."
    return
  fi

  if COMPOSE="$(compose_cmd)"; then
    echo "Starting infrastructure with ${COMPOSE}..."
    (cd "$INFRA_DIR" && ${COMPOSE} up -d)
  else
    warn_launch "Docker Compose is not available. Install the Docker Compose plugin or docker-compose, then run:"
    echo "  cd infra && docker compose up -d"
  fi
}

start_backend() {
  if [[ "${SKIP_BACKEND:-0}" == "1" ]]; then
    echo "Skipping backend because SKIP_BACKEND=1."
    return
  fi

  if ! ensure_java; then
    warn_launch "Java 21+ runtime is not available. Install or activate Java 21, then run:"
    echo "  cd backend && ./gradlew bootRun"
    return
  fi

  stop_existing_listener "$BACKEND_PORT" "backend"
  if (( DETACH_MODE == 1 )); then
    echo "Starting backend on port ${BACKEND_PORT} in the background..."
    submit_detached_job \
      "$BACKEND_LABEL" \
      "backend" \
      "$BACKEND_DIR" \
      "$LOG_DIR/backend.log" \
      "$PID_DIR/backend.pid" \
      "env FOX_BACKEND_PORT='$BACKEND_PORT' ./gradlew bootRun"
    echo "Backend log: $LOG_DIR/backend.log"
  else
    echo "Starting backend on port ${BACKEND_PORT}..."
    (cd "$BACKEND_DIR" && FOX_BACKEND_PORT="$BACKEND_PORT" ./gradlew bootRun) &
    BACKEND_PID=$!
  fi
}

start_frontend() {
  if [[ "${SKIP_FRONTEND:-0}" == "1" ]]; then
    echo "Skipping frontend because SKIP_FRONTEND=1."
    return
  fi

  if ! command -v npm >/dev/null 2>&1; then
    warn_launch "npm is not installed. Install Node.js and npm, then run:"
    echo "  cd frontend && npm install && npm run dev"
    return
  fi

  if ! command -v node >/dev/null 2>&1 || ! node_version_ok; then
    warn_launch "Node.js >=20.19 is required for the current Vite toolchain."
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
  if (( DETACH_MODE == 1 )); then
    echo "Starting frontend on port ${FRONTEND_PORT} in the background..."
    submit_detached_job \
      "$FRONTEND_LABEL" \
      "frontend" \
      "$FRONTEND_DIR" \
      "$LOG_DIR/frontend.log" \
      "$PID_DIR/frontend.pid" \
      "npm run dev -- --host 0.0.0.0 --port '$FRONTEND_PORT'"
    echo "Frontend log: $LOG_DIR/frontend.log"
  else
    echo "Starting frontend on port ${FRONTEND_PORT}..."
    (cd "$FRONTEND_DIR" && npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT") &
    FRONTEND_PID=$!
  fi
}

cleanup() {
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" >/dev/null 2>&1 || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" >/dev/null 2>&1 || true
}

if (( DETACH_MODE == 0 )); then
  trap cleanup EXIT
fi

start_infra
start_backend
start_frontend
print_urls

if (( DETACH_MODE == 0 )) && [[ -n "${BACKEND_PID:-}${FRONTEND_PID:-}" ]]; then
  wait
fi
