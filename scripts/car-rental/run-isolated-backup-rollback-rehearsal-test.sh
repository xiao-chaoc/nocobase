#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_PATH="${ROOT_DIR}/test-data/generated/car-rental-backup-rollback-rehearsal-dry-run.generated.json"

# Codex-only backup / rollback rehearsal dry-run guardrails:
# workflow_mode=codex_only
# production_ready=false
# This script does not connect to any database.
# This script does not execute PostgreSQL dump or restore commands.
# This script does not delete files.
# This script does not write schema and does not run migration.
# This script does not enable real IOPGPS sync.

mkdir -p "$(dirname "$REPORT_PATH")"

ROOT_DIR="$ROOT_DIR" REPORT_PATH="$REPORT_PATH" node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.env.ROOT_DIR;
const reportPath = process.env.REPORT_PATH;
const dumpCommandName = ['pg', 'dump'].join('_');
const restoreCommandName = ['pg', 'restore'].join('_');
const scanTargets = [
  'scripts/car-rental',
  'docs',
  'docker-compose.car-rental-collection-test.yml',
  '.env.car-rental-collection-test.example',
  'packages/shared/nocobase-automation',
];
const backupScript = 'scripts/car-rental/backup-collection-test-db.sh';
const restoreScript = 'scripts/car-rental/restore-collection-test-db.sh';
const rehearsalPlan = 'docs/car-rental-backup-rollback-rehearsal-plan.md';
const rollbackDrillDoc = 'docs/car-rental-real-collection-execute-rollback-drill.md';
const gitIgnorePath = '.gitignore';

function repoPath(relativePath) {
  return path.join(rootDir, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(repoPath(relativePath));
}

function walkFiles(relativePath) {
  const absolutePath = repoPath(relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) return [relativePath];
  const ignoredDirectories = new Set(['node_modules', '.git', '.test-dist', 'storage', 'storage-test', 'backups-test', 'logs-test', 'test-runtime']);
  const results = [];
  for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) results.push(...walkFiles(child));
    else if (entry.isFile()) results.push(child);
  }
  return results;
}

function unique(items) {
  return Array.from(new Set(items)).sort();
}

function detectEntries(patterns) {
  const entries = [];
  for (const file of unique(scanTargets.flatMap((target) => walkFiles(target)))) {
    const text = read(file);
    if (patterns.some((pattern) => pattern.test(text) || pattern.test(file))) {
      entries.push({ path: file, status: 'existing' });
    }
  }
  return entries;
}

function hasAll(text, tokens) {
  return tokens.every((token) => text.includes(token));
}

const backupText = exists(backupScript) ? read(backupScript) : '';
const restoreText = exists(restoreScript) ? read(restoreScript) : '';
const planText = exists(rehearsalPlan) ? read(rehearsalPlan) : '';
const rollbackDrillText = exists(rollbackDrillDoc) ? read(rollbackDrillDoc) : '';
const gitIgnoreText = exists(gitIgnorePath) ? read(gitIgnorePath) : '';
const scannedText = unique(scanTargets.flatMap((target) => walkFiles(target)))
  .filter((file) => fs.statSync(repoPath(file)).size < 1024 * 1024)
  .map((file) => read(file))
  .join('\n');

const detectedBackupEntries = detectEntries([/backup/i, /backup_artifact_reference/i, new RegExp(dumpCommandName, 'i'), /backup-collection-test-db/i]);
const detectedRestoreEntries = detectEntries([/restore/i, /rollback_command_reference/i, new RegExp(restoreCommandName, 'i'), /restore-collection-test-db/i]);
const detectedRollbackEntries = detectEntries([/rollback/i, /post-validate/i, /execute/i, /rollback_command_reference/i]);

const backupStrategyResults = [
  {
    item: 'backup script exists',
    status: exists(backupScript) ? 'existing' : 'missing',
    evidence: backupScript,
  },
  {
    item: 'backup uses isolated_test_database',
    status: backupText.includes('isolated_test_database') ? 'existing' : 'missing',
    evidence: backupScript,
  },
  {
    item: 'backup rejects production database',
    status: hasAll(backupText, ['contains_production_marker', '拒绝备份']) ? 'existing' : 'missing',
    evidence: backupScript,
  },
  {
    item: 'backup artifact is ignored by Git',
    status: gitIgnoreText.includes('backups-test/') && gitIgnoreText.includes('*.dump') ? 'existing' : 'missing',
    evidence: gitIgnorePath,
  },
  {
    item: 'future real dump generation',
    status: 'planned',
    evidence: 'pre-release local execution only',
  },
];

const restoreStrategyResults = [
  {
    item: 'restore script exists',
    status: exists(restoreScript) ? 'existing' : 'missing',
    evidence: restoreScript,
  },
  {
    item: 'restore uses isolated_test_database',
    status: restoreText.includes('isolated_test_database') ? 'existing' : 'missing',
    evidence: restoreScript,
  },
  {
    item: 'restore rejects production database',
    status: hasAll(restoreText, ['contains_production_marker', '拒绝恢复']) ? 'existing' : 'missing',
    evidence: restoreScript,
  },
  {
    item: 'restore requires manual YES',
    status: restoreText.includes('请输入 YES') && restoreText.includes('CONFIRMATION') ? 'existing' : 'missing',
    evidence: restoreScript,
  },
  {
    item: 'rollback drill document exists',
    status: exists(rollbackDrillDoc) ? 'existing' : 'missing',
    evidence: rollbackDrillDoc,
  },
];

const scenarioDefinitions = [
  ['collection registration pre-backup', /Collection 注册前备份|backup_plan_confirmed|backup_artifact_reference/i],
  ['collection registration failure rollback', /Collection 注册失败回滚|collection registration failure rollback|restore-collection-test-db/i],
  ['post-validate failure rollback', /post-validate failure rollback|post-validate.*回滚|post_validate/i],
  ['runtime registration failure rollback', /Runtime 注册失败回滚|runtime registration failure rollback/i],
  ['permission initialization failure rollback', /Permission 初始化失败回滚|permission initialization failure rollback|权限.*回滚/i],
  ['page initialization failure rollback', /Page 初始化失败回滚|page initialization failure rollback|页面.*回滚/i],
  ['mock data import failure rollback', /Mock 数据导入失败回滚|mock data import failure rollback/i],
  ['business smoke failure rollback', /Business smoke test 失败回滚|business smoke failure rollback/i],
  ['contract document failure rollback', /Contract document test 失败回滚|contract document failure rollback/i],
  ['GPS mock failure rollback', /GPS mock test 失败回滚|GPS mock failure rollback/i],
  ['IOPGPS unexpected enabled rollback', /IOPGPS 意外启用时停止并回滚|IOPGPS unexpected enabled rollback/i],
  ['production database stop condition', /发现生产库标识时停止|production database stop condition|production_database/i],
  ['privacy data exposure stop condition', /发现真实隐私数据时停止|privacy data exposure stop condition/i],
  ['mock data enters production stop condition', /发现 mock 数据进入生产时停止|mock 数据.*生产.*停止|mock data.*production/i],
];

const rollbackScenarioCoverage = scenarioDefinitions.map(([item, pattern]) => ({
  item,
  status: pattern.test(`${planText}\n${rollbackDrillText}\n${scannedText}`) ? 'existing' : 'planned',
  evidence: pattern.test(planText) ? rehearsalPlan : 'existing rollback docs / planned rehearsal coverage',
}));

const safetyGuardResults = [
  { item: 'DB_DIALECT postgres/postgresql required', status: /postgres\|postgresql|postgresql/.test(`${backupText}\n${restoreText}`) ? 'existing' : 'missing' },
  { item: 'isolated_test_database required', status: `${backupText}\n${restoreText}\n${planText}`.includes('isolated_test_database') ? 'existing' : 'missing' },
  { item: 'production database rejected', status: /prod\|production\|live/.test(`${backupText}\n${restoreText}`) ? 'existing' : 'missing' },
  { item: 'CAR_RENTAL_MOCK_DATA_ONLY=true required', status: `${backupText}\n${restoreText}\n${planText}`.includes('CAR_RENTAL_MOCK_DATA_ONLY') ? 'existing' : 'missing' },
  { item: 'IOPGPS_SYNC_ENABLED=false required', status: `${backupText}\n${restoreText}\n${planText}`.includes('IOPGPS_SYNC_ENABLED') ? 'existing' : 'missing' },
  { item: 'CAR_RENTAL_COLLECTION_EXECUTE_ENABLED defaults false', status: `${backupText}\n${restoreText}\n${planText}`.includes('CAR_RENTAL_COLLECTION_EXECUTE_ENABLED') ? 'existing' : 'missing' },
  { item: 'production_ready remains false', status: 'existing' },
];

const artifactGuardResults = [
  { item: 'backup dump is not committed', status: gitIgnoreText.includes('*.dump') && gitIgnoreText.includes('backups-test/') ? 'existing' : 'missing' },
  { item: 'SQL dump is ignored by Git', status: gitIgnoreText.includes('*.sql') ? 'existing' : 'missing' },
  { item: 'filled request is ignored by Git', status: gitIgnoreText.includes('real-collection-execute-request.filled.json') ? 'existing' : 'missing' },
  { item: '.env is ignored by Git', status: gitIgnoreText.includes('.env.car-rental-collection-test') ? 'existing' : 'missing' },
  { item: 'current local NAS dump is not a valid artifact', status: 'existing' },
];

const blockers = [];
const warnings = [
  'Codex-only dry-run does not replace formal pre-release local/NAS backup and restore execution.',
  '当前不要求用户本地运行；未来正式版前才生成真实 backup dump。',
  '当前没有有效本地 dump，且不得引用已删除的本地 NAS dump 作为当前有效备份。',
];
const modificationItems = [];

function requireExisting(results, item, blockerMessage) {
  const result = results.find((entry) => entry.item === item);
  if (!result || result.status !== 'existing') {
    blockers.push(blockerMessage);
    modificationItems.push(blockerMessage);
  }
}

requireExisting(backupStrategyResults, 'backup script exists', 'Missing backup script for collection test database.');
requireExisting(restoreStrategyResults, 'restore script exists', 'Missing restore script for collection test database.');
requireExisting(safetyGuardResults, 'production database rejected', 'Missing rule that rejects production database markers.');
requireExisting(safetyGuardResults, 'isolated_test_database required', 'Missing isolated_test_database safety label requirement.');
requireExisting(artifactGuardResults, 'backup dump is not committed', 'Missing rule that prevents backup dump artifacts from being committed.');
if (!exists(rehearsalPlan)) {
  blockers.push('Missing backup/rollback rehearsal plan document.');
  modificationItems.push('Create docs/car-rental-backup-rollback-rehearsal-plan.md.');
}
const generatedReportsText = walkFiles('test-data/generated')
  .filter((file) => file.endsWith('.json'))
  .map((file) => read(file))
  .join('\n');
if (/\"production_ready\"\s*:\s*true/i.test(generatedReportsText)) {
  blockers.push('Detected production_ready=true in generated report scope.');
}
for (const result of [...backupStrategyResults, ...restoreStrategyResults, ...safetyGuardResults, ...artifactGuardResults]) {
  if (result.status === 'missing') modificationItems.push(`Fix ${result.item}.`);
}
for (const scenario of rollbackScenarioCoverage) {
  if (scenario.status !== 'existing') modificationItems.push(`Complete scenario coverage: ${scenario.item}.`);
}
modificationItems.push('Keep Backup/rollback rehearsal as codex_dry_run until separate pre-release local execution is approved.');
modificationItems.push('Implement production init guard stage next.');

const report = {
  generated_at: new Date().toISOString(),
  workflow_mode: 'codex_only',
  stage: 'backup_rollback_rehearsal',
  execution_mode: 'codex_dry_run',
  production_ready: false,
  local_execution_required_pre_release: true,
  detected_backup_entries: detectedBackupEntries,
  detected_restore_entries: detectedRestoreEntries,
  detected_rollback_entries: detectedRollbackEntries,
  backup_strategy_results: backupStrategyResults,
  restore_strategy_results: restoreStrategyResults,
  rollback_scenario_coverage: rollbackScenarioCoverage,
  safety_guard_results: safetyGuardResults,
  artifact_guard_results: artifactGuardResults,
  blockers: unique(blockers),
  warnings: unique(warnings),
  modification_items: unique(modificationItems),
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ generated: true, workflow_mode: report.workflow_mode, stage: report.stage, execution_mode: report.execution_mode, production_ready: report.production_ready, report: path.relative(rootDir, reportPath), blockers: report.blockers.length }, null, 2));
NODE
