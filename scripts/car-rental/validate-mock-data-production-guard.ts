const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const planPath = 'docs/car-rental-mock-data-import-plan.md';
const specPath = 'docs/car-rental-safe-mock-fixture-spec.md';
const dryRunScriptPath = 'scripts/car-rental/run-isolated-mock-data-import-test.sh';
const dryRunReportPath = 'docs/car-rental-mock-data-import-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-mock-data-import-modification-items.md';
const generatedReportPath = 'test-data/generated/car-rental-mock-data-import-dry-run.generated.json';
const fixtureDir = 'test-data/mock/car-rental';
const fixtureFiles = [
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

interface CheckResult {
  id: string;
  passed: boolean;
  message: string;
}

interface MockDataProductionGuardResult {
  valid: boolean;
  production_ready: false;
  checkedFiles: string[];
  checks: CheckResult[];
  blockers: string[];
}

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function exists(relativePath: string): boolean {
  return fs.existsSync(repoPath(relativePath));
}

function read(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function addCheck(checks: CheckResult[], id: string, passed: boolean, message: string): void {
  checks.push({ id, passed, message });
}

function ensureDryRunReport(): void {
  if (exists(generatedReportPath)) return;
  if (!exists(dryRunScriptPath)) return;
  childProcess.execFileSync('bash', [repoPath(dryRunScriptPath)], {
    cwd: rootDir,
    stdio: 'pipe',
    env: { ...process.env },
  });
}

function readJson(relativePath: string): Record<string, unknown> {
  if (!exists(relativePath)) return {};
  return JSON.parse(read(relativePath));
}

function fixturePath(fileName: string): string {
  return path.join(fixtureDir, fileName);
}

function hasUnsafePhone(text: string): boolean {
  return /\b1[3-9]\d{9}\b/.test(text);
}

function hasUnsafeIdentity(text: string): boolean {
  return /\b\d{15}(?:\d{2}[0-9Xx])?\b/.test(text) || /\b[A-Z][0-9]{8,9}\b/.test(text);
}

function hasUnsafeScreenshotOrScan(text: string): boolean {
  return (
    /(?:payment|screenshot|contract|scan)[^\n]*\.(?:png|jpe?g|pdf|docx?|zip)/i.test(text) &&
    !text.includes('placeholder://')
  );
}

function hasForbiddenCredentialText(text: string): boolean {
  return /(?:IOPGPS_LOGIN_KEY|DB_PASSWORD|APP_KEY|password\s*[:=]|secret\s*[:=]|token\s*[:=])/i.test(text);
}

function validateMockDataProductionGuard(): MockDataProductionGuardResult {
  ensureDryRunReport();

  const checks: CheckResult[] = [];
  const plan = exists(planPath) ? read(planPath) : '';
  const spec = exists(specPath) ? read(specPath) : '';
  const dryRunReport = exists(dryRunReportPath) ? read(dryRunReportPath) : '';
  const modificationItems = exists(modificationItemsPath) ? read(modificationItemsPath) : '';
  const docs = `${plan}\n${spec}\n${dryRunReport}\n${modificationItems}`;
  const generatedReport = readJson(generatedReportPath);

  addCheck(checks, 'plan.exists', exists(planPath), `${planPath} exists`);
  addCheck(checks, 'spec.exists', exists(specPath), `${specPath} exists`);
  addCheck(checks, 'dry-run-script.exists', exists(dryRunScriptPath), `${dryRunScriptPath} exists`);
  addCheck(checks, 'dry-run-report.exists', exists(dryRunReportPath), `${dryRunReportPath} exists`);
  addCheck(checks, 'modification-items.exists', exists(modificationItemsPath), `${modificationItemsPath} exists`);
  addCheck(checks, 'manifest.exists', exists(fixturePath('mock-manifest.json')), 'mock fixture manifest exists');

  for (const fileName of fixtureFiles) {
    const relativePath = fixturePath(fileName);
    const fileExists = exists(relativePath);
    addCheck(checks, `fixture.${fileName}.exists`, fileExists, `${relativePath} exists`);
    if (!fileExists) continue;

    const text = read(relativePath);
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      addCheck(checks, `fixture.${fileName}.valid-json`, false, `${relativePath} is valid JSON`);
    }

    addCheck(
      checks,
      `fixture.${fileName}.mock-data-only`,
      parsed.mock_data_only === true,
      `${relativePath} contains mock_data_only=true`,
    );
    addCheck(
      checks,
      `fixture.${fileName}.not-for-production`,
      parsed.not_for_production === true,
      `${relativePath} contains not_for_production=true`,
    );
    addCheck(
      checks,
      `fixture.${fileName}.no-credential`,
      !hasForbiddenCredentialText(text),
      `${relativePath} contains no forbidden credential marker`,
    );
    addCheck(
      checks,
      `fixture.${fileName}.no-identity`,
      !hasUnsafeIdentity(text),
      `${relativePath} contains no suspicious identity/passport number`,
    );
    addCheck(
      checks,
      `fixture.${fileName}.no-phone`,
      !hasUnsafePhone(text),
      `${relativePath} contains no suspicious real phone number`,
    );
    addCheck(
      checks,
      `fixture.${fileName}.no-real-files`,
      !hasUnsafeScreenshotOrScan(text),
      `${relativePath} contains no real screenshot or scan path`,
    );
  }

  addCheck(
    checks,
    'generated-report.workflow-mode',
    generatedReport.workflow_mode === 'codex_only',
    'dry-run report contains workflow_mode=codex_only',
  );
  addCheck(
    checks,
    'generated-report.stage',
    generatedReport.stage === 'mock_data_import',
    'dry-run report contains stage=mock_data_import',
  );
  addCheck(
    checks,
    'generated-report.production-ready',
    generatedReport.production_ready === false,
    'dry-run report contains production_ready=false',
  );
  addCheck(
    checks,
    'docs.no-mock-production-en',
    docs.includes('mock data cannot enter production'),
    'docs explain mock data cannot enter production',
  );
  addCheck(
    checks,
    'docs.no-mock-production-zh',
    docs.includes('mock 数据不能进入生产'),
    'docs explain mock 数据不能进入生产',
  );
  addCheck(
    checks,
    'docs.production-init-no-mock',
    docs.includes('production init must not call mock import'),
    'docs explain production init must not call mock import',
  );

  const blockers = checks.filter((check) => !check.passed).map((check) => `${check.id}: ${check.message}`);

  return {
    valid: blockers.length === 0,
    production_ready: false,
    checkedFiles: [
      planPath,
      specPath,
      dryRunScriptPath,
      dryRunReportPath,
      modificationItemsPath,
      generatedReportPath,
      ...fixtureFiles.map(fixturePath),
    ],
    checks,
    blockers,
  };
}

exports.validateMockDataProductionGuard = validateMockDataProductionGuard;

function main(): void {
  const result = validateMockDataProductionGuard();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exit(1);
}

if (require.main === module) {
  main();
}
