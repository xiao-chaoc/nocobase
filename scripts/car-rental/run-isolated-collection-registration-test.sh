#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.car-rental-collection-test"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.car-rental-collection-test.yml"
PROJECT_NAME="car-rental-collection-test"
POSTGRES_CONTAINER="car-rental-collection-test-postgres"
BACKUP_DIR="${ROOT_DIR}/backups-test/car-rental"
REPORT_PATH="${ROOT_DIR}/test-data/generated/isolated-collection-registration-test-report.generated.json"
REQUEST_PATH="test-data/generated/real-collection-execute-request.filled.json"
PREFLIGHT_PATH="test-data/generated/real-collection-execute-preflight.generated.json"
POST_VALIDATE_PATH="test-data/generated/real-collection-post-validate.generated.json"
MODE="prepare-only"
SKIP_COMPOSE_UP="false"
KEEP_DB_RUNNING="false"
STOP_DB_AFTER="false"
REPORT_ONLY="false"
CONFIRM_REAL_COLLECTION_EXECUTE="false"
BACKUP_FILE=""
FAIL_REASON=""
COMPOSE_CMD=()
TS_RUNNER_KIND=""

TS_NODE_ENV=(
  TS_NODE_SKIP_PROJECT=1
  TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node","target":"ES2020","ignoreDeprecations":"6.0"}'
)

usage() {
  cat <<'USAGE'
用法：bash scripts/car-rental/run-isolated-collection-registration-test.sh [options]

默认模式：prepare-only，只完成隔离测试库启动、备份、request、validate、apply dry-run、preflight 和报告，不创建 Collection。

Options:
  --execute                         在隔离测试库中尝试真实 Collection 注册
  --confirm-real-collection-execute 与 --execute 同时使用的人工确认门禁
  --skip-compose-up                 已手动启动 PostgreSQL 时跳过 compose up
  --keep-db-running                 完成后不停止测试库
  --stop-db-after                   完成后停止测试库
  --report-only                     仅检查已有总报告，不执行流程
  -h, --help                        显示帮助
USAGE
}

json_escape() {
  node -e 'process.stdout.write(JSON.stringify(process.argv[1] || ""))' "$1"
}

write_report() {
  local status="$1"
  mkdir -p "$(dirname "$REPORT_PATH")"
  local backup_json request_json preflight_json post_validate_json fail_json mode_json rollback_json
  backup_json="$(json_escape "$BACKUP_FILE")"
  request_json="$(json_escape "$REQUEST_PATH")"
  preflight_json="$(json_escape "$PREFLIGHT_PATH")"
  post_validate_json="$(json_escape "$POST_VALIDATE_PATH")"
  fail_json="$(json_escape "$FAIL_REASON")"
  mode_json="$(json_escape "$MODE")"
  rollback_json="$(json_escape "scripts/car-rental/restore-collection-test-db.sh ${BACKUP_FILE}")"
  cat > "$REPORT_PATH" <<JSON
{
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "${status}",
  "mode": ${mode_json},
  "production_ready": false,
  "database_safety_label": "isolated_test_database",
  "mock_data_only": true,
  "iopgps_real_sync_allowed": false,
  "preparePassed": $([ "$status" = "passed" ] && echo true || echo false),
  "executeAttempted": $([ "$MODE" = "execute" ] && echo true || echo false),
  "executePassed": $([ "$MODE" = "execute" ] && [ "$status" = "passed" ] && echo true || echo false),
  "postValidatePassed": $([ -f "${ROOT_DIR}/${POST_VALIDATE_PATH}" ] && node -e 'const fs=require("fs"); const r=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.exit(r.overallStatus==="passed"?0:1)' "${ROOT_DIR}/${POST_VALIDATE_PATH}" >/dev/null 2>&1 && echo true || echo false),
  "backupArtifactReference": ${backup_json},
  "rollbackCommand": ${rollback_json},
  "writes_database_requested": $([ "$MODE" = "execute" ] && echo true || echo false),
  "backup_artifact_reference": ${backup_json},
  "request_file": ${request_json},
  "preflight_report": ${preflight_json},
  "post_validate_report": ${post_validate_json},
  "failure_reason": ${fail_json},
  "rollback_command": ${rollback_json},
  "stages": {
    "env_safety": true,
    "compose_config": true,
    "compose_up": $([ "$SKIP_COMPOSE_UP" = "true" ] && echo false || echo true),
    "db_health_check": true,
    "backup": $([ -n "$BACKUP_FILE" ] && echo true || echo false),
    "request_generation": $([ -f "${ROOT_DIR}/${REQUEST_PATH}" ] && echo true || echo false),
    "validate_request": $([ -f "${ROOT_DIR}/${REQUEST_PATH}" ] && echo true || echo false),
    "apply_dry_run": $([ -f "${ROOT_DIR}/${REQUEST_PATH}" ] && echo true || echo false),
    "preflight": $([ -f "${ROOT_DIR}/${PREFLIGHT_PATH}" ] && echo true || echo false),
    "execute": $([ "$MODE" = "execute" ] && [ "$status" = "passed" ] && echo true || echo false),
    "post_validate": $([ -f "${ROOT_DIR}/${POST_VALIDATE_PATH}" ] && echo true || echo false),
    "report": true
  }
}
JSON
}

fail() {
  FAIL_REASON="$1"
  printf '错误：%s\n' "$1" >&2
  if [ -n "$BACKUP_FILE" ]; then
    printf '如需回滚隔离测试库，请执行：scripts/car-rental/restore-collection-test-db.sh %s\n' "$BACKUP_FILE" >&2
  fi
  write_report "failed"
  exit 1
}

read_env_value() {
  local key="$1"
  awk -F= -v key="$key" '
    $0 ~ /^[[:space:]]*#/ { next }
    $1 == key {
      value = substr($0, index($0, "=") + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      gsub(/^"|"$/, "", value)
      gsub(/^'"'"'|'"'"'$/, "", value)
      print value
      exit
    }
  ' "$ENV_FILE"
}

export_collection_test_env() {
  while IFS= read -r line; do
    case "$line" in
      ''|'#'*) continue ;;
    esac
    case "$line" in
      *=*) ;;
      *) continue ;;
    esac
    local key value
    key="${line%%=*}"
    value="${line#*=}"
    key="$(printf '%s' "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    value="$(printf '%s' "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/^"//;s/"$//;s/^'''//;s/'''$//')"
    if [ "$key" = "CAR_RENTAL_COLLECTION_EXECUTE_ENABLED" ] && [ "${CAR_RENTAL_COLLECTION_EXECUTE_ENABLED:-false}" = "true" ]; then
      export CAR_RENTAL_COLLECTION_EXECUTE_ENABLED="true"
    elif [ -n "$key" ]; then
      export "$key=$value"
    fi
  done < "$ENV_FILE"
}

run_step() {
  local label="$1"
  shift
  printf '\n==> %s\n' "$label"
  "$@"
}

contains_test_marker() {
  local value="$1"
  [[ "$value" =~ test|car_rental|collection_test ]]
}

contains_production_marker() {
  local value="$1"
  [[ "$value" =~ prod|production|live ]]
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --execute)
        MODE="execute"
        ;;
      --confirm-real-collection-execute)
        CONFIRM_REAL_COLLECTION_EXECUTE="true"
        ;;
      --skip-compose-up)
        SKIP_COMPOSE_UP="true"
        ;;
      --keep-db-running)
        KEEP_DB_RUNNING="true"
        ;;
      --stop-db-after)
        STOP_DB_AFTER="true"
        ;;
      --report-only)
        REPORT_ONLY="true"
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        fail "未知参数：$1"
        ;;
    esac
    shift
  done
}

validate_report_only() {
  [ -f "$REPORT_PATH" ] || fail "总报告不存在：${REPORT_PATH#${ROOT_DIR}/}"
  printf '已找到总报告：%s\n' "${REPORT_PATH#${ROOT_DIR}/}"
  node -e 'const fs=require("fs"); const p=process.argv[1]; const r=JSON.parse(fs.readFileSync(p,"utf8")); console.log(JSON.stringify({status:r.status, mode:r.mode, production_ready:r.production_ready, backupArtifactReference:r.backupArtifactReference}, null, 2));' "$REPORT_PATH"
}

detect_compose_command() {
  command -v docker >/dev/null 2>&1 || fail "未找到 docker；请在 NAS / 本地 Docker 环境执行。"
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
    printf '已检测到 Compose 命令：docker compose\n'
    return
  fi
  if command -v docker-compose >/dev/null 2>&1 && docker-compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
    printf '已检测到 Compose 命令：docker-compose\n'
    return
  fi
  fail "未找到可用的 Docker Compose。请安装 docker compose 插件，或安装旧版 docker-compose。"
}

compose_config() {
  "${COMPOSE_CMD[@]}" -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config >/dev/null
}

check_compose_file_port() {
  grep -q "53240:5432" "$COMPOSE_FILE" || fail "Compose 端口映射必须是 53240:5432。"
  if grep -q "53240:53240" "$COMPOSE_FILE"; then
    fail "Compose 端口映射不能是 53240:53240。"
  fi
  printf '已确认 Compose ports target 为 5432，宿主机端口为 53240。\n'
}

check_env_file_and_safety() {
  if [ ! -f "$ENV_FILE" ]; then
    printf '未找到 .env.car-rental-collection-test。请先执行：\n' >&2
    printf 'cp .env.car-rental-collection-test.example .env.car-rental-collection-test\n' >&2
    fail "缺少隔离测试环境文件。"
  fi

  local db_dialect db_name safety_label mock_data_only iopgps_sync execute_enabled
  db_dialect="$(read_env_value DB_DIALECT)"
  db_name="$(read_env_value DB_DATABASE)"
  safety_label="$(read_env_value CAR_RENTAL_DATABASE_SAFETY_LABEL)"
  mock_data_only="$(read_env_value CAR_RENTAL_MOCK_DATA_ONLY)"
  iopgps_sync="$(read_env_value IOPGPS_SYNC_ENABLED)"
  execute_enabled="${CAR_RENTAL_COLLECTION_EXECUTE_ENABLED:-$(read_env_value CAR_RENTAL_COLLECTION_EXECUTE_ENABLED)}"

  case "$db_dialect" in
    postgres|postgresql) ;;
    *) fail "DB_DIALECT 必须是 postgres 或 postgresql。" ;;
  esac
  [ -n "$db_name" ] || fail "DB_DATABASE 不能为空。"
  contains_test_marker "$db_name" || fail "DB_DATABASE 必须包含 test / car_rental / collection_test 测试标识。"
  contains_production_marker "$db_name" && fail "DB_DATABASE 包含 prod/production/live 生产特征，拒绝执行。"
  [ "$safety_label" = "isolated_test_database" ] || fail "CAR_RENTAL_DATABASE_SAFETY_LABEL 必须是 isolated_test_database。"
  [ "$mock_data_only" = "true" ] || fail "CAR_RENTAL_MOCK_DATA_ONLY 必须是 true。"
  [ "$iopgps_sync" = "false" ] || fail "IOPGPS_SYNC_ENABLED 必须是 false。"
  if [ "$MODE" = "execute" ]; then
    [ "$execute_enabled" = "true" ] || fail "--execute 需要 CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true。"
    [ "$CONFIRM_REAL_COLLECTION_EXECUTE" = "true" ] || fail "--execute 必须同时提供 --confirm-real-collection-execute。"
  else
    [ "$execute_enabled" = "false" ] || fail "prepare-only 模式要求 CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false。"
  fi

  export_collection_test_env
}

find_ts_runner() {
  if [ -x "${ROOT_DIR}/node_modules/.bin/ts-node" ]; then
    TS_RUNNER_KIND="local"
    printf '已检测到 TypeScript runner：node_modules/.bin/ts-node\n'
    return
  fi
  if command -v npx >/dev/null 2>&1; then
    TS_RUNNER_KIND="npx"
    printf '已检测到 TypeScript runner：npx ts-node\n'
    return
  fi
  if command -v npm >/dev/null 2>&1 && npm exec --help >/dev/null 2>&1; then
    TS_RUNNER_KIND="npm-exec"
    printf '已检测到 TypeScript runner：npm exec --package=ts-node --package=typescript -- ts-node\n'
    return
  fi
  cat >&2 <<'MANUAL'
错误：未找到可用的 TypeScript runner。
已尝试：
  1. node_modules/.bin/ts-node
  2. npx ts-node
  3. npm exec --package=ts-node --package=typescript -- ts-node

NAS 手工 fallback 步骤：
  1. 在有网络且允许安装依赖的测试目录中执行 npm install --no-save ts-node typescript。
  2. 重新运行 bash scripts/car-rental/run-isolated-collection-registration-test.sh。
  3. 如果仍失败，请仅保留已生成 backup，并执行回滚命令后暂停，不要进入 execute。
MANUAL
  fail "TypeScript runner 不可用，无法生成或校验 filled request。"
}

run_ts_node() {
  case "$TS_RUNNER_KIND" in
    local)
      env "${TS_NODE_ENV[@]}" "${ROOT_DIR}/node_modules/.bin/ts-node" --transpile-only "$@"
      ;;
    npx)
      env "${TS_NODE_ENV[@]}" npx ts-node --transpile-only "$@"
      ;;
    npm-exec)
      env "${TS_NODE_ENV[@]}" npm exec --package=ts-node --package=typescript -- ts-node --transpile-only "$@"
      ;;
    *)
      fail "TypeScript runner 尚未初始化。"
      ;;
  esac
}

compose_up() {
  if [ "$SKIP_COMPOSE_UP" = "true" ]; then
    printf '已跳过 compose up；将直接进行健康检查。\n'
    return
  fi
  run_step "启动隔离 PostgreSQL 测试库 compose" "${COMPOSE_CMD[@]}" -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
}

wait_for_postgres() {
  printf '\n==> 等待 PostgreSQL ready（使用容器内 pg_isready）\n'
  local attempt
  for attempt in $(seq 1 60); do
    if docker exec "$POSTGRES_CONTAINER" pg_isready >/dev/null 2>&1; then
      printf 'PostgreSQL 已就绪。\n'
      return
    fi
    sleep 2
  done
  fail "PostgreSQL 未在预期时间内 ready。"
}

create_backup_with_container_pg_dump() {
  mkdir -p "$BACKUP_DIR"
  local timestamp container_tmp
  timestamp="$(date -u +%Y%m%d-%H%M%S)"
  BACKUP_FILE="backups-test/car-rental/pre-real-collection-register-${timestamp}.dump"
  container_tmp="/tmp/car-rental-backup.dump"
  run_step "使用 PostgreSQL 容器内 pg_dump 备份隔离测试库" docker exec "$POSTGRES_CONTAINER" sh -lc 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -f /tmp/car-rental-backup.dump'
  docker cp "${POSTGRES_CONTAINER}:${container_tmp}" "${ROOT_DIR}/${BACKUP_FILE}"
  [ -f "${ROOT_DIR}/${BACKUP_FILE}" ] || fail "容器内 pg_dump fallback 未生成备份文件：$BACKUP_FILE"
  printf 'backup_artifact_reference=%s\n' "$BACKUP_FILE"
  printf '注意：不要提交 backups-test/、*.dump 或 *.sql。\n'
}

create_backup() {
  if command -v pg_dump >/dev/null 2>&1; then
    local output backup_ref
    output="$(CAR_RENTAL_BACKUP_ALLOW_EXECUTE_ENABLED=true scripts/car-rental/backup-collection-test-db.sh)" || fail "备份失败。"
    printf '%s\n' "$output" | sed '/secret/d'
    backup_ref="$(printf '%s\n' "$output" | awk -F= '/^backup_artifact_reference=/{print $2}' | tail -n 1)"
    [ -n "$backup_ref" ] || fail "未从 backup 输出中解析到 backup_artifact_reference。"
    BACKUP_FILE="$backup_ref"
  else
    create_backup_with_container_pg_dump
  fi
  [ -f "${ROOT_DIR}/${BACKUP_FILE}" ] || fail "备份文件不存在：$BACKUP_FILE"
}

prepare_request_and_preflight() {
  run_step "运行隔离测试库 safety check" run_ts_node scripts/car-rental/validate-collection-test-db-safety.ts
  run_step "生成 filled execute request（本地 ignored，不提交）" run_ts_node scripts/car-rental/generate-real-collection-execute-request-from-test-db.ts --backup "$BACKUP_FILE"
  [ -f "${ROOT_DIR}/${REQUEST_PATH}" ] || fail "filled request 未生成：$REQUEST_PATH"
  run_step "validate request" run_ts_node scripts/car-rental/validate-real-collection-execute-request.ts --file "$REQUEST_PATH"
  run_step "apply dry-run" run_ts_node scripts/car-rental/apply-real-collection-execute-request.ts --file "$REQUEST_PATH"
  run_step "preflight with request" run_ts_node scripts/car-rental/preflight-real-collection-execute.ts --request "$REQUEST_PATH"
  [ -f "${ROOT_DIR}/${PREFLIGHT_PATH}" ] || fail "preflight report 未生成：$PREFLIGHT_PATH"
}

execute_if_requested() {
  if [ "$MODE" != "execute" ]; then
    printf '\n已完成 execute 前全部准备，默认 prepare-only 不创建 Collection。需要执行时请加 --execute --confirm-real-collection-execute。\n'
    return
  fi
  [ "$CONFIRM_REAL_COLLECTION_EXECUTE" = "true" ] || fail "execute 模式需要 --confirm-real-collection-execute。"
  [ -f "${ROOT_DIR}/${BACKUP_FILE}" ] || fail "--execute 前备份文件不存在：$BACKUP_FILE"
  [ -f "${ROOT_DIR}/${REQUEST_PATH}" ] || fail "--execute 前 request 文件不存在：$REQUEST_PATH"
  [ -f "${ROOT_DIR}/${PREFLIGHT_PATH}" ] || fail "--execute 前 preflight 文件不存在：$PREFLIGHT_PATH"
  node -e 'const fs=require("fs"); const p=process.argv[1]; const r=JSON.parse(fs.readFileSync(p,"utf8")); const b=[...(r.blockers||[]),...((r.context&&r.context.blockers)||[]),...((r.validation&&r.validation.blockers)||[])]; if (b.length) { console.error(b.join("\n")); process.exit(1); }' "${ROOT_DIR}/${PREFLIGHT_PATH}" || fail "preflight with request 仍存在 blockers，拒绝 execute。"

  run_step "执行真实隔离 Collection 注册" run_ts_node scripts/car-rental/execute-real-collection-registration.ts \
    --request "$REQUEST_PATH" \
    --preflight "$PREFLIGHT_PATH" \
    --backup "$BACKUP_FILE" \
    --runtime-allow-real-execution \
    --execute \
    --confirm-real-collection-execute

  run_step "post-validate" run_ts_node scripts/car-rental/post-validate-real-collection-registration.ts --output "$POST_VALIDATE_PATH"
}

cleanup_db() {
  if [ "$STOP_DB_AFTER" = "true" ]; then
    "${COMPOSE_CMD[@]}" -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop
  elif [ "$KEEP_DB_RUNNING" = "true" ]; then
    printf '按 --keep-db-running 保持测试库运行。\n'
  fi
}

main() {
  cd "$ROOT_DIR"
  parse_args "$@"
  if [ "$REPORT_ONLY" = "true" ]; then
    validate_report_only
    return
  fi
  check_env_file_and_safety
  detect_compose_command
  run_step "检查 compose config" compose_config
  check_compose_file_port
  find_ts_runner
  compose_up
  wait_for_postgres
  create_backup
  prepare_request_and_preflight
  execute_if_requested
  write_report "passed"
  cleanup_db
  printf '\n一键隔离 Collection 注册测试完成。\n'
  printf '模式：%s\n' "$MODE"
  printf '报告：%s\n' "${REPORT_PATH#${ROOT_DIR}/}"
  printf '备份：%s\n' "$BACKUP_FILE"
  printf '回滚命令：scripts/car-rental/restore-collection-test-db.sh %s\n' "$BACKUP_FILE"
}

main "$@"
