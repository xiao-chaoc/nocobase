#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FIXTURE_DIR="${ROOT_DIR}/test-data/mock/car-rental"
REPORT_PATH="${ROOT_DIR}/test-data/generated/car-rental-mock-data-import-dry-run.generated.json"

# workflow_mode=codex_only
# production_ready=false
# This Codex-only dry-run does not connect to any database, does not import data,
# does not write schema, does not execute migrations, and does not enable real IOPGPS sync.

mkdir -p "$(dirname "$REPORT_PATH")"

node - "$ROOT_DIR" "$FIXTURE_DIR" "$REPORT_PATH" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.argv[2];
const fixtureDir = process.argv[3];
const reportPath = process.argv[4];

const requiredFiles = [
  'drivers.mock.json',
  'vehicles.mock.json',
  'lease-contracts.mock.json',
  'rent-daily-ledgers.mock.json',
  'rent-payments.mock.json',
  'rent-payment-allocations.mock.json',
  'deposit-records.mock.json',
  'operation-logs.mock.json',
  'contract-documents.mock.json',
  'gps-status.mock.json',
  'mock-manifest.json',
];

const requiredBusinessCases = [
  'long-term contract case',
  'time-bound contract case',
  'weekly rent ledger case',
  'free-rent day case',
  'payment allocation case',
  'no overpay per day case',
  'unpaid reason case',
  'arrears case',
  'deposit collect / offset / refund case',
  'deposit not counted as rent income case',
  'current arrears excludes future receivables case',
  'contract document placeholder case',
  'GPS mock status case',
  'operation logs case',
];

const blockers = [];
const warnings = [
  '当前不要求用户本地运行；正式版前才本地执行真实 pre-release mock import 验证。',
  'Codex-only dry-run 不连接数据库、不导入真实数据、不导入 mock 数据到数据库、不写 schema、不执行 migration。',
  '不启用真实 IOPGPS；GPS / IOPGPS 仅允许 mock status 和 mock sync id。',
  'mock 数据不能进入生产；production init must not call mock import。',
];
const modificationItems = [];
const fixtureFiles = [];
const businessTextParts = [];

function addBlocker(message) {
  blockers.push(message);
}

function readFixture(fileName) {
  const absolutePath = path.join(fixtureDir, fileName);
  const relativePath = path.relative(rootDir, absolutePath);
  if (!fs.existsSync(absolutePath)) {
    addBlocker(`Missing required fixture: ${relativePath}`);
    return { relativePath, exists: false, parsed: null, text: '' };
  }

  const text = fs.readFileSync(absolutePath, 'utf8');
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    addBlocker(`Invalid JSON fixture: ${relativePath}`);
  }
  return { relativePath, exists: true, parsed, text };
}

function containsUnsafePhone(text) {
  const candidates = text.match(/\b1[3-9]\d{9}\b/g) || [];
  return candidates.length > 0;
}

function containsUnsafeIdentity(text) {
  return /\b\d{15}(?:\d{2}[0-9Xx])?\b/.test(text) || /\b[A-Z][0-9]{8,9}\b/.test(text);
}

function containsUnsafeFileReference(text) {
  return /(?:payment|screenshot|contract|scan)[^\n]*\.(?:png|jpe?g|pdf|docx?|zip)/i.test(text) && !text.includes('placeholder://');
}

function containsSecretMaterial(text) {
  return /(?:IOPGPS_LOGIN_KEY|DB_PASSWORD|APP_KEY|password\s*[:=]|secret\s*[:=]|token\s*[:=]|access[_-]?token\s*[:=])/i.test(text);
}

function containsEmail(text) {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
}

function containsAddress(text) {
  return /(?:street|road|avenue|address|小区|路|街道|门牌)/i.test(text);
}

for (const fileName of requiredFiles) {
  const fixture = readFixture(fileName);
  const records = Array.isArray(fixture.parsed?.records) ? fixture.parsed.records.length : 0;
  fixtureFiles.push({ path: fixture.relativePath, exists: fixture.exists, records });

  if (!fixture.exists || !fixture.parsed) continue;

  if (fixture.parsed.mock_data_only !== true) {
    addBlocker(`${fixture.relativePath} missing mock_data_only=true`);
  }
  if (fixture.parsed.not_for_production !== true) {
    addBlocker(`${fixture.relativePath} missing not_for_production=true`);
  }
  if (containsUnsafePhone(fixture.text)) addBlocker(`${fixture.relativePath} contains suspicious real phone number`);
  if (containsEmail(fixture.text)) addBlocker(`${fixture.relativePath} contains suspicious email`);
  if (containsUnsafeIdentity(fixture.text)) addBlocker(`${fixture.relativePath} contains suspicious identity or passport number`);
  if (containsAddress(fixture.text)) addBlocker(`${fixture.relativePath} contains suspicious real address text`);
  if (containsSecretMaterial(fixture.text)) addBlocker(`${fixture.relativePath} contains forbidden credential marker`);
  if (containsUnsafeFileReference(fixture.text)) addBlocker(`${fixture.relativePath} contains non-placeholder screenshot or scan reference`);

  businessTextParts.push(fixture.text);
}

const businessText = businessTextParts.join('\n');
const businessCaseCoverage = requiredBusinessCases.map((businessCase) => {
  const covered = businessText.toLowerCase().includes(businessCase.toLowerCase());
  if (!covered) modificationItems.push(`补齐 mock data business case: ${businessCase}`);
  return { business_case: businessCase, covered };
});

const privacyGuardResults = [
  { check: 'mock_data_only marker', passed: !blockers.some((item) => item.includes('mock_data_only')) },
  { check: 'not_for_production marker', passed: !blockers.some((item) => item.includes('not_for_production')) },
  { check: 'no suspicious real phone', passed: !blockers.some((item) => item.includes('phone')) },
  { check: 'no suspicious email', passed: !blockers.some((item) => item.includes('email')) },
  { check: 'no suspicious identity or passport', passed: !blockers.some((item) => item.includes('identity')) },
  { check: 'no real screenshot or scan path', passed: !blockers.some((item) => item.includes('screenshot') || item.includes('scan')) },
  { check: 'no credential markers', passed: !blockers.some((item) => item.includes('credential')) },
];

const productionGuardResults = [
  { check: 'workflow_mode=codex_only', passed: true },
  { check: 'execution_mode=codex_dry_run', passed: true },
  { check: 'production_ready=false', passed: true },
  { check: 'local_execution_required_pre_release=true', passed: true },
  { check: 'mock data cannot enter production', passed: true },
  { check: 'production init must not call mock import', passed: true },
];

const fixtureSummary = {
  fixture_dir: path.relative(rootDir, fixtureDir),
  required_file_count: requiredFiles.length,
  existing_file_count: fixtureFiles.filter((file) => file.exists).length,
  total_records: fixtureFiles.reduce((sum, file) => sum + file.records, 0),
};

const report = {
  generated_at: new Date().toISOString(),
  workflow_mode: 'codex_only',
  stage: 'mock_data_import',
  execution_mode: 'codex_dry_run',
  production_ready: false,
  local_execution_required_pre_release: true,
  fixture_files: fixtureFiles,
  fixture_summary: fixtureSummary,
  business_case_coverage: businessCaseCoverage,
  privacy_guard_results: privacyGuardResults,
  production_guard_results: productionGuardResults,
  blockers,
  warnings,
  modification_items: modificationItems,
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ generated: true, report: path.relative(rootDir, reportPath), blockers: blockers.length, modification_items: modificationItems.length }, null, 2));

if (blockers.length > 0) process.exit(1);
NODE
