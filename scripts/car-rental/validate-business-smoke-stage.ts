const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const dryRunScriptPath = 'scripts/car-rental/run-isolated-business-smoke-test.sh';
const dryRunReportJsonPath = 'test-data/generated/car-rental-business-smoke-dry-run.generated.json';

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function read(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExists(relativePath: string): void {
  assert(fs.existsSync(repoPath(relativePath)), `Missing required file: ${relativePath}`);
}

function ensureDryRunReport(): void {
  if (fs.existsSync(repoPath(dryRunReportJsonPath))) {
    return;
  }
  childProcess.execFileSync('bash', [repoPath(dryRunScriptPath)], {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

function assertTextIncludes(relativePath: string, expected: string): void {
  assert(read(relativePath).includes(expected), `${relativePath} must include: ${expected}`);
}

function validateBusinessSmokeStage(): void {
  assertExists('docs/car-rental-business-smoke-test-plan.md');
  assertExists('docs/car-rental-business-smoke-dry-run-report.md');
  assertExists('docs/car-rental-business-smoke-modification-items.md');
  assertExists(dryRunScriptPath);

  ensureDryRunReport();
  assertExists(dryRunReportJsonPath);

  const report = JSON.parse(read(dryRunReportJsonPath));
  assert(report.workflow_mode === 'codex_only', 'dry-run report must include workflow_mode=codex_only');
  assert(report.stage === 'business_smoke_test', 'dry-run report must include stage=business_smoke_test');
  assert(report.production_ready === false, 'dry-run report must include production_ready=false');
  assert(
    report.local_execution_required_pre_release === true,
    'dry-run report must include local_execution_required_pre_release=true',
  );
  assert(Array.isArray(report.business_rule_results), 'dry-run report must include business_rule_results');
  assert(Array.isArray(report.financial_rule_results), 'dry-run report must include financial_rule_results');

  const modificationItemsPath = 'docs/car-rental-business-smoke-modification-items.md';
  const requiredItems = [
    'driver no login',
    'vehicle plate required',
    'contract driver binding',
    'contract vehicle binding',
    'deposit required',
    'natural week rent calculation',
    'payment allocation by date',
    'no overpay per day',
    'unpaid reason',
    'current arrears excludes future receivables',
    'deposit not counted as rent income',
    'GPS not used for rent calculation',
    'IOPGPS real sync disabled',
  ];

  for (const item of requiredItems) {
    assertTextIncludes(modificationItemsPath, item);
  }

  for (const docsPath of [
    'docs/car-rental-business-smoke-test-plan.md',
    'docs/car-rental-business-smoke-dry-run-report.md',
    'docs/car-rental-business-smoke-modification-items.md',
  ]) {
    assertTextIncludes(docsPath, '当前不要求用户本地运行');
    assertTextIncludes(docsPath, '正式版前才本地执行');
    assertTextIncludes(docsPath, '不启用真实 IOPGPS');
    assertTextIncludes(docsPath, 'mock 数据不得进入生产');
    assertTextIncludes(docsPath, 'production_ready=false');
  }
}

exports.validateBusinessSmokeStage = validateBusinessSmokeStage;

function main(): void {
  validateBusinessSmokeStage();
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        valid: true,
        workflow_mode: 'codex_only',
        stage: 'business_smoke_test',
        production_ready: false,
        report: dryRunReportJsonPath,
      },
      null,
      2,
    ),
  );
}

if (require.main === module) {
  main();
}
