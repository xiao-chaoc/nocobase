const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../..');
const runFullPath = 'scripts/car-rental/run-full-isolated-system-test.sh';
const progressPath = 'docs/car-rental-project-progress-summary.md';
const roadmapPath = 'docs/car-rental-pre-release-full-test-roadmap.md';
const reportTemplatePath = 'docs/car-rental-full-test-report-template.md';
const backlogTemplatePath = 'docs/car-rental-modification-backlog-template.md';
const initSeparationPath = 'docs/car-rental-test-and-production-init-separation.md';
const mockGuardPath = 'docs/car-rental-mock-data-production-guard.md';

interface CheckResult {
  id: string;
  passed: boolean;
  message: string;
}

interface ValidationResult {
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

function validateFullIsolatedTestSystem(): ValidationResult {
  const checks: CheckResult[] = [];
  const runFull = exists(runFullPath) ? read(runFullPath) : '';
  const progress = exists(progressPath) ? read(progressPath) : '';
  const initSeparation = exists(initSeparationPath) ? read(initSeparationPath) : '';
  const mockGuard = exists(mockGuardPath) ? read(mockGuardPath) : '';

  addCheck(checks, 'run-full.exists', exists(runFullPath), `${runFullPath} exists`);
  addCheck(checks, 'docs.progress.exists', exists(progressPath), `${progressPath} exists`);
  addCheck(checks, 'docs.roadmap.exists', exists(roadmapPath), `${roadmapPath} exists`);
  addCheck(checks, 'docs.report-template.exists', exists(reportTemplatePath), `${reportTemplatePath} exists`);
  addCheck(checks, 'docs.backlog-template.exists', exists(backlogTemplatePath), `${backlogTemplatePath} exists`);
  addCheck(checks, 'docs.init-separation.exists', exists(initSeparationPath), `${initSeparationPath} exists`);
  addCheck(checks, 'docs.mock-guard.exists', exists(mockGuardPath), `${mockGuardPath} exists`);
  addCheck(
    checks,
    'run-full.collection-runner',
    runFull.includes('scripts/car-rental/run-isolated-collection-registration-test.sh'),
    'run-full calls collection runner',
  );
  addCheck(
    checks,
    'run-full.production-ready-false',
    runFull.includes('PRODUCTION_READY=false') && runFull.includes('production_ready'),
    'run-full contains production_ready=false',
  );
  addCheck(
    checks,
    'run-full.skipped-mechanism',
    runFull.includes('record_skipped') && runFull.includes('skipped'),
    'run-full contains skipped stage mechanism',
  );
  addCheck(
    checks,
    'run-full.no-db-secret-output',
    !runFull.includes('DB_PASSWORD'),
    'run-full does not output DB_PASSWORD',
  );
  addCheck(checks, 'run-full.no-app-key-output', !runFull.includes('APP_KEY'), 'run-full does not output APP_KEY');
  addCheck(
    checks,
    'run-full.no-iopgps-key-output',
    !runFull.includes('IOPGPS_LOGIN_KEY'),
    'run-full does not output IOPGPS_LOGIN_KEY',
  );
  addCheck(
    checks,
    'docs.postgres-only-docker-normal',
    progress.includes('只有 PostgreSQL 容器是正常现象'),
    'progress summary explains PostgreSQL-only Docker state',
  );
  addCheck(
    checks,
    'docs.test-data-not-automatic-production',
    initSeparation.includes('不会自动带 PostgreSQL 测试数据') &&
      initSeparation.includes('只有复用测试 volume / storage / dump / env 才会带入测试数据'),
    'init separation explains test data does not automatically enter production',
  );
  addCheck(
    checks,
    'docs.production-reclone-new-dir',
    initSeparation.includes('重新 clone') && initSeparation.includes('新目录'),
    'init separation explains production should re-clone and use a new directory',
  );
  addCheck(
    checks,
    'docs.no-production-mock-data',
    mockGuard.includes('生产脚本不得调用 mock import') && mockGuard.includes('生产脚本不得导入 mock 数据'),
    'mock guard explains production must not import mock data',
  );

  const blockers = checks.filter((check) => !check.passed).map((check) => `${check.id}: ${check.message}`);

  return {
    valid: blockers.length === 0,
    production_ready: false,
    checkedFiles: [
      runFullPath,
      progressPath,
      roadmapPath,
      reportTemplatePath,
      backlogTemplatePath,
      initSeparationPath,
      mockGuardPath,
    ].filter(exists),
    checks,
    blockers,
  };
}

exports.validateFullIsolatedTestSystem = validateFullIsolatedTestSystem;

function main(): void {
  const result = validateFullIsolatedTestSystem();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) {
  main();
}
