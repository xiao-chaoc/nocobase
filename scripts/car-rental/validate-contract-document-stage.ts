const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const dryRunScriptPath = 'scripts/car-rental/run-isolated-contract-document-test.sh';
const dryRunReportJsonPath = 'test-data/generated/car-rental-contract-document-dry-run.generated.json';

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

function validateContractDocumentStage(): void {
  assertExists('docs/car-rental-contract-document-test-plan.md');
  assertExists('docs/car-rental-contract-document-dry-run-report.md');
  assertExists('docs/car-rental-contract-document-modification-items.md');
  assertExists(dryRunScriptPath);

  ensureDryRunReport();
  assertExists(dryRunReportJsonPath);

  const report = JSON.parse(read(dryRunReportJsonPath));
  assert(report.workflow_mode === 'codex_only', 'dry-run report must include workflow_mode=codex_only');
  assert(report.stage === 'contract_document_test', 'dry-run report must include stage=contract_document_test');
  assert(report.production_ready === false, 'dry-run report must include production_ready=false');
  assert(
    report.local_execution_required_pre_release === true,
    'dry-run report must include local_execution_required_pre_release=true',
  );
  assert(report.language_coverage && typeof report.language_coverage === 'object', 'missing language_coverage');
  assert(
    report.contract_field_coverage && typeof report.contract_field_coverage === 'object',
    'missing contract_field_coverage',
  );

  const modificationItemsPath = 'docs/car-rental-contract-document-modification-items.md';
  for (const item of [
    'Chinese contract version',
    'English contract version',
    'French contract version',
    'contract driver binding',
    'contract vehicle binding',
    'deposit clause',
    'natural week rent calculation clause',
    'selected free-rent days clause',
    'offline signing clause',
    'no online payment clause',
    'no driver login clause',
    'signed scan placeholder',
    'no real scan files',
  ]) {
    assertTextIncludes(modificationItemsPath, item);
  }

  for (const docPath of [
    'docs/car-rental-contract-document-test-plan.md',
    'docs/car-rental-contract-document-dry-run-report.md',
    'docs/car-rental-contract-document-modification-items.md',
  ]) {
    assertTextIncludes(docPath, '当前不要求用户本地运行');
    assertTextIncludes(docPath, '正式版前才本地执行');
    assertTextIncludes(docPath, '不启用真实 IOPGPS');
    assertTextIncludes(docPath, 'mock 数据不能进入生产');
    assertTextIncludes(docPath, 'production_ready=false');
  }
}

exports.validateContractDocumentStage = validateContractDocumentStage;

function main(): void {
  validateContractDocumentStage();
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        valid: true,
        workflow_mode: 'codex_only',
        stage: 'contract_document_test',
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
