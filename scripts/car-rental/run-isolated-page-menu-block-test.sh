#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
JSON_REPORT="${ROOT_DIR}/test-data/generated/car-rental-page-menu-block-dry-run.generated.json"
STAGE="page_menu_block_initialization"
WORKFLOW_MODE="codex_only"
EXECUTION_MODE="codex_dry_run"
PRODUCTION_READY=false
# production_ready=false
# no database connection: this Codex-only stage never opens DB sockets, never authenticates Sequelize,
# never creates pages, never registers menus, never writes UI schema, never writes schema, and never runs migrations.
# IOPGPS real sync stays disabled: this dry-run must not enable or call real IOPGPS.

mkdir -p "$(dirname "$JSON_REPORT")"

ROOT_DIR="$ROOT_DIR" JSON_REPORT="$JSON_REPORT" node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.env.ROOT_DIR;
const jsonReportPath = process.env.JSON_REPORT;

const scanTargets = [
  'packages/plugins/plugin-rental-core/src/client',
  'packages/plugins/plugin-rental-core/src/server',
  'packages/plugins/plugin-contract-documents/src/client',
  'packages/plugins/plugin-contract-documents/src/server',
  'packages/plugins/plugin-iopgps/src/client',
  'packages/plugins/plugin-iopgps/src/server',
  'packages/shared/nocobase-automation/src',
];

const keywords = [
  'page',
  'menu',
  'route',
  'router',
  'ui schema',
  'schema initializer',
  'block',
  'table block',
  'form block',
  'details block',
  'filter block',
  'calendar block',
  'action button',
  'collection block',
  'page initializer',
  'plugin client',
  'Plugin class',
  'addRoutes',
  'addMenu',
  'app.addComponents',
  'schemaSettings',
  'schemaInitializer',
  'workflow UI',
  'contract document UI',
  'GPS UI',
];

function walk(relativeDir) {
  const absoluteDir = path.join(rootDir, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name);
    const absolutePath = path.join(rootDir, relativePath);
    if (entry.isDirectory()) return walk(relativePath);
    if (!entry.isFile()) return [];
    return [relativePath];
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

const sourceFiles = scanTargets.flatMap(walk).sort();
const detectedFromSource = [];
const forbiddenLeaks = [];

for (const file of sourceFiles) {
  const content = read(file);
  const lower = content.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
  if (matchedKeywords.length > 0) {
    detectedFromSource.push({
      status: 'existing',
      file,
      matched_keywords: matchedKeywords,
    });
  }

  if (/production_ready\s*[:=]\s*true/i.test(content)) {
    forbiddenLeaks.push(`production_ready=true appears in scanned source: ${file}`);
  }

  if (/mock[^\n]{0,80}(production|生产)|生产[^\n]{0,80}mock/i.test(content) && !/cannot enter production|不能进入生产|不允许进入生产/i.test(content)) {
    forbiddenLeaks.push(`mock data production ambiguity requires review: ${file}`);
  }
}

const clientDirsMissing = scanTargets.filter((target) => target.endsWith('/src/client') && !fs.existsSync(path.join(rootDir, target)));

const detectedPageEntries = [
  ...detectedFromSource,
  {
    status: 'existing',
    item: 'buildPageInitializationPlan dry-run page/menu/block plan builder',
    file: 'packages/shared/nocobase-automation/src/pageInitializationPlan.ts',
    evidence: 'Contains menu/page/block/filter/action builders and car-rental page plan functions.',
  },
  {
    status: 'existing',
    item: 'dryRunInitializePages mock page executor',
    file: 'packages/shared/nocobase-automation/src/pageInitializationExecutor.ts',
    evidence: 'Runs MockPageAdapter only; does not create real NocoBase pages.',
  },
  {
    status: 'existing',
    item: 'plugin-rental-core server registration plan',
    file: 'packages/plugins/plugin-rental-core/src/server/pluginRegistration.ts',
    evidence: 'Server collections, services, actions, permissions, schedules and operation logs are described.',
  },
  {
    status: 'existing',
    item: 'plugin-contract-documents server registration plan',
    file: 'packages/plugins/plugin-contract-documents/src/server/pluginRegistration.ts',
    evidence: 'Contract document services/actions are described; real files are not generated in this stage.',
  },
  {
    status: 'existing',
    item: 'plugin-iopgps server registration plan',
    file: 'packages/plugins/plugin-iopgps/src/server/pluginRegistration.ts',
    evidence: 'GPS services/actions/settings are described; real IOPGPS is not called in this stage.',
  },
];

const plannedPageEntries = [
  { item: '车辆管理页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/vehicles', blocks: ['vehicles-table', 'vehicle-current-contract', 'vehicle-gps-status'] },
  { item: '司机管理页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/drivers', blocks: ['drivers-table', 'driver-detail'] },
  { item: '合同管理页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/contracts', blocks: ['contracts-table', 'contract-detail', 'contract-documents-relation'] },
  { item: '合同创建页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/contracts', blocks: ['create_contract action placeholder'] },
  { item: '合同详情页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/contracts/:id placeholder', blocks: ['contract-detail', 'contract-ledgers-relation', 'contract-payments-relation'] },
  { item: '时限合同页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/contracts?contract_type=fixed_term placeholder', blocks: ['contracts-table', 'generate_fixed_term_ledgers action'] },
  { item: '长租合同页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/contracts?contract_type=open_ended placeholder', blocks: ['contracts-table', 'ensure_open_ended_ledgers action'] },
  { item: '日租金台账页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/ledgers', blocks: ['rent-ledgers-table'] },
  { item: '付款登记页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/payments', blocks: ['payments-table', 'create_rent_payment action'] },
  { item: '付款按日分配页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/payments/:id/allocations placeholder', blocks: ['payment-allocations-relation'] },
  { item: '押金管理页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/deposits', blocks: ['deposits-table'] },
  { item: '欠款看板页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/dashboard', blocks: ['dashboard-summary-cards', 'dashboard-risk-panel'] },
  { item: '当前欠款日历页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/calendar', blocks: ['rent-calendar-placeholder', 'rent-calendar-summary'] },
  { item: '免租日显示', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/calendar', blocks: ['rent-calendar-placeholder'] },
  { item: '未付原因管理', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/ledgers', blocks: ['mark_unpaid_reason action'] },
  { item: '合同文档生成页面', status: 'planned', plugin: 'plugin-contract-documents', planned_route: '/rental/contract-documents', blocks: ['contract-templates-table', 'contract-documents-table', 'generate_contract_documents action'] },
  { item: '合同打印/下载入口', status: 'planned', plugin: 'plugin-contract-documents', planned_route: '/rental/contract-documents', blocks: ['mark_contract_printed action', 'generated_docx_file hidden', 'generated_pdf_file hidden'] },
  { item: 'GPS mock 状态页面', status: 'planned', plugin: 'plugin-iopgps', planned_route: '/rental/gps/status', blocks: ['gps-status-log-table', 'gps-location-table', 'gps-mileage-table'] },
  { item: 'IOPGPS 设置页面', status: 'planned', plugin: 'plugin-iopgps', planned_route: '/rental/settings/iopgps placeholder', blocks: ['credential fields hidden by default'] },
  { item: 'operation logs 页面', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/operation-logs', blocks: ['operation-logs-table'] },
  { item: '管理员菜单', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental', roles: ['system_admin'] },
  { item: '财务菜单', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/ledgers', roles: ['accountant', 'manager'] },
  { item: '普通操作员菜单', status: 'planned', plugin: 'plugin-rental-core', planned_route: '/rental/contracts', roles: ['operator'] },
  { item: '权限敏感字段显示控制 placeholder', status: 'planned', plugin: 'plugin-rental-core', planned_route: 'all finance/privacy pages', blocks: ['hiddenFields/requiredRoles placeholder'] },
];

const missingPageEntries = [
  ...clientDirsMissing.map((dir) => ({ item: `${dir} client runtime directory`, status: 'missing', reason: 'No client directory exists in the scanned plugin path; real NocoBase page/menu/UI schema registration is not implemented.' })),
  { item: 'real addRoutes/addMenu/app.addComponents UI registration', status: 'missing', reason: 'No real client UI registration should be created in this dry-run stage.' },
  { item: 'real UI schema files', status: 'missing', reason: 'UI schema writing is forbidden in this stage.' },
  { item: 'real schemaInitializer/schemaSettings wiring', status: 'missing', reason: 'Schema initializer wiring remains future local_pre_release implementation.' },
];

const menuMatrix = [
  { menu: '管理员菜单', roles: ['system_admin'], coverage: ['all planned menus', 'system-settings', 'operation logs'], status: 'planned' },
  { menu: '财务菜单', roles: ['manager', 'accountant'], coverage: ['ledgers', 'payments', 'deposits', 'arrears dashboard', 'calendar'], status: 'planned' },
  { menu: '普通操作员菜单', roles: ['operator'], coverage: ['drivers', 'vehicles', 'contracts', 'contract documents without sensitive files'], status: 'planned' },
  { menu: 'GPS 管理菜单', roles: ['system_admin', 'manager', 'gps_maintenance'], coverage: ['GPS mock status', 'GPS devices', 'IOPGPS settings with hidden credentials'], status: 'planned' },
];

const blockMatrix = [
  { block_type: 'table block', items: ['vehicles-table', 'drivers-table', 'contracts-table', 'rent-ledgers-table', 'payments-table', 'deposits-table'], status: 'planned' },
  { block_type: 'form block', items: ['create_contract', 'create_rent_payment', 'create_deposit action placeholders'], status: 'planned' },
  { block_type: 'details block', items: ['driver-detail', 'contract-detail', 'vehicle-gps-status'], status: 'planned' },
  { block_type: 'filter block', items: ['date/status/driver/vehicle/contract filters'], status: 'planned' },
  { block_type: 'calendar block', items: ['rent-calendar-placeholder'], status: 'planned' },
  { block_type: 'action button', items: ['generate_fixed_term_ledgers', 'ensure_open_ended_ledgers', 'generate_contract_documents', 'sync_* mock-only actions'], status: 'planned' },
  { block_type: 'collection block', items: ['collection-backed tables/relations only, no real UI schema writes'], status: 'planned' },
];

const sensitiveFieldUiRules = [
  { field_group: 'driver identity files', rule: '司机证件号和证件文件默认隐藏；仅授权角色可见。', status: 'planned' },
  { field_group: 'payment screenshots', rule: '付款截图默认隐藏，operator 不可见。', status: 'planned' },
  { field_group: 'contract scans', rule: '合同扫描件和生成文件默认隐藏，需服务端权限控制。', status: 'planned' },
  { field_group: 'financial totals', rule: '总付款、总欠款、未来应收默认隐藏，GPS 维护角色不可见。', status: 'planned' },
  { field_group: 'IOPGPS credentials', rule: 'appid/login_key/access_token 等真实凭据不得在普通 UI 出现。', status: 'planned' },
];

const blockers = [...new Set(forbiddenLeaks.filter(Boolean))];
const warnings = [
  '当前不要求用户本地运行；正式版前才本地执行真实页面/菜单/区块初始化验证。',
  '本 dry-run 不连接数据库、不创建真实页面、不注册真实菜单、不写 UI schema、不执行 migration。',
  'mock 数据不能进入生产；本阶段不导入任何数据。',
  '真实 IOPGPS 未启用，GPS 页面只能按 mock 状态规划。',
];

const modificationItems = [
  ...missingPageEntries.map((entry) => `补齐 ${entry.item}: ${entry.reason}`),
  '后续在真实 NocoBase client runtime 中实现页面、菜单、区块和权限敏感字段显示控制。',
  '正式版前在 local_pre_release 环境执行真实页面初始化验证。',
];

const report = {
  generated_at: new Date().toISOString(),
  workflow_mode: 'codex_only',
  stage: 'page_menu_block_initialization',
  execution_mode: 'codex_dry_run',
  production_ready: false,
  local_execution_required_pre_release: true,
  source_scan_targets: scanTargets,
  detected_page_entries: detectedPageEntries,
  planned_page_entries: plannedPageEntries,
  missing_page_entries: missingPageEntries,
  menu_matrix: menuMatrix,
  block_matrix: blockMatrix,
  sensitive_field_ui_rules: sensitiveFieldUiRules,
  blockers,
  warnings,
  modification_items: modificationItems,
};

fs.writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ generated: true, workflow_mode: report.workflow_mode, stage: report.stage, execution_mode: report.execution_mode, production_ready: report.production_ready, report: path.relative(rootDir, jsonReportPath) }, null, 2));
NODE
