const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const dryRunScriptPath = 'scripts/car-rental/run-isolated-backup-rollback-rehearsal-test.sh';
const dryRunReportJsonPath = 'test-data/generated/car-rental-backup-rollback-rehearsal-dry-run.generated.json';
const planPath = 'docs/car-rental-backup-rollback-rehearsal-plan.md';
const dryRunReportPath = 'docs/car-rental-backup-rollback-rehearsal-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-backup-rollback-rehearsal-modification-items.md';

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function read(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertExists(relativePath: string): void {
  assert(fs.existsSync(repoPath(relativePath)), `Missing required file: ${relativePath}`);
}

function ensureDryRunReport(): void {
  if (fs.existsSync(repoPath(dryRunReportJsonPath))) return;
  childProcess.execFileSync('bash', [repoPath(dryRunScriptPath)], { cwd: rootDir, stdio: 'inherit' });
}

function assertTextIncludes(relativePath: string, expected: string): void {
  assert(read(relativePath).includes(expected), `${relativePath} must include: ${expected}`);
}

function validateBackupRollbackRehearsalStage(): void {
  assertExists(planPath);
  assertExists(dryRunReportPath);
  assertExists(modificationItemsPath);
  assertExists(dryRunScriptPath);

  ensureDryRunReport();
  assertExists(dryRunReportJsonPath);

  const report = JSON.parse(read(dryRunReportJsonPath));
  assert(report.workflow_mode === 'codex_only', 'dry-run report must include workflow_mode=codex_only');
  assert(report.stage === 'backup_rollback_rehearsal', 'dry-run report must include stage=backup_rollback_rehearsal');
  assert(report.production_ready === false, 'dry-run report must include production_ready=false');
  assert(
    report.local_execution_required_pre_release === true,
    'dry-run report must include local_execution_required_pre_release=true',
  );
  assert(Array.isArray(report.backup_strategy_results), 'dry-run report must include backup_strategy_results');
  assert(Array.isArray(report.restore_strategy_results), 'dry-run report must include restore_strategy_results');
  assert(Array.isArray(report.rollback_scenario_coverage), 'dry-run report must include rollback_scenario_coverage');

  const requiredModificationItems = [
    'backup script exists',
    'restore script exists',
    'backup rejects production database',
    'restore rejects production database',
    'restore requires manual YES',
    'rollback drill document exists',
    'collection registration failure rollback',
    'runtime registration failure rollback',
    'permission initialization failure rollback',
    'page initialization failure rollback',
    'mock data import failure rollback',
    'business smoke failure rollback',
    'contract document failure rollback',
    'GPS mock failure rollback',
    'production_ready remains false',
  ];

  for (const item of requiredModificationItems) {
    assertTextIncludes(modificationItemsPath, item);
  }

  for (const docsPath of [planPath, dryRunReportPath, modificationItemsPath]) {
    assertTextIncludes(docsPath, '当前不要求用户本地运行');
    assertTextIncludes(docsPath, '正式版前才本地执行');
    assertTextIncludes(docsPath, '当前没有有效本地 dump');
    assertTextIncludes(docsPath, 'dump / SQL / filled request 不得提交');
    assertTextIncludes(docsPath, 'production_ready=false');
  }
}

exports.validateBackupRollbackRehearsalStage = validateBackupRollbackRehearsalStage;

function main(): void {
  validateBackupRollbackRehearsalStage();
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        valid: true,
        workflow_mode: 'codex_only',
        stage: 'backup_rollback_rehearsal',
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
