#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${CAR_RENTAL_COLLECTION_TEST_ENV_FILE:-${ROOT_DIR}/.env.car-rental-collection-test}"
BACKUP_DIR="${CAR_RENTAL_COLLECTION_TEST_BACKUP_DIR:-${ROOT_DIR}/backups-test/car-rental}"

fail() {
  printf '错误：%s\n' "$1" >&2
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

contains_test_marker() {
  local value="$1"
  [[ "$value" =~ test|car_rental|collection_test ]]
}

contains_production_marker() {
  local value="$1"
  [[ "$value" =~ prod|production|live ]]
}

[ -f "$ENV_FILE" ] || fail "未找到 ${ENV_FILE}；请先复制 .env.car-rental-collection-test.example 为 .env.car-rental-collection-test。"
command -v pg_dump >/dev/null 2>&1 || fail "未找到 pg_dump；请安装 PostgreSQL client 后重试。"

DB_DIALECT="$(read_env_value DB_DIALECT)"
DB_HOST="$(read_env_value DB_HOST)"
DB_PORT="$(read_env_value DB_PORT)"
DB_DATABASE="$(read_env_value DB_DATABASE)"
DB_USER="$(read_env_value DB_USER)"
DB_PASSWORD="$(read_env_value DB_PASSWORD)"
SAFETY_LABEL="$(read_env_value CAR_RENTAL_DATABASE_SAFETY_LABEL)"
MOCK_DATA_ONLY="$(read_env_value CAR_RENTAL_MOCK_DATA_ONLY)"
IOPGPS_SYNC_ENABLED="$(read_env_value IOPGPS_SYNC_ENABLED)"
EXECUTE_ENABLED="$(read_env_value CAR_RENTAL_COLLECTION_EXECUTE_ENABLED)"

case "$DB_DIALECT" in
  postgres|postgresql) ;;
  *) fail "DB_DIALECT 必须是 postgres 或 postgresql。" ;;
esac

[ -n "$DB_HOST" ] || fail "DB_HOST 不能为空。"
[ -n "$DB_PORT" ] || fail "DB_PORT 不能为空。"
[ -n "$DB_DATABASE" ] || fail "DB_DATABASE 不能为空。"
[ -n "$DB_USER" ] || fail "DB_USER 不能为空。"
[ -n "$DB_PASSWORD" ] || fail "数据库密码不能为空；脚本不会输出其值。"
[ "$SAFETY_LABEL" = "isolated_test_database" ] || fail "CAR_RENTAL_DATABASE_SAFETY_LABEL 必须是 isolated_test_database。"
[ "$MOCK_DATA_ONLY" = "true" ] || fail "CAR_RENTAL_MOCK_DATA_ONLY 必须是 true。"
[ "$IOPGPS_SYNC_ENABLED" = "false" ] || fail "IOPGPS_SYNC_ENABLED 必须是 false。"
[ "$EXECUTE_ENABLED" = "false" ] || [ "${CAR_RENTAL_BACKUP_ALLOW_EXECUTE_ENABLED:-false}" = "true" ] || fail "CAR_RENTAL_COLLECTION_EXECUTE_ENABLED 必须是 false，除非由一键隔离测试执行器显式授权备份。"
contains_test_marker "$DB_DATABASE" || fail "DB_DATABASE 必须包含 test、car_rental 或 collection_test 测试标识，拒绝备份。"
contains_production_marker "$DB_DATABASE" && fail "DB_DATABASE 包含 prod/production/live 生产特征，拒绝备份。"

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/pre-real-collection-register-${TIMESTAMP}.dump"

printf '开始备份隔离 PostgreSQL 测试库：database=%s host=%s port=%s user=%s\n' "$DB_DATABASE" "$DB_HOST" "$DB_PORT" "$DB_USER"
PGPASSWORD="$DB_PASSWORD" pg_dump \
  --format=custom \
  --no-owner \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_DATABASE" \
  --file="$BACKUP_FILE"

printf 'backup_artifact_reference=%s\n' "${BACKUP_FILE#${ROOT_DIR}/}"
printf '注意：不要提交 backups-test/、*.dump 或 *.sql。\n'
