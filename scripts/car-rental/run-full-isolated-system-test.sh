#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.car-rental-collection-test"
JSON_REPORT="${ROOT_DIR}/test-data/generated/car-rental-full-isolated-system-test-report.generated.json"
MD_REPORT="${ROOT_DIR}/docs/car-rental-full-isolated-system-test-report.md"
TARGET_VERSION="v2.0.61"
PRODUCTION_READY=false
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
FINISHED_AT=""
DATABASE_SAFETY_LABEL=""
MOCK_DATA_ONLY=""
IOPGPS_REAL_SYNC_ALLOWED=false
PASSED=0
FAILED=0
SKIPPED=0
STAGE_LINES=()
BLOCKERS=()
WARNINGS=()
MODIFICATION_ITEMS=()

usage() {
  cat <<'USAGE'
用法：bash scripts/car-rental/run-full-isolated-system-test.sh

默认不生产，只允许隔离 PostgreSQL 测试库。脚本会执行已存在的一键隔离阶段；Runtime、Permission、Page/menu/block、Mock data import、Business smoke test、Contract document test、GPS mock test、Backup / rollback rehearsal 和 Production init guard 当前以 codex_dry_run / codex_mock_report 记录，真实本地执行仍属于 pre-release local execution；尚未实现的阶段会记录 skipped，并进入 modification_items。
USAGE
}

fail_fast() {
  printf '错误：%s\n' "$1" >&2
  exit 1
}

json_string() {
  node -e 'process.stdout.write(JSON.stringify(process.argv[1] || ""))' "$1"
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

check_isolated_env() {
  [ -f "$ENV_FILE" ] || fail_fast "未找到 .env.car-rental-collection-test；请先复制 .env.car-rental-collection-test.example。"

  local db_dialect db_name execute_enabled iopgps_sync
  db_dialect="$(read_env_value DB_DIALECT)"
  db_name="$(read_env_value DB_DATABASE)"
  DATABASE_SAFETY_LABEL="$(read_env_value CAR_RENTAL_DATABASE_SAFETY_LABEL)"
  MOCK_DATA_ONLY="$(read_env_value CAR_RENTAL_MOCK_DATA_ONLY)"
  iopgps_sync="$(read_env_value IOPGPS_SYNC_ENABLED)"
  execute_enabled="${CAR_RENTAL_COLLECTION_EXECUTE_ENABLED:-$(read_env_value CAR_RENTAL_COLLECTION_EXECUTE_ENABLED)}"

  case "$db_dialect" in
    postgres|postgresql) ;;
    *) fail_fast "DB_DIALECT 必须是 postgres 或 postgresql。" ;;
  esac
  [ -n "$db_name" ] || fail_fast "DB_DATABASE 不能为空。"
  contains_test_marker "$db_name" || fail_fast "DB_DATABASE 必须包含 test / car_rental / collection_test 测试标识。"
  contains_production_marker "$db_name" && fail_fast "DB_DATABASE 包含 prod/production/live，拒绝作为隔离总测试库。"
  [ "$DATABASE_SAFETY_LABEL" = "isolated_test_database" ] || fail_fast "CAR_RENTAL_DATABASE_SAFETY_LABEL 必须是 isolated_test_database。"
  [ "$MOCK_DATA_ONLY" = "true" ] || fail_fast "CAR_RENTAL_MOCK_DATA_ONLY 必须是 true。"
  [ "$iopgps_sync" = "false" ] || fail_fast "IOPGPS_SYNC_ENABLED 必须是 false。"
  [ "$execute_enabled" = "false" ] || fail_fast "CAR_RENTAL_COLLECTION_EXECUTE_ENABLED 默认必须是 false；总测试默认不进入真实 execute。"
}

add_stage_json() {
  local id="$1" name="$2" script="$3" status="$4" report="$5" note="$6"
  STAGE_LINES+=("{\"id\":$(json_string "$id"),\"name\":$(json_string "$name"),\"script\":$(json_string "$script"),\"status\":$(json_string "$status"),\"report\":$(json_string "$report"),\"note\":$(json_string "$note")}")
}

record_passed() {
  PASSED=$((PASSED + 1))
  add_stage_json "$1" "$2" "$3" "passed" "$4" "$5"
}

record_failed() {
  FAILED=$((FAILED + 1))
  BLOCKERS+=("$2 失败，请查看阶段日志并修复后重跑总测试。")
  add_stage_json "$1" "$2" "$3" "failed" "$4" "$5"
}

record_skipped() {
  SKIPPED=$((SKIPPED + 1))
  MODIFICATION_ITEMS+=("补齐 $2 阶段脚本：$3")
  add_stage_json "$1" "$2" "$3" "skipped" "$4" "$5"
}

record_codex_dry_run() {
  PASSED=$((PASSED + 1))
  add_stage_json "$1" "$2" "$3" "codex_dry_run" "$4" "$5"
}

merge_codex_dry_run_report() {
  local report_path="$1" label="$2"
  [ -f "${ROOT_DIR}/${report_path}" ] || return 0

  local blockers modifications
  blockers="$(node -e 'const fs=require("fs"); const report=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); for (const item of report.blockers || []) console.log(item);' "${ROOT_DIR}/${report_path}")"
  modifications="$(node -e 'const fs=require("fs"); const report=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); for (const item of report.modification_items || []) console.log(item);' "${ROOT_DIR}/${report_path}")"

  while IFS= read -r blocker; do
    [ -n "$blocker" ] && BLOCKERS+=("$label dry-run blocker: $blocker")
  done <<< "$blockers"

  while IFS= read -r modification; do
    [ -n "$modification" ] && MODIFICATION_ITEMS+=("$label dry-run: $modification")
  done <<< "$modifications"
}

run_stage() {
  local id="$1" name="$2" script="$3" report="$4" note="$5"
  printf '\n==> %s\n' "$name"
  if [ ! -f "${ROOT_DIR}/${script}" ]; then
    printf '阶段脚本尚不存在，记录 skipped：%s\n' "$script"
    record_skipped "$id" "$name" "$script" "$report" "脚本尚未实现；$note"
    return
  fi
  if bash "${ROOT_DIR}/${script}"; then
    record_passed "$id" "$name" "$script" "$report" "$note"
  else
    record_failed "$id" "$name" "$script" "$report" "$note"
  fi
}

run_codex_dry_run_stage() {
  local id="$1" name="$2" script="$3" report="$4" note="$5"
  printf '\n==> %s\n' "$name"
  if [ ! -f "${ROOT_DIR}/${script}" ]; then
    printf 'Codex dry-run 阶段脚本尚不存在，记录 skipped：%s\n' "$script"
    record_skipped "$id" "$name" "$script" "$report" "脚本尚未实现；$note"
    return
  fi
  if bash "${ROOT_DIR}/${script}"; then
    merge_codex_dry_run_report "$report" "$name"
    record_codex_dry_run "$id" "$name" "$script" "$report" "codex_dry_run / codex_mock_report 已建立；真实本地执行仍为 pre-release local execution。$note"
  else
    record_failed "$id" "$name" "$script" "$report" "$note"
  fi
}

run_final_aggregation_stage() {
  local script="scripts/car-rental/generate-pre-release-final-report.ts"
  local report="test-data/generated/car-rental-pre-release-final-report.generated.json"
  printf '\n==> Pre-release final report aggregation Codex report aggregation\n'
  if [ -f "${ROOT_DIR}/${script}" ]; then
    node --experimental-strip-types "${ROOT_DIR}/${script}"
    record_codex_dry_run "final-aggregation" "Pre-release final report aggregation" "$script" "$report" "当前执行模式为 codex_report_aggregation；总报告必须 production_ready=false；当前不要求用户本地运行。"
  else
    record_skipped "final-aggregation" "Pre-release final report aggregation" "$script" "$report" "final aggregation 脚本尚未实现。"
  fi
}

join_json_array() {
  local first="true"
  printf '['
  for item in "$@"; do
    if [ "$first" = "true" ]; then
      first="false"
    else
      printf ','
    fi
    printf '%s' "$item"
  done
  printf ']'
}

write_reports() {
  FINISHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  mkdir -p "$(dirname "$JSON_REPORT")" "$(dirname "$MD_REPORT")"

  local blockers_json warnings_json modifications_json stages_json
  blockers_json="$(printf '%s\n' "${BLOCKERS[@]:-}" | node -e 'const fs=require("fs"); const lines=fs.readFileSync(0,"utf8").split(/\n/).filter(Boolean); process.stdout.write(JSON.stringify(lines));')"
  warnings_json="$(printf '%s\n' "${WARNINGS[@]:-}" | node -e 'const fs=require("fs"); const lines=fs.readFileSync(0,"utf8").split(/\n/).filter(Boolean); process.stdout.write(JSON.stringify(lines));')"
  modifications_json="$(printf '%s\n' "${MODIFICATION_ITEMS[@]:-}" | node -e 'const fs=require("fs"); const lines=fs.readFileSync(0,"utf8").split(/\n/).filter(Boolean); process.stdout.write(JSON.stringify(lines));')"
  stages_json="$(join_json_array "${STAGE_LINES[@]}")"

  cat > "$JSON_REPORT" <<JSON
{
  "started_at": "${STARTED_AT}",
  "finished_at": "${FINISHED_AT}",
  "target_version": "${TARGET_VERSION}",
  "database_safety_label": "${DATABASE_SAFETY_LABEL}",
  "mock_data_only": ${MOCK_DATA_ONLY:-false},
  "iopgps_real_sync_allowed": ${IOPGPS_REAL_SYNC_ALLOWED},
  "stages": ${stages_json},
  "passed": ${PASSED},
  "failed": ${FAILED},
  "skipped": ${SKIPPED},
  "blockers": ${blockers_json},
  "warnings": ${warnings_json},
  "modification_items": ${modifications_json},
  "production_ready": ${PRODUCTION_READY}
}
JSON

  cat > "$MD_REPORT" <<MD
# Car Rental 一键隔离总测试报告

- started_at: ${STARTED_AT}
- finished_at: ${FINISHED_AT}
- target_version: ${TARGET_VERSION}
- database_safety_label: ${DATABASE_SAFETY_LABEL}
- mock_data_only: ${MOCK_DATA_ONLY}
- iopgps_real_sync_allowed: ${IOPGPS_REAL_SYNC_ALLOWED}
- passed: ${PASSED}
- failed: ${FAILED}
- skipped: ${SKIPPED}
- production_ready: ${PRODUCTION_READY}

## 说明

本报告由隔离总测试脚本生成。它不代表生产就绪；当前 production_ready=false。Runtime、Permission、Page/menu/block、Mock data import、Business smoke test、Contract document test、GPS mock test、Backup / rollback rehearsal 和 Production init guard 阶段当前记录为 codex_dry_run / codex_mock_report，真实本地执行仍标记为 pre-release local execution。阶段脚本不存在时会被标记 skipped，并进入修改项清单。

## JSON 报告

详见：

```text
${JSON_REPORT#${ROOT_DIR}/}
```
MD
}

main() {
  cd "$ROOT_DIR"
  if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    exit 0
  fi

  check_isolated_env
  WARNINGS+=("当前 Docker 只有 PostgreSQL 容器是正常现象；该 compose 不是完整 NocoBase 应用部署。")
  WARNINGS+=("总测试默认不生产，production_ready=false。")

  run_stage "collection" "Collection 注册隔离测试" "scripts/car-rental/run-isolated-collection-registration-test.sh" "test-data/generated/isolated-collection-registration-test-report.generated.json" "已建立的一键 collection runner。"
  run_codex_dry_run_stage "runtime" "Runtime / 服务 / 动作注册 Codex dry-run" "scripts/car-rental/run-isolated-runtime-registration-test.sh" "test-data/generated/car-rental-runtime-registration-dry-run.generated.json" "当前不要求用户本地运行；正式版前才本地执行真实 Runtime 注册验证。"
  run_codex_dry_run_stage "permission" "权限和敏感字段 Codex dry-run" "scripts/car-rental/run-isolated-permission-sensitive-field-test.sh" "test-data/generated/car-rental-permission-sensitive-field-dry-run.generated.json" "当前执行模式为 codex_dry_run / codex_mock_report；权限阶段真实本地执行仍为 pre-release local execution。"
  run_codex_dry_run_stage "page" "页面 / 菜单 / 区块初始化 Codex dry-run" "scripts/car-rental/run-isolated-page-menu-block-test.sh" "test-data/generated/car-rental-page-menu-block-dry-run.generated.json" "当前执行模式为 codex_dry_run / codex_mock_report；页面阶段真实本地执行仍为 pre-release local execution；当前不要求用户本地运行。"
  run_codex_dry_run_stage "mock-data" "Mock data import Codex dry-run" "scripts/car-rental/run-isolated-mock-data-import-test.sh" "test-data/generated/car-rental-mock-data-import-dry-run.generated.json" "当前执行模式为 codex_dry_run / codex_mock_report；mock import 真实本地执行仍为 pre-release local execution；当前不要求用户本地运行。"
  run_codex_dry_run_stage "business-smoke" "Business smoke test Codex dry-run" "scripts/car-rental/run-isolated-business-smoke-test.sh" "test-data/generated/car-rental-business-smoke-dry-run.generated.json" "当前执行模式为 codex_dry_run / codex_mock_report；business smoke 真实本地执行仍为 pre-release local execution；当前不要求用户本地运行。"
  run_codex_dry_run_stage "contract-document" "Contract document test Codex dry-run" "scripts/car-rental/run-isolated-contract-document-test.sh" "test-data/generated/car-rental-contract-document-dry-run.generated.json" "当前执行模式为 codex_dry_run / codex_mock_report；contract document 真实本地执行仍为 pre-release local execution；当前不要求用户本地运行。"
  run_codex_dry_run_stage "gps-mock" "GPS mock test Codex dry-run" "scripts/car-rental/run-isolated-gps-mock-test.sh" "test-data/generated/car-rental-gps-mock-dry-run.generated.json" "当前执行模式为 codex_dry_run / codex_mock_report；GPS mock 真实本地执行仍为 pre-release local execution；当前不要求用户本地运行。"
  run_codex_dry_run_stage "backup-rollback" "Backup / rollback rehearsal Codex dry-run" "scripts/car-rental/run-isolated-backup-rollback-rehearsal-test.sh" "test-data/generated/car-rental-backup-rollback-rehearsal-dry-run.generated.json" "当前执行模式为 codex_dry_run / codex_mock_report；Backup / rollback rehearsal 真实本地执行仍为 pre-release local execution；当前不要求用户本地运行。"
  run_codex_dry_run_stage "production-init-guard" "Production init guard Codex dry-run" "scripts/car-rental/run-production-init-guard-dry-run.sh" "test-data/generated/car-rental-production-init-guard-dry-run.generated.json" "当前执行模式为 codex_dry_run / codex_mock_report；Production init guard 真实本地执行仍为 pre-release local execution；当前不要求用户本地运行。"
  run_final_aggregation_stage

  write_reports
  printf '\n一键隔离总测试完成：passed=%s failed=%s skipped=%s\n' "$PASSED" "$FAILED" "$SKIPPED"
  printf 'JSON 报告：%s\n' "${JSON_REPORT#${ROOT_DIR}/}"
  printf 'Markdown 报告：%s\n' "${MD_REPORT#${ROOT_DIR}/}"

  if [ "$FAILED" -gt 0 ]; then
    exit 1
  fi
}

main "$@"
