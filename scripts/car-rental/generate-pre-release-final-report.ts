const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../..');
const outputJsonPath = 'test-data/generated/car-rental-pre-release-final-report.generated.json';
const outputMarkdownPath = 'docs/car-rental-pre-release-final-report.md';
const stageDefinitions = [
  [
    'collection',
    'Collection registration / execute preparation',
    'test-data/generated/isolated-collection-registration-test-report.generated.json',
  ],
  [
    'runtime',
    'Runtime / service / action registration stage',
    'test-data/generated/car-rental-runtime-registration-dry-run.generated.json',
  ],
  [
    'permission_sensitive_field',
    'Permission / sensitive field stage',
    'test-data/generated/car-rental-permission-sensitive-field-dry-run.generated.json',
  ],
  [
    'page_menu_block',
    'Page / menu / block initialization stage',
    'test-data/generated/car-rental-page-menu-block-dry-run.generated.json',
  ],
  [
    'mock_data_import',
    'Mock data import stage',
    'test-data/generated/car-rental-mock-data-import-dry-run.generated.json',
  ],
  [
    'business_smoke',
    'Business smoke test stage',
    'test-data/generated/car-rental-business-smoke-dry-run.generated.json',
  ],
  [
    'contract_document',
    'Contract document test stage',
    'test-data/generated/car-rental-contract-document-dry-run.generated.json',
  ],
  ['gps_mock', 'GPS mock test stage', 'test-data/generated/car-rental-gps-mock-dry-run.generated.json'],
  [
    'backup_rollback_rehearsal',
    'Backup / rollback rehearsal stage',
    'test-data/generated/car-rental-backup-rollback-rehearsal-dry-run.generated.json',
  ],
  [
    'production_init_guard',
    'Production init guard stage',
    'test-data/generated/car-rental-production-init-guard-dry-run.generated.json',
  ],
];
const statusReportPath = 'test-data/generated/car-rental-codex-only-project-status.generated.json';
const modificationDocuments = [
  'docs/car-rental-runtime-modification-items.md',
  'docs/car-rental-permission-sensitive-field-modification-items.md',
  'docs/car-rental-page-menu-block-modification-items.md',
  'docs/car-rental-mock-data-import-modification-items.md',
  'docs/car-rental-business-smoke-modification-items.md',
  'docs/car-rental-contract-document-modification-items.md',
  'docs/car-rental-gps-mock-modification-items.md',
  'docs/car-rental-backup-rollback-rehearsal-modification-items.md',
  'docs/car-rental-production-init-guard-modification-items.md',
  'docs/car-rental-codex-only-modification-items.md',
];
function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}
function readJson(relativePath: string) {
  try {
    return JSON.parse(fs.readFileSync(repoPath(relativePath), 'utf8'));
  } catch {
    return undefined;
  }
}
function uniq(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}
function documentExcerpt(relativePath: string) {
  if (!fs.existsSync(repoPath(relativePath)))
    return { source: relativePath, status: 'missing', items: [`Missing modification item document: ${relativePath}`] };
  const items = fs
    .readFileSync(repoPath(relativePath), 'utf8')
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter((line: string) => line.startsWith('-') || line.startsWith('*') || line.startsWith('|'))
    .slice(0, 20);
  return { source: relativePath, status: 'available', items };
}
const riskSeeds = [
  ['R-001', 'NocoBase 真实 API 与 dry-run 假设不一致', 'collection', 'high'],
  ['R-002', 'Collection 真实注册失败', 'collection', 'high'],
  ['R-003', 'Runtime 服务 / 动作无法真实注册', 'runtime', 'high'],
  ['R-004', '权限字段隐藏不生效', 'permission_sensitive_field', 'critical'],
  ['R-005', '敏感字段泄露', 'permission_sensitive_field', 'critical'],
  ['R-006', '页面 UI schema 不兼容', 'page_menu_block', 'medium'],
  ['R-007', 'mock 数据被误导入生产', 'mock_data_import', 'critical'],
  ['R-008', '付款单日超付校验失效', 'business_smoke', 'high'],
  ['R-009', '押金误计入租金收入', 'business_smoke', 'high'],
  ['R-010', '当前欠款错误包含未来应收', 'business_smoke', 'high'],
  ['R-011', '合同文件三语内容不一致', 'contract_document', 'medium'],
  ['R-012', '真实合同扫描件误提交', 'contract_document', 'critical'],
  ['R-013', 'IOPGPS 被误启用', 'gps_mock', 'critical'],
  ['R-014', 'GPS 数据参与租金计算', 'gps_mock', 'high'],
  ['R-015', 'GPS 失败影响租金台账', 'gps_mock', 'high'],
  ['R-016', '备份失败', 'backup_rollback_rehearsal', 'critical'],
  ['R-017', '回滚失败', 'backup_rollback_rehearsal', 'critical'],
  ['R-018', '生产复用测试 volume / storage / dump / env', 'production_init_guard', 'critical'],
  ['R-019', '生产初始化导入 mock 数据', 'production_init_guard', 'critical'],
  ['R-020', '隐私数据导入流程缺失', 'privacy_data_import_guard', 'critical'],
  ['R-021', 'UAT 未执行', 'uat', 'critical'],
  ['R-022', 'production_ready 被误标记', 'final_aggregation', 'critical'],
];
const riskRegister = riskSeeds.map(([id, description, source, severity]) => ({
  id,
  description,
  source,
  severity,
  trigger: '正式版前真实执行、UAT 或生产初始化未按 guard 执行。',
  impact: '可能阻塞 UAT 或生产，或造成数据、权限、合同、GPS、备份回滚风险。',
  mitigation:
    '保持 production_ready=false；完成本地/NAS pre-release 真实执行、UAT、runbook、隐私数据 guard 和人工确认。',
  blocks_uat: true,
  blocks_production: true,
  status: 'open',
}));
function buildReport() {
  const stages = [];
  const missingReports: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];
  for (const [id, name, reportPath] of stageDefinitions) {
    const report = readJson(reportPath);
    if (!report) {
      missingReports.push(reportPath);
      blockers.push(`Missing report for ${name}: ${reportPath}`);
      stages.push({
        id,
        name,
        report_path: reportPath,
        status: 'missing_report',
        production_ready: false,
        local_execution_required_pre_release: true,
      });
      continue;
    }
    stages.push({
      id,
      name,
      report_path: reportPath,
      status: report.execution_mode || report.status || 'available',
      stage: report.stage,
      production_ready: false,
      local_execution_required_pre_release: report.local_execution_required_pre_release !== false,
      blocker_count: (report.blockers || []).length,
      warning_count: (report.warnings || []).length,
      modification_item_count: (report.modification_items || []).length,
    });
    blockers.push(...(report.blockers || []).map((item: string) => `${id}: ${item}`));
    warnings.push(...(report.warnings || []).map((item: string) => `${id}: ${item}`));
  }
  if (!readJson(statusReportPath)) {
    missingReports.push(statusReportPath);
    blockers.push(`Missing report: ${statusReportPath}`);
  }
  const stageSummary = Object.fromEntries(
    stages.map((stage: any) => [
      stage.id,
      {
        status: stage.status,
        report_path: stage.report_path,
        local_execution_required_pre_release: stage.local_execution_required_pre_release,
        production_ready: false,
      },
    ]),
  );
  return {
    generated_at: new Date().toISOString(),
    workflow_mode: 'codex_only',
    target_version: '2.0.61',
    package_manager: 'yarn',
    local_nas_test_status: 'paused',
    local_docker_status: 'deleted_by_user',
    production_ready: false,
    uat_ready: false,
    local_pre_release_required: true,
    privacy_data_local_required: true,
    mock_data_allowed_in_production: false,
    stages,
    stage_summary: stageSummary,
    missing_reports: missingReports,
    blockers: uniq(
      blockers.concat([
        '本地/NAS pre-release 真实执行尚未完成。',
        'UAT checklist 尚未完成。',
        'Privacy data import guard 尚未完成。',
        'Production deployment runbook 尚未完成。',
      ]),
    ),
    warnings: uniq(
      warnings.concat([
        '当前不要求用户本地运行；正式版前才恢复本地/NAS。',
        '真实 IOPGPS 默认仍应禁用。',
        'mock 数据不得进入生产。',
      ]),
    ),
    modification_items: modificationDocuments.map(documentExcerpt),
    risk_register: riskRegister,
    go_no_go_decision: {
      codex_dry_run_status: missingReports.length === 0 ? 'codex_dry_run_complete' : 'partial_complete',
      uat_ready: false,
      production_ready: false,
      uat: 'No-Go',
      production: 'No-Go',
      reason:
        '尚未完成本地/NAS pre-release 真实执行、UAT、真实权限验证、备份回滚实操、隐私数据导入流程和生产部署 runbook；production_ready 不由 Codex 自动置 true。',
    },
    next_codex_tasks: [
      'Implement privacy data import guard stage.',
      'Implement production deployment runbook stage.',
      'Finalize UAT checklist stage.',
      'Prepare pre-release local execution recovery package.',
      'Implement real local/NAS pre-release report ingestion stage.',
    ],
    next_user_actions: [
      '当前不要求用户本地运行。',
      '正式版前在新 clone、新目录、新 env、新 DB volume、新 storage 中恢复本地/NAS 执行。',
      '人工确认真实隐私数据导入、真实 IOPGPS 启用和 production_ready。',
    ],
    required_before_uat: [
      'Collection 真实注册通过',
      'Runtime 真实注册通过',
      '权限真实验证通过',
      '页面真实初始化通过',
      'mock 数据导入测试通过',
      'business smoke test 通过',
      'contract document test 通过',
      'GPS mock test 通过',
      'backup rollback rehearsal 通过',
      'production init guard 通过',
      '隐私数据导入 guard 通过',
      '生产部署 runbook 通过',
    ],
    required_before_production: [
      'UAT checklist 通过',
      '生产部署 runbook 完成',
      '生产初始化 guard 通过',
      '隐私数据导入 guard 通过',
      '备份回滚实操通过',
      'production_ready 由人工确认，Codex 不自动置 production_ready=true',
    ],
  };
}
function writeMarkdown(report: any): void {
  const stageRows = report.stages
    .map(
      (stage: any) =>
        `| ${stage.id} | ${stage.name} | ${stage.status} | ${stage.report_path} | ${stage.local_execution_required_pre_release} | false |`,
    )
    .join('\n');
  const riskRows = report.risk_register
    .map((risk: any) => `| ${risk.id} | ${risk.description} | ${risk.source} | ${risk.severity} | ${risk.status} |`)
    .join('\n');
  const markdown = `# Car Rental Pre-release Final Report

## 当前总体状态

- workflow_mode: codex_only
- target_version: 2.0.61
- package_manager: yarn
- local_nas_test_status: paused
- local_docker_status: deleted_by_user
- production_ready: false
- uat_ready: false
- 当前不要求用户本地运行；正式版前才恢复本地/NAS pre-release 真实执行。

## 已完成 Codex-only dry-run 阶段

${report.stages.map((stage: any) => `- ${stage.name}: ${stage.status}`).join('\n')}

## 未完成真实执行阶段

Collection / Runtime / Permission / Page / Mock import / Smoke / Contract / GPS / Backup rollback / Production init guard 均尚未完成本地/NAS pre-release 真实执行。

## 每阶段结果表

| 阶段 | 名称 | 状态 | 报告 | 需要真实执行 | production_ready |
| --- | --- | --- | --- | --- | --- |
${stageRows}

## Blockers 汇总

${report.blockers.map((item: string) => `- ${item}`).join('\n')}

## Warnings 汇总

${report.warnings.map((item: string) => `- ${item}`).join('\n')}

## 修改项汇总

详见 docs/car-rental-pre-release-remaining-modification-items.md。

## 风险清单

| 风险编号 | 风险描述 | 来源阶段 | 严重程度 | 当前状态 |
| --- | --- | --- | --- | --- |
${riskRows}

## Go / No-Go 判定

- Codex-only dry-run: ${report.go_no_go_decision.codex_dry_run_status}
- UAT: No-Go
- Production: No-Go

## 为什么当前不是 production_ready

尚未完成本地/NAS pre-release 真实执行、UAT、真实权限验证、备份回滚实操、隐私数据导入流程和生产部署 runbook；production_ready 不由 Codex 自动置 true。

## 为什么当前不是 UAT ready

UAT 前置清单尚未通过，真实 Collection / Runtime / Permission / Page / Mock import / Smoke / Contract / GPS / Backup rollback 均未执行。

## 用户本地测试已暂停说明

用户已删除本地 NAS 测试目录和 Docker 容器；当前不要求用户本地运行。run-full 仅保留为未来正式版前本地/NAS 执行入口。

## 正式版前恢复本地/NAS 执行条件

生产前必须重新 clone、新目录、新 env、新 DB volume、新 storage；不得复用测试 volume、storage、dump 或 env。

## 生产与外部服务边界

mock 数据不得进入生产。真实 IOPGPS 默认仍应禁用。不得使用真实司机资料、真实付款截图或真实合同扫描件完成 Codex dry-run。

## 下一步 Codex 任务

${report.next_codex_tasks.map((item: string) => `- ${item}`).join('\n')}

## production_ready 自动置位说明

Codex 不自动置 production_ready=true，生产就绪必须由人工在真实执行和 UAT 后确认。
`;
  fs.writeFileSync(repoPath(outputMarkdownPath), markdown, 'utf8');
}
function generatePreReleaseFinalReport() {
  const report = buildReport();
  fs.mkdirSync(path.dirname(repoPath(outputJsonPath)), { recursive: true });
  fs.writeFileSync(repoPath(outputJsonPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeMarkdown(report);
  return report;
}
exports.generatePreReleaseFinalReport = generatePreReleaseFinalReport;
if (require.main === module) {
  const report = generatePreReleaseFinalReport();
  console.log(
    JSON.stringify(
      {
        generated: true,
        workflow_mode: report.workflow_mode,
        production_ready: report.production_ready,
        uat_ready: report.uat_ready,
        files: [outputJsonPath, outputMarkdownPath],
      },
      null,
      2,
    ),
  );
}
