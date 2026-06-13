const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../..');
const generatedJsonPath = 'test-data/generated/car-rental-codex-only-project-status.generated.json';
const generatedMarkdownPath = 'docs/car-rental-codex-only-project-status.md';

interface ProjectStatusReport {
  generated_at: string;
  workflow_mode: 'codex_only';
  local_nas_test_status: 'paused';
  local_docker_status: 'deleted_by_user';
  target_version: '2.0.61';
  package_manager: 'yarn';
  production_ready: false;
  current_completed_items: string[];
  current_pending_items: string[];
  current_blockers: string[];
  next_codex_tasks: string[];
  next_user_actions: string[];
  pre_release_local_required: true;
  privacy_data_local_required: true;
  mock_data_allowed_in_production: false;
}

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function writeJson(relativePath: string, report: ProjectStatusReport): void {
  const outputPath = repoPath(relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function writeMarkdown(relativePath: string, report: ProjectStatusReport): void {
  const markdown = `# Car Rental Codex-only Project Status

- generated_at: ${report.generated_at}
- workflow_mode: ${report.workflow_mode}
- local_nas_test_status: ${report.local_nas_test_status}
- local_docker_status: ${report.local_docker_status}
- target_version: ${report.target_version}
- package_manager: ${report.package_manager}
- production_ready: ${String(report.production_ready)}
- pre_release_local_required: ${String(report.pre_release_local_required)}
- privacy_data_local_required: ${String(report.privacy_data_local_required)}
- mock_data_allowed_in_production: ${String(report.mock_data_allowed_in_production)}

## Current completed items

${bulletList(report.current_completed_items)}

## Current pending items

${bulletList(report.current_pending_items)}

## Current blockers

${bulletList(report.current_blockers)}

## Next Codex tasks

${bulletList(report.next_codex_tasks)}

## Next user actions

${bulletList(report.next_user_actions)}
`;
  const outputPath = repoPath(relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, 'utf8');
}

function buildReport(): ProjectStatusReport {
  return {
    generated_at: new Date().toISOString(),
    workflow_mode: 'codex_only',
    local_nas_test_status: 'paused',
    local_docker_status: 'deleted_by_user',
    target_version: '2.0.61',
    package_manager: 'yarn',
    production_ready: false,
    current_completed_items: [
      '完整 NocoBase v2.0.61 宿主工程基线已确认',
      'Codex-only workflow established.',
      'Local NAS test paused.',
      'Full isolated system test plan created.',
      'Runtime registration dry-run stage added.',
      'Permission and sensitive field dry-run stage added.',
      'Page/menu/block dry-run stage added.',
      'Mock data import dry-run stage added.',
      'Safe mock fixtures added.',
      'Mock data production guard added.',
      'Business smoke test dry-run stage added.',
      'Contract document test dry-run stage added.',
      'GPS mock test dry-run stage added.',
      'Backup/rollback rehearsal dry-run stage added.',
      'production_ready=false 门禁保持开启',
    ],
    current_pending_items: ['Production init guard stage.'],
    current_blockers: [
      '用户已删除本地 NAS 测试目录，当前无法执行本地 Docker / PostgreSQL 验证',
      '当前不能使用真实 IOPGPS',
      '当前不能使用真实司机资料、真实付款截图或真实合同扫描件',
      'mock data cannot enter production',
    ],
    next_codex_tasks: ['Implement production init guard stage.', '生成正式部署 runbook 与隐私数据导入前检查清单'],
    next_user_actions: [
      '审查 Codex PR',
      '合并 PR',
      '确认业务规则',
      '正式版前重新 clone 到新目录',
      '正式版前配置生产 .env、新 PostgreSQL volume 和新 storage',
      '提供真实隐私数据前进行人工确认',
    ],
    pre_release_local_required: true,
    privacy_data_local_required: true,
    mock_data_allowed_in_production: false,
  };
}

function generateCodexOnlyProjectStatusReport(): ProjectStatusReport {
  const report = buildReport();
  writeJson(generatedJsonPath, report);
  writeMarkdown(generatedMarkdownPath, report);
  return report;
}

exports.generateCodexOnlyProjectStatusReport = generateCodexOnlyProjectStatusReport;

function main(): void {
  const report = generateCodexOnlyProjectStatusReport();
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        generated: true,
        workflow_mode: report.workflow_mode,
        local_nas_test_status: report.local_nas_test_status,
        production_ready: report.production_ready,
        files: [generatedJsonPath, generatedMarkdownPath],
      },
      null,
      2,
    ),
  );
}

if (require.main === module) {
  main();
}
