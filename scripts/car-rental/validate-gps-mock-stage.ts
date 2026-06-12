const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const planPath = 'docs/car-rental-gps-mock-test-plan.md';
const reportMarkdownPath = 'docs/car-rental-gps-mock-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-gps-mock-modification-items.md';
const dryRunScriptPath = 'scripts/car-rental/run-isolated-gps-mock-test.sh';
const generatedReportPath = 'test-data/generated/car-rental-gps-mock-dry-run.generated.json';

interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
}

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function exists(relativePath: string): boolean {
  return fs.existsSync(repoPath(relativePath));
}

function readFile(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function addCheck(checks: CheckResult[], name: string, passed: boolean, details: string): void {
  checks.push({ name, passed, details });
}

function ensureGeneratedReport(): void {
  if (exists(generatedReportPath)) return;
  childProcess.execFileSync('bash', [repoPath(dryRunScriptPath)], { cwd: rootDir, stdio: 'pipe' });
}

function loadGeneratedReport(): Record<string, unknown> {
  ensureGeneratedReport();
  return JSON.parse(readFile(generatedReportPath));
}

function main(): void {
  const checks: CheckResult[] = [];

  addCheck(checks, 'plan.exists', exists(planPath), `${planPath} exists`);
  addCheck(checks, 'markdown-report.exists', exists(reportMarkdownPath), `${reportMarkdownPath} exists`);
  addCheck(checks, 'modification-items.exists', exists(modificationItemsPath), `${modificationItemsPath} exists`);
  addCheck(checks, 'dry-run-script.exists', exists(dryRunScriptPath), `${dryRunScriptPath} exists`);

  const report = loadGeneratedReport();
  addCheck(
    checks,
    'json-report.exists',
    exists(generatedReportPath),
    `${generatedReportPath} exists or can be generated`,
  );
  addCheck(
    checks,
    'json.workflow-mode',
    report.workflow_mode === 'codex_only',
    'dry-run report contains workflow_mode=codex_only',
  );
  addCheck(checks, 'json.stage', report.stage === 'gps_mock_test', 'dry-run report contains stage=gps_mock_test');
  addCheck(
    checks,
    'json.production-ready',
    report.production_ready === false,
    'dry-run report contains production_ready=false',
  );
  addCheck(
    checks,
    'json.local-execution-required',
    report.local_execution_required_pre_release === true,
    'dry-run report contains local_execution_required_pre_release=true',
  );
  addCheck(checks, 'json.status-coverage', !!report.gps_status_coverage, 'dry-run report contains gps_status_coverage');
  addCheck(
    checks,
    'json.failure-isolation',
    !!report.failure_isolation_results,
    'dry-run report contains failure_isolation_results',
  );

  const modificationItems = readFile(modificationItemsPath);
  const requiredModificationItems = [
    'GPS mock device',
    'GPS vehicle binding',
    'GPS online status',
    'GPS offline status',
    'GPS fault status',
    'GPS sync failed status',
    'GPS not used for rent calculation',
    'GPS failure does not affect rent ledger',
    'GPS failure does not affect payment allocation',
    'GPS failure does not affect deposit',
    'GPS failure does not affect contract document',
    'IOPGPS_SYNC_ENABLED=false',
    'no IOPGPS token',
    'no login_key',
    'no access_token',
  ];
  for (const item of requiredModificationItems) {
    addCheck(
      checks,
      `modification-items.${item}`,
      modificationItems.includes(item),
      `modification items contain ${item}`,
    );
  }

  const docs = [planPath, reportMarkdownPath, modificationItemsPath].map(readFile).join('\n');
  const requiredDocSnippets = [
    '当前不要求用户本地运行',
    '正式版前才本地执行',
    '不启用真实 IOPGPS',
    'GPS 不参与租金计算',
    'production_ready=false',
  ];
  for (const snippet of requiredDocSnippets) {
    addCheck(checks, `docs.${snippet}`, docs.includes(snippet), `docs include ${snippet}`);
  }

  const failed = checks.filter((check) => !check.passed);
  const result = {
    validated: failed.length === 0,
    workflow_mode: 'codex_only',
    stage: 'gps_mock_test',
    production_ready: false,
    checked_files: [planPath, reportMarkdownPath, modificationItemsPath, dryRunScriptPath, generatedReportPath],
    checks,
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main();
