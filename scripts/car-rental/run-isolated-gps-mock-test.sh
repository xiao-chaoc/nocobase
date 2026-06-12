#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_PATH="${ROOT_DIR}/test-data/generated/car-rental-gps-mock-dry-run.generated.json"

# Codex-only GPS mock dry-run guardrails:
# workflow_mode=codex_only
# production_ready=false
# This script does not connect to any database.
# This script does not import data into any database.
# This script does not call real IOPGPS API endpoints.
# This script does not enable real IOPGPS sync.
# This script does not write schema and does not run migration.

mkdir -p "$(dirname "$REPORT_PATH")"

ROOT_DIR="$ROOT_DIR" REPORT_PATH="$REPORT_PATH" node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.env.ROOT_DIR;
const reportPath = process.env.REPORT_PATH;
const fixtureRelativePath = 'test-data/mock/car-rental/gps-status.mock.json';
const scanRoots = [
  'packages/plugins/plugin-iopgps',
  'packages/plugins/plugin-rental-core',
  'packages/shared/nocobase-automation',
  'test-data/mock/car-rental',
];
const keywordPattern = /gps|iopgps|device|tracker|location|latitude|longitude|mileage|odometer|status|offline|online|fault|sync|api|cron|scheduler|workflow|mock|vehicle gps|gps device|gps status|gps mileage|gps location/i;

function repoPath(relativePath) {
  return path.join(rootDir, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), 'utf8'));
}

function walkFiles(relativePath) {
  const absolutePath = repoPath(relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) return [relativePath];
  const output = [];
  for (const entry of fs.readdirSync(absolutePath).sort()) {
    if (['node_modules', '.git', '.test-dist', 'storage', 'storage-test', 'backups-test', 'logs-test', 'test-runtime'].includes(entry)) continue;
    output.push(...walkFiles(path.join(relativePath, entry)));
  }
  return output;
}

function unique(values) {
  return Array.from(new Set(values));
}

const fixture = readJson(fixtureRelativePath);
const records = Array.isArray(fixture.records) ? fixture.records : [];
const scannedFiles = scanRoots.flatMap(walkFiles).filter((file) => /\.(ts|tsx|js|json|md|sh)$/.test(file));
const detectedGpsEntries = [];
for (const file of scannedFiles) {
  const text = fs.readFileSync(repoPath(file), 'utf8');
  if (!keywordPattern.test(text)) continue;
  const labels = [];
  if (/gps_devices|gpsDevices|gps device|gps_device/i.test(text)) labels.push('gps device');
  if (/gps_location|location|latitude|longitude|lat|lng/i.test(text)) labels.push('gps location');
  if (/gps_daily_mileage|mileage|odometer/i.test(text)) labels.push('gps mileage');
  if (/gps_status|device_status|online|offline|fault|sync_failed/i.test(text)) labels.push('gps status');
  if (/iopgps/i.test(text)) labels.push('iopgps');
  if (/vehicle_id|vehicles|vehicle gps/i.test(text)) labels.push('vehicle binding');
  if (/defaultEnabled:\s*false|callsRealApi:\s*false|writesDatabase:\s*false|IOPGPS_SYNC_ENABLED/i.test(text)) labels.push('sync disabled guard');
  detectedGpsEntries.push({
    file,
    status: 'existing',
    labels: unique(labels).sort(),
  });
}

const statuses = unique(records.map((record) => String(record.status || '').replace(/^mock_/, ''))).sort();
const requiredStatuses = ['online', 'offline', 'fault', 'sync_failed'];
const gpsStatusCoverage = Object.fromEntries(
  requiredStatuses.map((status) => [
    status,
    {
      present: statuses.includes(status),
      record_ids: records.filter((record) => String(record.status || '').replace(/^mock_/, '') === status).map((record) => record.id),
    },
  ]),
);
const gpsMileageCoverage = {
  present: records.some((record) => record.mileage && Object.prototype.hasOwnProperty.call(record.mileage, 'value')),
  placeholder: records.every((record) => record.mileage && record.mileage.placeholder === true),
  missing_mileage_case_present: records.some((record) => record.mileage && record.mileage.value === null),
};
const gpsLocationCoverage = {
  present: records.some((record) => record.location),
  placeholder: records.every((record) => record.location && record.location.placeholder === true),
  no_real_coordinates: records.every((record) => record.location && record.location.not_real_coordinates === true),
  sync_failure_no_location_case_present: records.some((record) => String(record.status) === 'sync_failed' && record.location && record.location.latitude === null),
};
const vehicleBindingCoverage = {
  present: records.every((record) => typeof record.vehicle_id === 'string' && record.vehicle_id.startsWith('MOCK-VEHICLE-')),
  vehicle_ids: unique(records.map((record) => record.vehicle_id).filter(Boolean)).sort(),
  device_ids: unique(records.map((record) => record.gps_device_id).filter(Boolean)).sort(),
};

const allScannedText = scannedFiles.map((file) => fs.readFileSync(repoPath(file), 'utf8')).join('\n');
const rentLogicText = scannedFiles
  .filter((file) => file.startsWith('packages/plugins/plugin-rental-core/'))
  .map((file) => fs.readFileSync(repoPath(file), 'utf8'))
  .join('\n');
const rentLogicConcernText = scannedFiles
  .filter((file) => /packages\/plugins\/plugin-rental-core\/src\/server\/services\/(billing|ledger|payment|deposit|summary|shortfall|waiver|manualAdjustment)/i.test(file))
  .map((file) => fs.readFileSync(repoPath(file), 'utf8'))
  .join('\n');
const gpsRentCalculationDetected = /gps_rent_calculation|gps[^\n]{0,80}(rent|租金)[^\n]{0,80}(calculate|calculation|计算)/i.test(rentLogicConcernText);
const failureIsolationResults = {
  gps_not_used_for_rent_calculation: !gpsRentCalculationDetected,
  gps_failure_does_not_affect_rent_ledger: /失败[^\n]{0,40}不影响租金台账|failure[^\n]{0,80}rent ledger/i.test(allScannedText) || /不影响租金台账/.test(allScannedText),
  gps_failure_does_not_affect_payment_allocation: /失败[^\n]{0,40}不影响.*付款|failure[^\n]{0,80}payment/i.test(allScannedText) || /不影响.*付款/.test(allScannedText),
  gps_failure_does_not_affect_deposit: !/gps[^\n]{0,80}deposit[^\n]{0,80}(required|block|affect)|gps[^\n]{0,80}押金[^\n]{0,80}(阻止|影响)/i.test(allScannedText),
  gps_failure_does_not_affect_contract_document: !/gps[^\n]{0,80}contract[^\n]{0,80}(required|block|affect)|gps[^\n]{0,80}合同[^\n]{0,80}(阻止|影响)/i.test(allScannedText),
};

const fixtureText = JSON.stringify(fixture, null, 2);
const suspiciousSecretPatterns = [
  /IOPGPS_LOGIN_KEY\s*[:=]\s*(?!false|mock|test|placeholder|masked|null)/i,
  /login_key\s*[:=]\s*(?!false|mock|test|placeholder|masked|null)/i,
  /access_token\s*[:=]\s*(?!false|mock|test|placeholder|masked|null)/i,
  /token\s*[:=]\s*(?!false|mock|test|placeholder|masked|null)/i,
  /password\s*[:=]\s*(?!false|mock|test|placeholder|masked|null)/i,
  /secret\s*[:=]\s*(?!false|mock|test|placeholder|masked|null)/i,
];
const secretGuardResults = {
  no_iopgps_login_key_value: !/IOPGPS_LOGIN_KEY\s*[:=]/i.test(fixtureText),
  no_login_key_value: !/login_key\s*[:=]/i.test(fixtureText),
  no_access_token_value: !/access_token\s*[:=]/i.test(fixtureText),
  no_secret_like_fixture_values: !suspiciousSecretPatterns.some((pattern) => pattern.test(fixtureText)),
  no_real_raw_response: records.every((record) => record.raw_response_included === false && !Object.prototype.hasOwnProperty.call(record, 'raw_response')),
};
const productionGuardResults = {
  mock_data_only: fixture.mock_data_only === true,
  not_for_production: fixture.not_for_production === true,
  production_ready: false,
  iopgps_sync_enabled: false,
  mock_data_cannot_enter_production: true,
};

const plannedGpsEntries = [
  { label: 'real IOPGPS API credential configuration', status: 'planned', reason: 'Only allowed in separate pre-release local verification with secrets outside Git.' },
  { label: 'real IOPGPS status/location/mileage synchronization', status: 'planned', reason: 'Codex-only stage must not call real provider APIs.' },
  { label: 'scheduler/workflow registration for real sync', status: 'planned', reason: 'Current schedule registry is a disabled draft; real registration is deferred.' },
  { label: 'real GPS raw track retention policy review', status: 'planned', reason: 'Raw provider tracks are sensitive and absent from fixtures.' },
];
const missingGpsEntries = [];
if (!Object.values(gpsStatusCoverage).every((coverage) => coverage.present)) missingGpsEntries.push('GPS mock status coverage is incomplete.');
if (!vehicleBindingCoverage.present) missingGpsEntries.push('GPS mock vehicle binding is incomplete.');
if (!gpsMileageCoverage.present || !gpsMileageCoverage.placeholder) missingGpsEntries.push('GPS mock mileage placeholder coverage is incomplete.');
if (!gpsLocationCoverage.present || !gpsLocationCoverage.placeholder) missingGpsEntries.push('GPS mock location placeholder coverage is incomplete.');
if (records.some((record) => record.raw_response_included !== false)) missingGpsEntries.push('GPS mock no real raw response guard is incomplete.');

const pendingGpsEntries = [
  { label: 'real provider endpoint contract', status: 'pending_verification', reason: 'Must be verified only in pre-release local environment without committing credentials.' },
  { label: 'real database write path', status: 'pending_verification', reason: 'This task intentionally avoids database connection, schema write, and migration.' },
];

const blockers = [];
const modificationItems = [];
const warnings = [];
for (const [status, coverage] of Object.entries(gpsStatusCoverage)) {
  if (!coverage.present) {
    const item = `Missing GPS mock ${status} status coverage.`;
    blockers.push(item);
    modificationItems.push(item);
  }
}
if (!vehicleBindingCoverage.present) {
  blockers.push('Missing GPS mock vehicle binding coverage.');
  modificationItems.push('Add MOCK-VEHICLE-* binding for every GPS mock record.');
}
if (gpsRentCalculationDetected) blockers.push('GPS appears to participate in rent calculation and must be removed from rent logic.');
for (const [key, value] of Object.entries(failureIsolationResults)) {
  if (value !== true) blockers.push(`Failure isolation check failed: ${key}.`);
}
for (const [key, value] of Object.entries(secretGuardResults)) {
  if (value !== true) blockers.push(`Secret guard check failed: ${key}.`);
}
for (const [key, value] of Object.entries(productionGuardResults)) {
  if (key === 'iopgps_sync_enabled') {
    if (value !== false) blockers.push('Production guard check failed: real IOPGPS sync must remain disabled.');
  } else if (key === 'production_ready') {
    if (value !== false) blockers.push('Production guard check failed: production_ready must remain false.');
  } else if (value !== true) {
    blockers.push(`Production guard check failed: ${key}.`);
  }
}
if (missingGpsEntries.length > 0) modificationItems.push(...missingGpsEntries);
warnings.push('Codex-only GPS mock dry-run does not replace formal pre-release local verification.');
warnings.push('Real IOPGPS credentials and real GPS tracks must remain outside Git and outside reports.');
modificationItems.push('Keep GPS mock test as codex_dry_run until separate pre-release local verification is approved.');
modificationItems.push('Add backup/rollback rehearsal stage next.');

const report = {
  generated_at: new Date().toISOString(),
  workflow_mode: 'codex_only',
  stage: 'gps_mock_test',
  execution_mode: 'codex_dry_run',
  production_ready: false,
  local_execution_required_pre_release: true,
  fixture_files: [fixtureRelativePath],
  detected_gps_entries: detectedGpsEntries,
  planned_gps_entries: plannedGpsEntries,
  missing_gps_entries: missingGpsEntries,
  pending_verification_gps_entries: pendingGpsEntries,
  gps_status_coverage: gpsStatusCoverage,
  gps_mileage_coverage: gpsMileageCoverage,
  gps_location_coverage: gpsLocationCoverage,
  vehicle_binding_coverage: vehicleBindingCoverage,
  failure_isolation_results: failureIsolationResults,
  secret_guard_results: secretGuardResults,
  production_guard_results: productionGuardResults,
  blockers,
  warnings,
  modification_items: unique(modificationItems),
};
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ generated: true, workflow_mode: report.workflow_mode, stage: report.stage, execution_mode: report.execution_mode, production_ready: report.production_ready, blockers: report.blockers.length, report: path.relative(rootDir, reportPath) }, null, 2));
if (blockers.length > 0) process.exitCode = 1;
NODE
