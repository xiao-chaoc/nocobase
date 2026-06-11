const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const planPath = 'docs/car-rental-permission-sensitive-field-test-plan.md';
const dryRunReportPath = 'docs/car-rental-permission-sensitive-field-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-permission-sensitive-field-modification-items.md';
const dryRunScriptPath = 'scripts/car-rental/run-isolated-permission-sensitive-field-test.sh';
const dryRunJsonPath = 'test-data/generated/car-rental-permission-sensitive-field-dry-run.generated.json';

interface CheckResult {
  id: string;
  passed: boolean;
  message: string;
}

interface PermissionStageValidationResult {
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
  if (exists(dryRunJsonPath)) return;
  if (!exists(dryRunScriptPath)) return;
  childProcess.execFileSync('bash', [repoPath(dryRunScriptPath)], {
    cwd: rootDir,
    stdio: 'pipe',
    env: { ...process.env },
  });
}

function readDryRunJson(): Record<string, unknown> {
  if (!exists(dryRunJsonPath)) return {};
  return JSON.parse(read(dryRunJsonPath));
}

function validatePermissionSensitiveFieldStage(): PermissionStageValidationResult {
  ensureDryRunReport();

  const checks: CheckResult[] = [];
  const plan = exists(planPath) ? read(planPath) : '';
  const dryRunReport = exists(dryRunReportPath) ? read(dryRunReportPath) : '';
  const modificationItems = exists(modificationItemsPath) ? read(modificationItemsPath) : '';
  const dryRunJson = readDryRunJson();
  const combinedDocs = `${plan}\n${dryRunReport}\n${modificationItems}`;

  addCheck(checks, 'plan.exists', exists(planPath), `${planPath} exists`);
  addCheck(checks, 'dry-run-report.exists', exists(dryRunReportPath), `${dryRunReportPath} exists`);
  addCheck(checks, 'modification-items.exists', exists(modificationItemsPath), `${modificationItemsPath} exists`);
  addCheck(checks, 'dry-run-script.exists', exists(dryRunScriptPath), `${dryRunScriptPath} exists`);
  addCheck(
    checks,
    'dry-run-json.exists-or-generated',
    exists(dryRunJsonPath),
    `${dryRunJsonPath} exists or can be generated`,
  );
  addCheck(
    checks,
    'dry-run-json.workflow-mode',
    dryRunJson.workflow_mode === 'codex_only',
    'dry-run report contains workflow_mode=codex_only',
  );
  addCheck(
    checks,
    'dry-run-json.stage',
    dryRunJson.stage === 'permission_sensitive_field',
    'dry-run report contains stage=permission_sensitive_field',
  );
  addCheck(
    checks,
    'dry-run-json.production-ready',
    dryRunJson.production_ready === false,
    'dry-run report contains production_ready=false',
  );
  addCheck(
    checks,
    'dry-run-json.local-execution-required',
    dryRunJson.local_execution_required_pre_release === true,
    'dry-run report contains local_execution_required_pre_release=true',
  );
  addCheck(
    checks,
    'items.total-income-hidden',
    modificationItems.includes('总收入隐藏规则'),
    'modification items contains 总收入隐藏规则',
  );
  addCheck(
    checks,
    'items.future-receivable-hidden',
    modificationItems.includes('未来应收隐藏规则'),
    'modification items contains 未来应收隐藏规则',
  );
  addCheck(
    checks,
    'items.payment-screenshot',
    modificationItems.includes('付款截图访问规则'),
    'modification items contains 付款截图访问规则',
  );
  addCheck(
    checks,
    'items.contract-scan',
    modificationItems.includes('合同扫描件访问规则'),
    'modification items contains 合同扫描件访问规则',
  );
  addCheck(
    checks,
    'items.driver-document',
    modificationItems.includes('司机证件访问规则'),
    'modification items contains 司机证件访问规则',
  );
  addCheck(
    checks,
    'items.iopgps-secret',
    modificationItems.includes('IOPGPS secret 隐藏规则'),
    'modification items contains IOPGPS secret 隐藏规则',
  );
  addCheck(
    checks,
    'items.driver-no-login',
    modificationItems.includes('司机不登录规则'),
    'modification items contains 司机不登录规则',
  );
  addCheck(
    checks,
    'items.customer-portal-disabled',
    modificationItems.includes('customer portal 禁止规则'),
    'modification items contains customer portal 禁止规则',
  );
  addCheck(
    checks,
    'docs.no-current-local-run',
    combinedDocs.includes('当前不要求用户本地运行'),
    'docs explain current local execution is not required',
  );
  addCheck(
    checks,
    'docs.pre-release-local',
    combinedDocs.includes('正式版前才本地执行'),
    'docs explain local execution is pre-release only',
  );
  addCheck(
    checks,
    'docs.no-real-iopgps',
    combinedDocs.includes('不启用真实 IOPGPS'),
    'docs explain real IOPGPS is disabled',
  );
  addCheck(
    checks,
    'docs.mock-not-production',
    combinedDocs.includes('mock 数据不能进入生产'),
    'docs explain mock data cannot enter production',
  );
  addCheck(
    checks,
    'docs.production-ready-false',
    combinedDocs.includes('production_ready=false'),
    'docs explain production_ready=false',
  );

  const blockers = checks.filter((check) => !check.passed).map((check) => `${check.id}: ${check.message}`);

  return {
    valid: blockers.length === 0,
    production_ready: false,
    checkedFiles: [planPath, dryRunReportPath, modificationItemsPath, dryRunScriptPath, dryRunJsonPath].filter(exists),
    checks,
    blockers,
  };
}

exports.validatePermissionSensitiveFieldStage = validatePermissionSensitiveFieldStage;

function main(): void {
  const result = validatePermissionSensitiveFieldStage();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) {
  main();
}
