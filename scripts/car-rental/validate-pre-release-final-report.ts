const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../..');
const requiredStages = [
  'collection',
  'runtime',
  'permission_sensitive_field',
  'page_menu_block',
  'mock_data_import',
  'business_smoke',
  'contract_document',
  'gps_mock',
  'backup_rollback_rehearsal',
  'production_init_guard',
];
const finalJsonPath = 'test-data/generated/car-rental-pre-release-final-report.generated.json';
const files = [
  finalJsonPath,
  'docs/car-rental-pre-release-final-report.md',
  'docs/car-rental-pre-release-remaining-modification-items.md',
  'docs/car-rental-pre-release-risk-register.md',
  'docs/car-rental-pre-release-go-no-go.md',
  'docs/car-rental-uat-prerequisite-checklist.md',
  'docs/car-rental-next-codex-task-package.md',
];
function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}
function assertCheck(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
function read(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}
function validatePreReleaseFinalReport(): void {
  if (!fs.existsSync(repoPath(finalJsonPath))) {
    require('./generate-pre-release-final-report').generatePreReleaseFinalReport();
  }
  for (const file of files) assertCheck(fs.existsSync(repoPath(file)), `${file} missing`);
  const report = JSON.parse(read(finalJsonPath));
  assertCheck(report.workflow_mode === 'codex_only', 'workflow_mode must be codex_only');
  assertCheck(report.target_version === '2.0.61', 'target_version must be 2.0.61');
  assertCheck(report.package_manager === 'yarn', 'package_manager must be yarn');
  assertCheck(report.production_ready === false, 'production_ready must be false');
  assertCheck(report.uat_ready === false, 'uat_ready must be false');
  assertCheck(report.local_pre_release_required === true, 'local_pre_release_required must be true');
  assertCheck(report.mock_data_allowed_in_production === false, 'mock_data_allowed_in_production must be false');
  for (const stage of requiredStages) assertCheck(Boolean(report.stage_summary?.[stage]), `${stage} stage missing`);
  const goNoGo = read('docs/car-rental-pre-release-go-no-go.md');
  assertCheck(goNoGo.includes('Production: No-Go'), 'go/no-go must contain Production: No-Go');
  assertCheck(goNoGo.includes('UAT: No-Go'), 'go/no-go must contain UAT: No-Go');
  assertCheck(
    read('docs/car-rental-pre-release-risk-register.md').includes('production_ready 被误标记'),
    'risk missing production_ready 被误标记',
  );
  assertCheck(
    read('docs/car-rental-pre-release-remaining-modification-items.md').includes('隐私数据导入 guard 尚未完成'),
    'remaining items missing privacy guard',
  );
  assertCheck(
    read('docs/car-rental-next-codex-task-package.md').toLowerCase().includes('privacy data import guard stage'),
    'next task missing privacy data import guard stage',
  );
  const allDocs = files.map(read).join('\n');
  assertCheck(allDocs.includes('当前不要求用户本地运行'), 'docs must say current local run not required');
  assertCheck(allDocs.includes('正式版前才恢复本地/NAS'), 'docs must say local/NAS resumes before release');
  assertCheck(
    allDocs.includes('production_ready 不由 Codex 自动置 true'),
    'docs must say Codex does not auto-set production_ready',
  );
}
exports.validatePreReleaseFinalReport = validatePreReleaseFinalReport;
if (require.main === module) {
  validatePreReleaseFinalReport();
  console.log(JSON.stringify({ validated: true, production_ready: false, uat_ready: false }, null, 2));
}
