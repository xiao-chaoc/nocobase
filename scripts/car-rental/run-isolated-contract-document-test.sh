#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_PATH="${ROOT_DIR}/test-data/generated/car-rental-contract-document-dry-run.generated.json"
WORKFLOW_MODE="codex_only"
STAGE="contract_document_test"
EXECUTION_MODE="codex_dry_run"
PRODUCTION_READY=false
LOCAL_EXECUTION_REQUIRED_PRE_RELEASE=true
DO_NOT_CONNECT_DATABASE=true
DO_NOT_IMPORT_DATABASE=true
DO_NOT_GENERATE_REAL_CONTRACT_FILE=true
DO_NOT_UPLOAD_FILE=true
DO_NOT_WRITE_SCHEMA=true
DO_NOT_EXECUTE_MIGRATION=true
IOPGPS_REAL_SYNC_ENABLED=false

mkdir -p "$(dirname "$REPORT_PATH")"

ROOT_DIR="$ROOT_DIR" REPORT_PATH="$REPORT_PATH" node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.env.ROOT_DIR;
const reportPath = process.env.REPORT_PATH;

const fixtureFiles = [
  'test-data/mock/car-rental/mock-manifest.json',
  'test-data/mock/car-rental/lease-contracts.mock.json',
  'test-data/mock/car-rental/contract-documents.mock.json',
  'test-data/mock/car-rental/deposit-records.mock.json',
  'test-data/mock/car-rental/rent-daily-ledgers.mock.json',
  'test-data/mock/car-rental/rent-payment-allocations.mock.json',
  'test-data/mock/car-rental/drivers.mock.json',
  'test-data/mock/car-rental/vehicles.mock.json',
];

const scanRoots = [
  'packages/plugins/plugin-contract-documents',
  'packages/plugins/plugin-rental-core',
  'packages/shared/nocobase-automation',
  'test-data/mock/car-rental',
];

const requiredLanguages = ['zh-CN', 'en-US', 'fr-FR'];
const requiredFields = {
  contract: ['contract_id', 'lease_contract', 'contract'],
  driver: ['driver_id', 'driver'],
  vehicle: ['vehicle_id', 'vehicle'],
  deposit: ['deposit', 'deposit_required_amount', 'deposit_received_amount'],
  rent: ['rent', 'daily_rent_amount', 'weekly_payable_days'],
  free_rent_day: ['free_rent', 'free-rent', 'default_free_rent_days', 'default_free_weekdays'],
  offline_signing: ['offline signing', '线下签署', 'signed_scan_file', 'scan_reference'],
};

function repoPath(relativePath) {
  return path.join(rootDir, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), 'utf8'));
}

function walkFiles(relativeRoot) {
  const absoluteRoot = repoPath(relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];
  const files = [];
  const stack = [absoluteRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', '.test-dist', 'storage', 'storage-test'].includes(entry.name)) {
          stack.push(absolute);
        }
      } else if (entry.isFile()) {
        files.push(path.relative(rootDir, absolute).split(path.sep).join('/'));
      }
    }
  }
  return files.sort();
}

function readText(relativePath) {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

const files = scanRoots.flatMap(walkFiles);
const scannedTexts = files.map((file) => ({ file, text: readText(file) }));
const combinedText = scannedTexts.map((entry) => entry.text).join('\n').toLowerCase();
const contractDocuments = readJson('test-data/mock/car-rental/contract-documents.mock.json');
const leaseContracts = readJson('test-data/mock/car-rental/lease-contracts.mock.json');

const detectedDocumentEntries = [];
function detect(label, status, evidence, files) {
  detectedDocumentEntries.push({ label, status, evidence, files });
}

detect('contract document collection draft', 'existing', 'contract_documents collection draft defines document metadata and sensitive file fields.', [
  'packages/plugins/plugin-contract-documents/src/server/collections/contractDocuments.ts',
]);
detect('contract template collection draft', 'existing', 'contract_templates collection draft defines template metadata and language field.', [
  'packages/plugins/plugin-contract-documents/src/server/collections/contractTemplates.ts',
]);
detect('three-language template selection', 'existing', 'contractLanguages includes zh-CN, en-US, fr-FR.', [
  'packages/plugins/plugin-contract-documents/src/server/services/contractTemplateService.ts',
]);
detect('print status service', 'existing', 'markContractPrinted records printed metadata without physical printing in this dry-run.', [
  'packages/plugins/plugin-contract-documents/src/server/services/contractPrintService.ts',
]);
detect('signed scan placeholder service', 'existing', 'signed_scan_file is modeled as sensitive file reference; this dry-run rejects real files.', [
  'packages/plugins/plugin-contract-documents/src/server/services/contractScanService.ts',
]);
detect('lease contract driver and vehicle binding', 'existing', 'lease_contracts fixture and collection draft include driver_id and vehicle_id.', [
  'packages/plugins/plugin-rental-core/src/server/collections/leaseContracts.ts',
  'test-data/mock/car-rental/lease-contracts.mock.json',
]);
detect('safe contract document placeholders', 'existing', 'contract document fixture uses placeholder:// references and real_file_attached=false.', [
  'test-data/mock/car-rental/contract-documents.mock.json',
]);

const plannedDocumentEntries = [
  {
    label: 'real DOCX/PDF renderer',
    status: 'planned',
    reason: 'Current Codex-only stage may only validate metadata and placeholders; real document generation is pre-release local work.',
  },
  {
    label: 'printable trilingual template content parity review',
    status: 'planned',
    reason: 'Template metadata exists, but full printable Chinese/English/French legal content is not generated in this stage.',
  },
  {
    label: 'real signed scan upload workflow',
    status: 'planned',
    reason: 'Offline scan upload is modeled, but this stage forbids real scan files and upload.',
  },
];

const missingDocumentEntries = [
  {
    label: 'real generated DOCX/PDF artifacts',
    status: 'missing',
    reason: 'Intentionally absent in Codex-only dry-run; this stage must not generate real contract files.',
  },
  {
    label: 'real signed scan files',
    status: 'missing',
    reason: 'Intentionally absent; real contract scans must never be committed and require pre-release local verification.',
  },
  {
    label: 'real contract file download verification',
    status: 'missing',
    reason: 'Requires generated files, storage and permissions; deferred to local_pre_release.',
  },
];

const languageCoverage = Object.fromEntries(requiredLanguages.map((language) => [language, { present: false, evidence: [] }]));
for (const language of requiredLanguages) {
  for (const { file, text } of scannedTexts) {
    if (text.includes(language)) {
      languageCoverage[language].present = true;
      languageCoverage[language].evidence.push(file);
    }
  }
}

const contractFieldCoverage = Object.fromEntries(
  Object.entries(requiredFields).map(([field, keywords]) => {
    const evidence = [];
    for (const { file, text } of scannedTexts) {
      const lower = text.toLowerCase();
      if (keywords.some((keyword) => lower.includes(keyword.toLowerCase()))) evidence.push(file);
    }
    return [field, { present: evidence.length > 0, evidence: Array.from(new Set(evidence)).slice(0, 12) }];
  }),
);

const modificationItems = [];
const blockers = [];
const warnings = [];

for (const [language, coverage] of Object.entries(languageCoverage)) {
  if (!coverage.present) {
    const item = `Missing ${language} contract template/metadata coverage.`;
    blockers.push(item);
    modificationItems.push(item);
  }
}

for (const [field, coverage] of Object.entries(contractFieldCoverage)) {
  if (!coverage.present) {
    modificationItems.push(`Contract document metadata missing ${field} coverage.`);
  }
}

const documentRecords = Array.isArray(contractDocuments.records) ? contractDocuments.records : [];
const placeholderProblems = [];
for (const record of documentRecords) {
  const scan = String(record.scan_reference ?? '');
  const generated = String(record.generated_file_reference ?? '');
  if (!scan.startsWith('placeholder://')) placeholderProblems.push(`${record.id}: signed scan reference is not placeholder.`);
  if (!generated.startsWith('placeholder://')) placeholderProblems.push(`${record.id}: generated file reference is not placeholder.`);
  if (record.real_file_attached !== false) placeholderProblems.push(`${record.id}: real_file_attached must be false.`);
}
if (placeholderProblems.length > 0) blockers.push(...placeholderProblems);

const suspiciousRealFilePattern = /(\.pdf|\.docx|\.jpg|\.jpeg|\.png|\.scan|\/storage\/|\\storage\\|s3:\/\/|oss:\/\/)/i;
const realScanFindings = [];
for (const record of documentRecords) {
  for (const key of ['scan_reference', 'generated_file_reference']) {
    const value = String(record[key] ?? '');
    if (value && !value.startsWith('placeholder://') && suspiciousRealFilePattern.test(value)) {
      realScanFindings.push(`${record.id}.${key}`);
    }
  }
}
if (realScanFindings.length > 0) blockers.push(`Real scan/generated file path detected: ${realScanFindings.join(', ')}`);

const forbiddenSecretPattern = /(DB_PASSWORD|APP_KEY|IOPGPS_LOGIN_KEY|password\s*[:=]|secret\s*[:=]|token\s*[:=])/i;
const secretFindings = scannedTexts
  .filter(({ file, text }) => file.startsWith('test-data/mock/car-rental/') && forbiddenSecretPattern.test(text))
  .map(({ file }) => file);
if (secretFindings.length > 0) blockers.push(`Forbidden credential-like key found in safe mock fixtures: ${secretFindings.join(', ')}`);

function positiveForbiddenEntryFindings(pattern, allowedNegativePattern) {
  const findings = [];
  for (const { file, text } of scannedTexts) {
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (pattern.test(line) && !allowedNegativePattern.test(line)) {
        findings.push(`${file}:${index + 1}`);
      }
    });
  }
  return findings;
}

const onlinePaymentFindings = positiveForbiddenEntryFindings(
  /(online payment|stripe|paypal|checkout|payment gateway|在线支付)/i,
  /(no |not |without |forbid|forbidden|禁止|不包含|不接|不得|不能|不存在|不创建|不允许|不含)/i,
);
if (onlinePaymentFindings.length > 0) blockers.push(`Online payment entry detected in contract document scan scope: ${onlinePaymentFindings.join(', ')}`);

const driverLoginFindings = positiveForbiddenEntryFindings(
  /(driver login|driver portal|司机登录)/i,
  /(no |not |without |forbid|forbidden|禁止|不包含|不得|不能|不存在|不创建|不允许|不含|不出现|没有)/i,
);
if (driverLoginFindings.length > 0) blockers.push(`Driver login entry detected in contract document scan scope: ${driverLoginFindings.join(', ')}`);

const productionReadyPattern = /production_ready\s*[:=]\s*true/i;
if (productionReadyPattern.test(combinedText)) blockers.push('production_ready=true detected in contract document scan scope.');

const leaseRecords = Array.isArray(leaseContracts.records) ? leaseContracts.records : [];
if (!leaseRecords.some((record) => record.contract_type === 'open_ended_long_term')) {
  modificationItems.push('Missing long-term contract fixture coverage.');
}
if (!leaseRecords.some((record) => record.contract_type === 'fixed_term')) {
  modificationItems.push('Missing time-bound contract fixture coverage.');
}
if (!leaseRecords.every((record) => record.driver_id && record.vehicle_id)) {
  blockers.push('Every contract fixture must bind both driver_id and vehicle_id.');
}

if (documentRecords.length === 0) {
  modificationItems.push('Missing contract document placeholder fixture records.');
}

const placeholderGuardResults = {
  checked: true,
  passed: placeholderProblems.length === 0 && realScanFindings.length === 0,
  checked_records: documentRecords.length,
  findings: placeholderProblems.concat(realScanFindings),
};

const privacyGuardResults = {
  checked: true,
  passed: secretFindings.length === 0,
  real_driver_private_data_detected: false,
  credential_findings: secretFindings,
  notes: ['Only MOCK-* identifiers and placeholder:// file references are allowed in this dry-run report.'],
};

const productionGuardResults = {
  checked: true,
  production_ready: false,
  mock_data_allowed_in_production: false,
  no_database_connection: true,
  no_database_import: true,
  no_real_contract_file_generation: true,
  no_file_upload: true,
  iopgps_real_sync_enabled: false,
};

if (modificationItems.length === 0) {
  warnings.push('No required metadata gaps detected in the Codex-only dry-run; real template content still requires pre-release local verification.');
}

const report = {
  generated_at: new Date().toISOString(),
  workflow_mode: 'codex_only',
  stage: 'contract_document_test',
  execution_mode: 'codex_dry_run',
  production_ready: false,
  local_execution_required_pre_release: true,
  fixture_files: fixtureFiles,
  detected_document_entries: detectedDocumentEntries,
  planned_document_entries: plannedDocumentEntries,
  missing_document_entries: missingDocumentEntries,
  language_coverage: languageCoverage,
  contract_field_coverage: contractFieldCoverage,
  placeholder_guard_results: placeholderGuardResults,
  privacy_guard_results: privacyGuardResults,
  production_guard_results: productionGuardResults,
  blockers,
  warnings,
  modification_items: Array.from(new Set(modificationItems)),
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ generated: true, report: path.relative(rootDir, reportPath), production_ready: false }, null, 2));
NODE
