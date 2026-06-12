#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOCK_DIR="${ROOT_DIR}/test-data/mock/car-rental"
JSON_REPORT="${ROOT_DIR}/test-data/generated/car-rental-business-smoke-dry-run.generated.json"
MD_REPORT="${ROOT_DIR}/docs/car-rental-business-smoke-dry-run-report.md"
WORKFLOW_MODE="codex_only"
STAGE="business_smoke_test"
EXECUTION_MODE="codex_dry_run"
PRODUCTION_READY=false
LOCAL_EXECUTION_REQUIRED_PRE_RELEASE=true
IOPGPS_REAL_SYNC_ENABLED=false
DO_NOT_CONNECT_DATABASE=true
DO_NOT_IMPORT_DATABASE=true
DO_NOT_WRITE_SCHEMA=true
DO_NOT_RUN_MIGRATION=true

export MOCK_DIR JSON_REPORT MD_REPORT WORKFLOW_MODE STAGE EXECUTION_MODE PRODUCTION_READY LOCAL_EXECUTION_REQUIRED_PRE_RELEASE IOPGPS_REAL_SYNC_ENABLED DO_NOT_CONNECT_DATABASE DO_NOT_IMPORT_DATABASE DO_NOT_WRITE_SCHEMA DO_NOT_RUN_MIGRATION

mkdir -p "$(dirname "$JSON_REPORT")" "$(dirname "$MD_REPORT")"

node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const mockDir = process.env.MOCK_DIR;
const jsonReport = process.env.JSON_REPORT;
const mdReport = process.env.MD_REPORT;

const fixtureFiles = [
  'mock-manifest.json',
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
];

function readFixture(fileName) {
  const filePath = path.join(mockDir, fileName);
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return { fileName, ...parsed, records: Array.isArray(parsed.records) ? parsed.records : [] };
}

const fixtures = Object.fromEntries(fixtureFiles.map((fileName) => [fileName, readFixture(fileName)]));
const records = {
  manifest: fixtures['mock-manifest.json'],
  drivers: fixtures['drivers.mock.json'].records,
  vehicles: fixtures['vehicles.mock.json'].records,
  contracts: fixtures['lease-contracts.mock.json'].records,
  ledgers: fixtures['rent-daily-ledgers.mock.json'].records,
  payments: fixtures['rent-payments.mock.json'].records,
  allocations: fixtures['rent-payment-allocations.mock.json'].records,
  deposits: fixtures['deposit-records.mock.json'].records,
  operationLogs: fixtures['operation-logs.mock.json'].records,
  contractDocuments: fixtures['contract-documents.mock.json'].records,
  gpsStatuses: fixtures['gps-status.mock.json'].records,
};

const blockers = [];
const warnings = [];
const modificationItems = [];

function result(id, name, status, rule, fixturesUsed, details) {
  if (status === 'blocker') blockers.push(`${name}: ${details}`);
  if (status === 'missing' || status === 'pending_verification') {
    modificationItems.push(`${name}: ${details}`);
  }
  if (status === 'warning') warnings.push(`${name}: ${details}`);
  return { id, name, status, rule, fixtures: fixturesUsed, details };
}

function pass(id, name, rule, fixturesUsed, details) {
  return result(id, name, 'pass', rule, fixturesUsed, details);
}

function fail(id, name, status, rule, fixturesUsed, details) {
  return result(id, name, status, rule, fixturesUsed, details);
}

const byId = (items) => new Map(items.map((item) => [item.id, item]));
const driverById = byId(records.drivers);
const vehicleById = byId(records.vehicles);
const contractById = byId(records.contracts);
const ledgerById = byId(records.ledgers);

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function hasRecords(items) {
  return Array.isArray(items) && items.length > 0;
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value));
}

const contractIdsWithDeposit = new Set(records.deposits.map((item) => item.contract_id).filter(Boolean));
const contractIdsWithCollect = new Set(records.deposits.filter((item) => item.deposit_event === 'collect').map((item) => item.contract_id));
const depositEvents = new Set(records.deposits.map((item) => item.deposit_event));
const ledgerContractIds = new Set(records.ledgers.map((item) => item.contract_id));
const ledgerDates = records.ledgers.map((item) => item.ledger_date).filter(Boolean);
const ledgerDateSetByContract = new Map();
for (const ledger of records.ledgers) {
  const dates = ledgerDateSetByContract.get(ledger.contract_id) || new Set();
  dates.add(ledger.ledger_date);
  ledgerDateSetByContract.set(ledger.contract_id, dates);
}

const businessRuleResults = [
  hasRecords(records.drivers) && records.drivers.every((driver) => !hasValue(driver.user_id) && !hasValue(driver.login_name) && !hasValue(driver.password_hash))
    ? pass('BS-001', 'driver no login', '司机存在且不登录系统。', ['drivers.mock.json'], `${records.drivers.length} mock drivers exist without login fields.`)
    : fail('BS-001', 'driver no login', 'blocker', '司机存在且不登录系统。', ['drivers.mock.json'], 'Driver fixture is missing or contains login-like fields.'),
  hasRecords(records.vehicles) && records.vehicles.every((vehicle) => hasValue(vehicle.plate_number))
    ? pass('BS-002', 'vehicle plate required', '车辆存在且必须有车牌。', ['vehicles.mock.json'], `${records.vehicles.length} vehicles have plate_number.`)
    : fail('BS-002', 'vehicle plate required', 'blocker', '车辆存在且必须有车牌。', ['vehicles.mock.json'], 'Vehicle fixture is missing or at least one vehicle has no plate_number.'),
  hasRecords(records.contracts) && records.contracts.every((contract) => driverById.has(contract.driver_id))
    ? pass('BS-003', 'contract driver binding', '合同必须绑定司机。', ['lease-contracts.mock.json', 'drivers.mock.json'], 'Every contract driver_id resolves to a mock driver.')
    : fail('BS-003', 'contract driver binding', 'blocker', '合同必须绑定司机。', ['lease-contracts.mock.json', 'drivers.mock.json'], 'At least one contract lacks a valid driver_id.'),
  hasRecords(records.contracts) && records.contracts.every((contract) => vehicleById.has(contract.vehicle_id))
    ? pass('BS-004', 'contract vehicle binding', '合同必须绑定车辆。', ['lease-contracts.mock.json', 'vehicles.mock.json'], 'Every contract vehicle_id resolves to a mock vehicle.')
    : fail('BS-004', 'contract vehicle binding', 'blocker', '合同必须绑定车辆。', ['lease-contracts.mock.json', 'vehicles.mock.json'], 'At least one contract lacks a valid vehicle_id.'),
  hasRecords(records.contracts) && records.contracts.every((contract) => contractIdsWithDeposit.has(contract.id))
    ? pass('BS-005', 'deposit required', '合同必须有押金。', ['lease-contracts.mock.json', 'deposit-records.mock.json'], 'Every contract has at least one deposit record.')
    : fail('BS-005', 'deposit required', 'blocker', '合同必须有押金。', ['lease-contracts.mock.json', 'deposit-records.mock.json'], 'At least one contract has no deposit record.'),
  records.contracts.some((contract) => contract.contract_type === 'open_ended_long_term' && contract.end_date === null)
    ? pass('BS-006', 'long-term contract', '支持长租合同。', ['lease-contracts.mock.json'], 'Open-ended long-term mock contract exists.')
    : fail('BS-006', 'long-term contract', 'missing', '支持长租合同。', ['lease-contracts.mock.json'], 'No open-ended long-term mock contract found.'),
  records.contracts.some((contract) => contract.contract_type === 'fixed_term' && hasValue(contract.end_date))
    ? pass('BS-007', 'time-bound contract', '支持时限合同。', ['lease-contracts.mock.json'], 'Fixed-term mock contract exists.')
    : fail('BS-007', 'time-bound contract', 'missing', '支持时限合同。', ['lease-contracts.mock.json'], 'No fixed-term mock contract found.'),
  records.contracts.filter((contract) => contract.contract_type === 'fixed_term').every((contract) => isIsoDate(contract.start_date) && isIsoDate(contract.end_date))
    ? pass('BS-008', 'natural month for time-bound contract', '时限合同以自然月为周期。', ['lease-contracts.mock.json'], 'Fixed-term contracts use calendar dates suitable for natural-month period checks; real month-cycle execution remains pre-release local verification.')
    : fail('BS-008', 'natural month for time-bound contract', 'missing', '时限合同以自然月为周期。', ['lease-contracts.mock.json'], 'Fixed-term contract date boundaries are missing.'),
  records.ledgers.every((ledger) => /^\d{4}-W\d{2}$/.test(String(ledger.natural_week)))
    ? pass('BS-009', 'natural week rent calculation', '所有合同按自然周计算租金。', ['rent-daily-ledgers.mock.json'], 'Every ledger row includes natural_week in ISO week-like format.')
    : fail('BS-009', 'natural week rent calculation', 'blocker', '所有合同按自然周计算租金。', ['rent-daily-ledgers.mock.json'], 'At least one ledger row lacks natural_week.'),
  records.contracts.every((contract) => Array.isArray(contract.default_free_rent_days) && contract.default_free_rent_days.length > 0)
    ? pass('BS-010', 'selected free-rent days', '默认免租日必须来自合同生成时选择。', ['lease-contracts.mock.json'], 'Every contract carries selected default_free_rent_days.')
    : fail('BS-010', 'selected free-rent days', 'missing', '默认免租日必须来自合同生成时选择。', ['lease-contracts.mock.json'], 'At least one contract lacks selected default_free_rent_days.'),
  records.contracts.every((contract) => (contract.default_free_rent_days || []).every((date) => (ledgerDateSetByContract.get(contract.id) || new Set()).has(date)))
    ? pass('BS-011', 'free-rent days reflected in daily ledger', '免租日应体现在日租金台账。', ['lease-contracts.mock.json', 'rent-daily-ledgers.mock.json'], 'Selected free-rent dates are present in the daily ledger.')
    : fail('BS-011', 'free-rent days reflected in daily ledger', 'blocker', '免租日应体现在日租金台账。', ['lease-contracts.mock.json', 'rent-daily-ledgers.mock.json'], 'A selected free-rent day is absent from the ledger.'),
  hasRecords(records.ledgers) && records.ledgers.every((ledger) => isIsoDate(ledger.ledger_date)) && new Set(records.ledgers.map((ledger) => `${ledger.contract_id}:${ledger.ledger_date}`)).size === records.ledgers.length
    ? pass('BS-012', 'daily ledger by date', '日租金台账必须按日期生成。', ['rent-daily-ledgers.mock.json'], 'Ledger rows are date-based and fixture contract/date pairs are unique in this smoke dataset.')
    : fail('BS-012', 'daily ledger by date', 'blocker', '日租金台账必须按日期生成。', ['rent-daily-ledgers.mock.json'], 'Ledger rows are missing valid dates or duplicate fixture contract/date pairs.'),
  records.allocations.every((allocation) => ledgerById.has(allocation.ledger_id) && isIsoDate(allocation.allocation_date))
    ? pass('BS-013', 'payment allocation by date', '付款必须按日分配。', ['rent-payments.mock.json', 'rent-payment-allocations.mock.json', 'rent-daily-ledgers.mock.json'], 'Every allocation resolves to one daily ledger date.')
    : fail('BS-013', 'payment allocation by date', 'blocker', '付款必须按日分配。', ['rent-payment-allocations.mock.json'], 'At least one payment allocation is not tied to a daily ledger date.'),
  records.ledgers.every((ledger) => Number(ledger.paid_amount || 0) <= Number(ledger.rent_amount || 0)) && records.allocations.every((allocation) => allocation.no_overpay_per_day === true)
    ? pass('BS-014', 'no overpay per day', '单日不可超付。', ['rent-daily-ledgers.mock.json', 'rent-payment-allocations.mock.json'], 'No daily paid_amount exceeds rent_amount and allocations assert no_overpay_per_day.')
    : fail('BS-014', 'no overpay per day', 'blocker', '单日不可超付。', ['rent-daily-ledgers.mock.json', 'rent-payment-allocations.mock.json'], 'A daily ledger or allocation indicates overpayment.'),
  records.ledgers.filter((ledger) => ['unpaid', 'partial_arrears'].includes(ledger.status)).every((ledger) => hasValue(ledger.unpaid_reason) || hasValue(ledger.status))
    ? pass('BS-015', 'unpaid reason', '未付日期必须有未付原因或状态。', ['rent-daily-ledgers.mock.json'], 'Unpaid or partial arrears ledger rows carry status and mock unpaid_reason when needed.')
    : fail('BS-015', 'unpaid reason', 'blocker', '未付日期必须有未付原因或状态。', ['rent-daily-ledgers.mock.json'], 'An unpaid ledger row has neither status nor unpaid reason.'),
  records.contracts.every((contract) => contract.current_arrears_excludes_future_receivables === true)
    ? pass('BS-016', 'current arrears excludes future receivables', '欠款计算只统计当前日期及以前，当前欠款不包含未来应收。', ['lease-contracts.mock.json'], 'Contracts explicitly mark current_arrears_excludes_future_receivables=true.')
    : fail('BS-016', 'current arrears excludes future receivables', 'blocker', '欠款计算只统计当前日期及以前，当前欠款不包含未来应收。', ['lease-contracts.mock.json'], 'A contract could include future receivables in current arrears.'),
  hasRecords(records.contractDocuments) && records.contractDocuments.every((doc) => String(doc.scan_reference || '').startsWith('placeholder://') && doc.real_file_attached === false)
    ? pass('BS-017', 'contract document placeholder', '合同文档使用 placeholder，不使用真实扫描件。', ['contract-documents.mock.json'], 'All document references are placeholder:// and real_file_attached=false.')
    : fail('BS-017', 'contract document placeholder', 'blocker', '合同文档使用 placeholder，不使用真实扫描件。', ['contract-documents.mock.json'], 'A contract document looks like a real file attachment.'),
  hasRecords(records.gpsStatuses)
    ? pass('BS-018', 'GPS mock status exists', 'GPS mock status 存在。', ['gps-status.mock.json'], `${records.gpsStatuses.length} GPS mock status records exist.`)
    : fail('BS-018', 'GPS mock status exists', 'missing', 'GPS mock status 存在。', ['gps-status.mock.json'], 'No GPS mock status records found.'),
  records.ledgers.every((ledger) => !hasValue(ledger.gps_status_id) && !hasValue(ledger.iopgps_sync_record_id))
    ? pass('BS-019', 'GPS not used for rent calculation', 'GPS 不参与租金计算。', ['rent-daily-ledgers.mock.json', 'gps-status.mock.json'], 'Rent ledger rows contain no GPS or IOPGPS calculation references.')
    : fail('BS-019', 'GPS not used for rent calculation', 'blocker', 'GPS 不参与租金计算。', ['rent-daily-ledgers.mock.json', 'gps-status.mock.json'], 'A rent ledger row references GPS for calculation.'),
  process.env.IOPGPS_REAL_SYNC_ENABLED === 'false'
    ? pass('BS-020', 'IOPGPS real sync disabled', 'IOPGPS 真实同步默认禁用。', ['gps-status.mock.json'], 'IOPGPS_REAL_SYNC_ENABLED=false for this dry-run.')
    : fail('BS-020', 'IOPGPS real sync disabled', 'blocker', 'IOPGPS 真实同步默认禁用。', ['gps-status.mock.json'], 'IOPGPS real sync is not disabled.'),
  hasRecords(records.operationLogs)
    ? pass('BS-021', 'operation logs', 'operation logs 存在。', ['operation-logs.mock.json'], `${records.operationLogs.length} operation log records exist.`)
    : fail('BS-021', 'operation logs', 'missing', 'operation logs 存在。', ['operation-logs.mock.json'], 'No operation log records found.'),
];

const financialRuleResults = [
  depositEvents.has('collect')
    ? pass('FR-001', 'deposit collect exists', '押金收取存在。', ['deposit-records.mock.json'], 'At least one deposit collect event exists; per-contract deposit presence is covered by BS-005.')
    : fail('FR-001', 'deposit collect exists', 'blocker', '押金收取存在。', ['deposit-records.mock.json'], 'No deposit collect event found.'),
  depositEvents.has('offset')
    ? pass('FR-002', 'deposit offset exists', '押金抵扣存在。', ['deposit-records.mock.json'], 'Deposit offset event exists.')
    : fail('FR-002', 'deposit offset exists', 'missing', '押金抵扣存在。', ['deposit-records.mock.json'], 'No deposit offset event found.'),
  depositEvents.has('refund')
    ? pass('FR-003', 'deposit refund exists', '押金退还存在。', ['deposit-records.mock.json'], 'Deposit refund event exists.')
    : fail('FR-003', 'deposit refund exists', 'missing', '押金退还存在。', ['deposit-records.mock.json'], 'No deposit refund event found.'),
  records.deposits.every((deposit) => deposit.rent_income === false)
    ? pass('FR-004', 'deposit not counted as rent income', '押金不计入租金收入。', ['deposit-records.mock.json'], 'All deposit records have rent_income=false.')
    : fail('FR-004', 'deposit not counted as rent income', 'blocker', '押金不计入租金收入。', ['deposit-records.mock.json'], 'A deposit record is marked as rent income.'),
  records.ledgers.every((ledger) => contractById.has(ledger.contract_id))
    ? pass('FR-005', 'ledger contract binding', '日租金台账必须绑定合同。', ['rent-daily-ledgers.mock.json', 'lease-contracts.mock.json'], 'Every ledger row resolves to a mock contract.')
    : fail('FR-005', 'ledger contract binding', 'blocker', '日租金台账必须绑定合同。', ['rent-daily-ledgers.mock.json', 'lease-contracts.mock.json'], 'At least one ledger row lacks a valid contract binding.'),
  records.payments.every((payment) => contractById.has(payment.contract_id) && driverById.has(payment.driver_id))
    ? pass('FR-006', 'payment contract and driver binding', '付款必须绑定合同与司机。', ['rent-payments.mock.json'], 'Every payment resolves to a mock contract and driver.')
    : fail('FR-006', 'payment contract and driver binding', 'blocker', '付款必须绑定合同与司机。', ['rent-payments.mock.json'], 'A payment lacks valid contract or driver binding.'),
];

const combinedFixtureText = fixtureFiles.map((file) => fs.readFileSync(path.join(mockDir, file), 'utf8')).join('\n');
const suspiciousSecrets = [/secret/i, /token/i, /password/i, /credential_present"\s*:\s*true/i, /login_key/i];
const suspiciousRealPhone = /(?<!0)1[3-9]\d{9}(?!\d)/;
const suspiciousIdNumber = /\b\d{17}[0-9Xx]\b/;
const allFixturesSafe = fixtureFiles.every((file) => fixtures[file].mock_data_only === true && fixtures[file].not_for_production === true);

const privacyGuardResults = [
  allFixturesSafe
    ? pass('PG-001', 'safe fixture flags', 'mock 数据必须标记为 mock_data_only 且 not_for_production。', fixtureFiles, 'All fixture files are marked mock_data_only=true and not_for_production=true.')
    : fail('PG-001', 'safe fixture flags', 'blocker', 'mock 数据必须标记为 mock_data_only 且 not_for_production。', fixtureFiles, 'At least one fixture misses a safety flag.'),
  !suspiciousRealPhone.test(combinedFixtureText) && !suspiciousIdNumber.test(combinedFixtureText)
    ? pass('PG-002', 'privacy guard', 'mock 数据不得包含真实隐私数据。', fixtureFiles, 'No real-looking phone number or national ID pattern detected.')
    : fail('PG-002', 'privacy guard', 'blocker', 'mock 数据不得包含真实隐私数据。', fixtureFiles, 'Potential real privacy data pattern detected.'),
  !suspiciousSecrets.some((pattern) => pattern.test(combinedFixtureText.replace(/credential_present"\s*:\s*false/g, 'credential_present:false')))
    ? pass('PG-003', 'secret guard', 'mock 数据不得包含真实凭据。', fixtureFiles, 'No enabled credential, token, password, or login-key pattern detected.')
    : fail('PG-003', 'secret guard', 'blocker', 'mock 数据不得包含真实凭据。', fixtureFiles, 'Potential secret or enabled credential pattern detected.'),
];

const productionGuardResults = [
  process.env.PRODUCTION_READY === 'false'
    ? pass('PR-001', 'production_ready false', '当前不能标记 production_ready。', ['run-isolated-business-smoke-test.sh'], 'production_ready=false is fixed in the dry-run report.')
    : fail('PR-001', 'production_ready false', 'blocker', '当前不能标记 production_ready。', ['run-isolated-business-smoke-test.sh'], 'production_ready was not false.'),
  process.env.DO_NOT_CONNECT_DATABASE === 'true' && process.env.DO_NOT_IMPORT_DATABASE === 'true'
    ? pass('PR-002', 'no database execution', '不真实连接数据库，不真实导入数据。', ['run-isolated-business-smoke-test.sh'], 'The dry-run reads JSON fixtures only and performs no database execution.')
    : fail('PR-002', 'no database execution', 'blocker', '不真实连接数据库，不真实导入数据。', ['run-isolated-business-smoke-test.sh'], 'Database execution guard is not active.'),
  records.manifest.production_guard && String(records.manifest.production_guard).includes('mock data cannot enter production')
    ? pass('PR-003', 'production guard', 'mock 数据不得进入生产。', ['mock-manifest.json'], records.manifest.production_guard)
    : fail('PR-003', 'production guard', 'blocker', 'mock 数据不得进入生产。', ['mock-manifest.json'], 'Mock manifest does not state production guard.'),
];

const report = {
  generated_at: new Date().toISOString(),
  workflow_mode: process.env.WORKFLOW_MODE,
  stage: process.env.STAGE,
  execution_mode: process.env.EXECUTION_MODE,
  production_ready: false,
  local_execution_required_pre_release: true,
  fixture_files: fixtureFiles.map((file) => `test-data/mock/car-rental/${file}`),
  business_rule_results: businessRuleResults,
  financial_rule_results: financialRuleResults,
  privacy_guard_results: privacyGuardResults,
  production_guard_results: productionGuardResults,
  blockers,
  warnings,
  modification_items: modificationItems,
};

fs.writeFileSync(jsonReport, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

function tableRows(items) {
  return items
    .map((item) => `| ${item.id} | ${item.name} | ${item.status} | ${item.details.replace(/\|/g, '\\|')} |`)
    .join('\n');
}

const markdown = `# Car Rental Business Smoke Dry-run Report

- generated_at: ${report.generated_at}
- current_stage: ${report.stage}
- workflow_mode: ${report.workflow_mode}
- execution_mode: ${report.execution_mode}
- production_ready: ${String(report.production_ready)}
- pre_release local execution required: ${String(report.local_execution_required_pre_release)}
- 当前不要求用户本地运行；正式版前才本地执行真实业务 smoke 验证。
- mock 数据不得进入生产。

## Fixture files

${report.fixture_files.map((file) => `- ${file}`).join('\n')}

## Business rule results

| ID | Rule item | Status | Details |
| --- | --- | --- | --- |
${tableRows(report.business_rule_results)}

## Financial rule results

| ID | Rule item | Status | Details |
| --- | --- | --- | --- |
${tableRows(report.financial_rule_results)}

## Privacy guard results

| ID | Rule item | Status | Details |
| --- | --- | --- | --- |
${tableRows(report.privacy_guard_results)}

## Production guard results

| ID | Rule item | Status | Details |
| --- | --- | --- | --- |
${tableRows(report.production_guard_results)}

## Blockers

${report.blockers.length ? report.blockers.map((item) => `- ${item}`).join('\n') : '- None in Codex fixture dry-run.'}

## Warnings

${report.warnings.length ? report.warnings.map((item) => `- ${item}`).join('\n') : '- None in Codex fixture dry-run.'}

## Modification items

${report.modification_items.length ? report.modification_items.map((item) => `- ${item}`).join('\n') : '- None from current safe mock fixture dry-run; real pre-release local execution remains required.'}

## Safety notes

- production_ready=false.
- pre-release local execution required.
- 当前不要求用户本地运行。
- mock 数据不得进入生产。
- 不启用真实 IOPGPS。
- 本 dry-run 不真实连接数据库、不真实导入数据、不写 schema、不执行 migration。
`;

fs.writeFileSync(mdReport, markdown, 'utf8');

console.log(JSON.stringify({ generated: true, report: path.relative(process.cwd(), jsonReport), blockers: blockers.length, production_ready: false }, null, 2));
NODE
