const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const planPath = 'docs/car-rental-page-menu-block-initialization-plan.md';
const dryRunReportPath = 'docs/car-rental-page-menu-block-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-page-menu-block-modification-items.md';
const dryRunScriptPath = 'scripts/car-rental/run-isolated-page-menu-block-test.sh';
const dryRunJsonPath = 'test-data/generated/car-rental-page-menu-block-dry-run.generated.json';

interface CheckResult {
  id: string;
  passed: boolean;
  message: string;
}

interface PageMenuBlockStageValidationResult {
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

function validatePageMenuBlockStage(): PageMenuBlockStageValidationResult {
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
    dryRunJson.stage === 'page_menu_block_initialization',
    'dry-run report contains stage=page_menu_block_initialization',
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

  const requiredItems = [
    '车辆管理页面',
    '司机管理页面',
    '合同管理页面',
    '合同创建页面',
    '付款登记页面',
    '付款按日分配页面',
    '押金管理页面',
    '欠款看板页面',
    '当前欠款日历页面',
    '合同文档生成页面',
    'GPS mock 状态页面',
    'IOPGPS 设置页面',
    'operation logs 页面',
    '敏感字段 UI 隐藏规则',
  ];

  for (const item of requiredItems) {
    addCheck(checks, `items.${item}`, modificationItems.includes(item), `modification items contains ${item}`);
  }

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
    'docs.no-mock-production',
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
    checkedFiles: [planPath, dryRunReportPath, modificationItemsPath, dryRunScriptPath, dryRunJsonPath],
    checks,
    blockers,
  };
}

exports.validatePageMenuBlockStage = validatePageMenuBlockStage;

function main(): void {
  const result = validatePageMenuBlockStage();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exit(1);
}

if (require.main === module) {
  main();
}
