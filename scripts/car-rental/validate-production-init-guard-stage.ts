const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}
function read(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}
function assertCheck(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const requiredFiles = [
  'docs/car-rental-production-init-guard-plan.md',
  'docs/car-rental-production-deployment-boundary.md',
  'docs/car-rental-production-init-guard-dry-run-report.md',
  'docs/car-rental-production-init-guard-modification-items.md',
  'scripts/car-rental/run-production-init-guard-dry-run.sh',
  'scripts/car-rental/validate-production-no-mock-guard.ts',
  '.env.car-rental-production.example',
];
for (const file of requiredFiles) assertCheck(fs.existsSync(repoPath(file)), `${file} missing`);

const reportPath = 'test-data/generated/car-rental-production-init-guard-dry-run.generated.json';
if (!fs.existsSync(repoPath(reportPath))) {
  childProcess.execFileSync('bash', [repoPath('scripts/car-rental/run-production-init-guard-dry-run.sh')], {
    cwd: rootDir,
    stdio: 'inherit',
  });
}
const report = JSON.parse(read(reportPath));
assertCheck(report.workflow_mode === 'codex_only', 'workflow_mode must be codex_only');
assertCheck(report.stage === 'production_init_guard', 'stage must be production_init_guard');
assertCheck(report.production_ready === false, 'production_ready must be false');
assertCheck(report.local_execution_required_pre_release === true, 'local execution required flag missing');
for (const key of ['mock_data_guard_results', 'privacy_data_guard_results', 'iopgps_guard_results'])
  assertCheck(Boolean(report[key]), `${key} missing`);

const modificationItems = read('docs/car-rental-production-init-guard-modification-items.md');
for (const phrase of [
  'production env example exists',
  'production DB name does not contain test/mock/demo/sample',
  'CAR_RENTAL_MOCK_DATA_ONLY=false',
  'CAR_RENTAL_IMPORT_MOCK_DATA=false',
  'IOPGPS_SYNC_ENABLED=false',
  'production does not import mock data',
  'production does not reuse test storage',
  'production does not reuse test PostgreSQL volume',
  'production_ready remains false',
  'UAT required before production_ready',
])
  assertCheck(modificationItems.includes(phrase), `modification items missing ${phrase}`);

const docs = [
  'docs/car-rental-production-init-guard-plan.md',
  'docs/car-rental-production-deployment-boundary.md',
  'docs/car-rental-production-init-guard-dry-run-report.md',
]
  .map(read)
  .join('\n');
for (const phrase of [
  '当前不要求用户本地运行',
  '正式版前才本地执行',
  '生产不得导入 mock 数据',
  'production_ready=false',
])
  assertCheck(docs.includes(phrase), `docs missing ${phrase}`);
console.log(JSON.stringify({ validated: true, stage: 'production_init_guard', production_ready: false }, null, 2));
