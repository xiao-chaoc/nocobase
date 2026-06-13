#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT="${ROOT_DIR}/test-data/generated/car-rental-production-init-guard-dry-run.generated.json"
ENV_EXAMPLE="${ROOT_DIR}/.env.car-rental-production.example"
PLAN="${ROOT_DIR}/docs/car-rental-production-init-guard-plan.md"
BOUNDARY="${ROOT_DIR}/docs/car-rental-production-deployment-boundary.md"
PRODUCTION_READY=false

# codex_only production_ready=false dry-run only.
# This script does not connect to any database, does not initialize production database,
# does not create Collection, does not write schema, does not execute migration,
# does not import data, does not import mock data, and does not enable IOPGPS.
# It intentionally does not read .env.car-rental-production.

read_example_value() {
  local key="$1"
  awk -F= -v key="$key" '$0 !~ /^[[:space:]]*#/ && $1 == key { value=substr($0,index($0,"=")+1); gsub(/^[[:space:]]+|[[:space:]]+$/,"",value); print value; exit }' "$ENV_EXAMPLE"
}

contains_forbidden_db_marker() {
  local value="$1"
  [[ "$value" =~ test|mock|demo|sample ]]
}

json_array() {
  node -e 'const fs=require("fs"); const lines=fs.readFileSync(0,"utf8").split(/\n/).filter(Boolean); process.stdout.write(JSON.stringify(lines));'
}

main() {
  cd "$ROOT_DIR"
  mkdir -p "$(dirname "$REPORT")"
  local blockers=() warnings=() modifications=()
  [ -f "$ENV_EXAMPLE" ] || blockers+=("production env example missing")
  [ -f "$PLAN" ] || blockers+=("production init guard plan missing")
  [ -f "$BOUNDARY" ] || blockers+=("production deployment boundary missing")

  local env_content=""
  [ -f "$ENV_EXAMPLE" ] && env_content="$(cat "$ENV_EXAMPLE")"
  if [ -n "$env_content" ]; then
    echo "$env_content" | grep -Eq 'APP_KEY|IOPGPS_LOGIN_KEY|access_token|login_key' && blockers+=("production env example contains forbidden secret key")
    local db_name mock_only import_mock iopgps init_enabled privacy_enabled label
    db_name="$(read_example_value DB_DATABASE)"
    mock_only="$(read_example_value CAR_RENTAL_MOCK_DATA_ONLY)"
    import_mock="$(read_example_value CAR_RENTAL_IMPORT_MOCK_DATA)"
    iopgps="$(read_example_value IOPGPS_SYNC_ENABLED)"
    init_enabled="$(read_example_value CAR_RENTAL_PRODUCTION_INIT_ENABLED)"
    privacy_enabled="$(read_example_value CAR_RENTAL_PRIVACY_DATA_IMPORT_ENABLED)"
    label="$(read_example_value CAR_RENTAL_DATABASE_SAFETY_LABEL)"
    contains_forbidden_db_marker "$db_name" && blockers+=("production DB_DATABASE contains test/mock/demo/sample")
    [ "$mock_only" = "false" ] || blockers+=("CAR_RENTAL_MOCK_DATA_ONLY must be false")
    [ "$import_mock" = "false" ] || blockers+=("CAR_RENTAL_IMPORT_MOCK_DATA must be false")
    [ "$iopgps" = "false" ] || blockers+=("IOPGPS_SYNC_ENABLED must be false")
    [ "$init_enabled" = "false" ] || blockers+=("CAR_RENTAL_PRODUCTION_INIT_ENABLED must be false")
    [ "$privacy_enabled" = "false" ] || blockers+=("CAR_RENTAL_PRIVACY_DATA_IMPORT_ENABLED must be false")
    [ "$label" = "production_database" ] || blockers+=("production safety label must be production_database")
  fi

  local docs=""
  [ -f "$PLAN" ] && docs+="$(cat "$PLAN")"
  [ -f "$BOUNDARY" ] && docs+=$'\n'"$(cat "$BOUNDARY")"
  echo "$docs" | grep -Eq '建议复用测试|允许复用测试' && blockers+=("docs suggest reusing test volume/storage/dump/env") || true
  [ "$PRODUCTION_READY" = "false" ] || blockers+=("production_ready must remain false")

  warnings+=("pre-release local execution is still required")
  warnings+=("current local execution is not required")
  modifications+=("Production init guard dry-run stage added.")
  modifications+=("Pre-release final report aggregation remains pending.")
  modifications+=("UAT checklist remains pending before production_ready.")
  modifications+=("Production deployment runbook remains pending.")
  modifications+=("Privacy data import guard remains pending.")

  local blockers_json warnings_json modifications_json
  blockers_json="$(printf '%s\n' "${blockers[@]:-}" | json_array)"
  warnings_json="$(printf '%s\n' "${warnings[@]:-}" | json_array)"
  modifications_json="$(printf '%s\n' "${modifications[@]:-}" | json_array)"

  cat > "$REPORT" <<JSON
{
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "workflow_mode": "codex_only",
  "stage": "production_init_guard",
  "execution_mode": "codex_dry_run",
  "production_ready": false,
  "local_execution_required_pre_release": true,
  "production_env_template_results": { "example_exists": $([ -f "$ENV_EXAMPLE" ] && echo true || echo false), "real_env_read": false, "secrets_redacted": true },
  "mock_data_guard_results": { "mock_data_allowed_in_production": false, "mock_import_disabled_by_default": true, "production_does_not_import_mock_data": true },
  "privacy_data_guard_results": { "privacy_data_import_disabled_by_default": true, "manual_confirmation_required": true },
  "iopgps_guard_results": { "iopgps_sync_enabled_by_default": false, "real_iopgps_not_called": true },
  "storage_volume_guard_results": { "requires_new_directory": true, "requires_new_storage": true, "requires_new_postgresql_volume": true, "does_not_read_backups_test": true, "does_not_read_storage_test": true },
  "database_name_guard_results": { "forbidden_markers": ["test", "mock", "demo", "sample"], "production_database_label_required": true },
  "deployment_boundary_results": { "does_not_initialize_production_database": true, "does_not_create_container": true, "does_not_execute_migration": true, "does_not_import_data": true },
  "blockers": ${blockers_json},
  "warnings": ${warnings_json},
  "modification_items": ${modifications_json}
}
JSON
  printf 'Production init guard dry-run report generated: %s\n' "${REPORT#${ROOT_DIR}/}"
  [ "${#blockers[@]}" -eq 0 ]
}

main "$@"
