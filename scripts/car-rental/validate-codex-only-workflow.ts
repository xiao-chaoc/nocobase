const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../..');
const workflowPath = 'docs/car-rental-codex-only-workflow.md';
const pausedPath = 'docs/car-rental-local-nas-test-paused.md';
const modificationItemsPath = 'docs/car-rental-codex-only-modification-items.md';
const generatorPath = 'scripts/car-rental/generate-codex-only-project-status-report.ts';
const generatedStatusJsonPath = 'test-data/generated/car-rental-codex-only-project-status.generated.json';
const generatedStatusMarkdownPath = 'docs/car-rental-codex-only-project-status.md';
const docsToCheck = [
  workflowPath,
  pausedPath,
  modificationItemsPath,
  'docs/car-rental-project-progress-summary.md',
  'docs/car-rental-pre-release-full-test-roadmap.md',
  'docs/car-rental-isolated-collection-registration-test.md',
  'docs/car-rental-full-test-report-template.md',
  'docs/car-rental-modification-backlog-template.md',
  'docs/car-rental-test-and-production-init-separation.md',
  'docs/car-rental-mock-data-production-guard.md',
  'docs/car-rental-collection-test-db-setup.md',
  'docs/car-rental-real-collection-execute-pr-package.md',
  'docs/car-rental-real-collection-execute-pr-review-checklist.md',
];

interface CheckResult {
  id: string;
  passed: boolean;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  workflow_mode: 'codex_only';
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

function readIfExists(relativePath: string): string {
  return exists(relativePath) ? fs.readFileSync(repoPath(relativePath), 'utf8') : '';
}

function addCheck(checks: CheckResult[], id: string, passed: boolean, message: string): void {
  checks.push({ id, passed, message });
}

function combinedDocs(): string {
  return docsToCheck.map(readIfExists).join('\n');
}

function generateStatusReport(): boolean {
  try {
    childProcess.execFileSync(process.execPath, ['--experimental-strip-types', repoPath(generatorPath)], {
      cwd: rootDir,
      stdio: 'pipe',
    });
    return exists(generatedStatusJsonPath) && exists(generatedStatusMarkdownPath);
  } catch (error: unknown) {
    return false;
  }
}

function validateCodexOnlyWorkflow(): ValidationResult {
  const checks: CheckResult[] = [];
  const docs = combinedDocs();
  const statusGenerated = generateStatusReport();
  const forbiddenCurrentLocalRunPhrases = [
    '用户现在运行测试',
    '要求用户现在本地运行测试',
    '当前必须执行 run-full',
    '现在必须运行 run-full',
  ];

  addCheck(checks, 'docs.workflow.exists', exists(workflowPath), `${workflowPath} exists`);
  addCheck(checks, 'docs.local-nas-paused.exists', exists(pausedPath), `${pausedPath} exists`);
  addCheck(checks, 'docs.modification-items.exists', exists(modificationItemsPath), `${modificationItemsPath} exists`);
  addCheck(checks, 'scripts.generator.exists', exists(generatorPath), `${generatorPath} exists`);
  addCheck(checks, 'docs.local-nas-paused', docs.includes('local NAS paused'), 'docs explain local NAS paused');
  addCheck(
    checks,
    'docs.docker-deleted',
    docs.includes('Docker containers deleted by user'),
    'docs explain user deleted Docker containers',
  );
  addCheck(
    checks,
    'docs.current-local-test-not-required',
    docs.includes('current local test not required'),
    'docs explain current local test is not required',
  );
  addCheck(
    checks,
    'docs.codex-maintains-tests-reports',
    docs.includes('Codex') && docs.includes('维护测试脚本') && docs.includes('报告'),
    'docs explain Codex maintains test scripts and reports',
  );
  addCheck(
    checks,
    'docs.pre-release-reclone',
    docs.includes('正式版前重新 clone') || docs.includes('pre-release local execution'),
    'docs explain pre-release clone/local execution',
  );
  addCheck(
    checks,
    'docs.production-ready-false',
    docs.includes('production_ready=false'),
    'docs explain production_ready=false',
  );
  addCheck(
    checks,
    'docs.no-production-mock-data',
    docs.includes('mock data cannot enter production'),
    'docs explain mock data cannot enter production',
  );
  addCheck(
    checks,
    'docs.run-full-future-only',
    docs.includes('run-full retained for future pre-release execution'),
    'docs explain run-full is retained but not required now',
  );
  addCheck(
    checks,
    'docs.no-current-local-run-requirement',
    !forbiddenCurrentLocalRunPhrases.some((phrase) => docs.includes(phrase)),
    'docs do not require users to run local tests now',
  );
  addCheck(checks, 'status-report.generated', statusGenerated, 'codex-only status report generated successfully');

  const blockers = checks.filter((check) => !check.passed).map((check) => `${check.id}: ${check.message}`);

  return {
    valid: blockers.length === 0,
    workflow_mode: 'codex_only',
    production_ready: false,
    checkedFiles: [...docsToCheck, generatorPath, generatedStatusJsonPath, generatedStatusMarkdownPath].filter(exists),
    checks,
    blockers,
  };
}

exports.validateCodexOnlyWorkflow = validateCodexOnlyWorkflow;

function main(): void {
  const result = validateCodexOnlyWorkflow();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) {
  main();
}
