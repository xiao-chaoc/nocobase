#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
JSON_REPORT="${ROOT_DIR}/test-data/generated/car-rental-permission-sensitive-field-dry-run.generated.json"
MD_REPORT="${ROOT_DIR}/docs/car-rental-permission-sensitive-field-dry-run-report.md"
GENERATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Codex-only dry-run guardrails:
# - workflow_mode=codex_only
# - production_ready=false
# - no database connection, no permission registration, no role creation, no schema write, no migration
# - IOPGPS real sync stays disabled; this script only scans source files and writes mock reports
# - do not print environment secrets, tokens, passwords, or real credential values

mkdir -p "$(dirname "$JSON_REPORT")" "$(dirname "$MD_REPORT")"
cd "$ROOT_DIR"

GENERATED_AT="$GENERATED_AT" JSON_REPORT="$JSON_REPORT" MD_REPORT="$MD_REPORT" node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();
const generatedAt = process.env.GENERATED_AT;
const jsonReportPath = process.env.JSON_REPORT;
const mdReportPath = process.env.MD_REPORT;

const scanRoots = [
  'packages/plugins/plugin-rental-core/src/server',
  'packages/plugins/plugin-contract-documents/src/server',
  'packages/plugins/plugin-iopgps/src/server',
  'packages/shared/nocobase-automation/src',
];

const permissionPatterns = [
  /acl/i,
  /permission/i,
  /role/i,
  /resource/i,
  /action/i,
  /middleware/i,
  /policy/i,
  /filter/i,
  /field visibility/i,
  /field permissions/i,
  /collection permissions/i,
  /record permissions/i,
  /owner scoped access/i,
  /sensitive field/i,
  /payment visibility/i,
  /arrears visibility/i,
  /future receivable visibility/i,
  /deposit visibility/i,
  /contract document visibility/i,
  /gps visibility/i,
  /operation log visibility/i,
  /signed_scan_file/i,
  /login_key_encrypted/i,
  /access_token/i,
  /operationLogs/i,
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function toRepoPath(fullPath) {
  return path.relative(rootDir, fullPath).replace(/\\/g, '/');
}

function inferPlugin(relativePath) {
  if (relativePath.includes('plugin-rental-core')) return 'plugin-rental-core';
  if (relativePath.includes('plugin-contract-documents')) return 'plugin-contract-documents';
  if (relativePath.includes('plugin-iopgps')) return 'plugin-iopgps';
  if (relativePath.includes('nocobase-automation')) return 'nocobase-automation';
  return 'unknown';
}

function inferKind(relativePath, content) {
  if (relativePath.includes('/actions/')) return 'resource_action';
  if (relativePath.includes('/permissions/')) return 'permission_registry';
  if (relativePath.includes('/services/')) return 'service_policy_candidate';
  if (relativePath.includes('/collections/')) return 'collection_resource_candidate';
  if (relativePath.endsWith('pluginRegistration.ts')) return 'plugin_registration_permission_notes';
  if (/permissionPlan|permission/i.test(relativePath)) return 'permission_plan_automation';
  if (/middleware/i.test(content)) return 'middleware_candidate';
  if (/filter/i.test(content)) return 'filter_candidate';
  return 'visibility_or_acl_candidate';
}

function extractEntries(content) {
  const exported = [
    ...content.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g),
    ...content.matchAll(/export\s+const\s+([A-Za-z0-9_]+)/g),
    ...content.matchAll(/export\s+interface\s+([A-Za-z0-9_]+)/g),
    ...content.matchAll(/export\s+type\s+([A-Za-z0-9_]+)/g),
  ].map((match) => match[1]);
  const roles = [...content.matchAll(/requiredRoles\s*:\s*\[([^\]]*)\]/g)].map((match) => match[1].replace(/['"`]/g, '').trim());
  const permissions = [...content.matchAll(/permissions\s*:\s*\[([^\]]*)\]/g)].map((match) => match[1].replace(/['"`]/g, '').trim());
  return [...exported, ...roles.map((role) => `requiredRoles: ${role}`), ...permissions.map((permission) => `permissions: ${permission}`)];
}

const sourceFiles = scanRoots.flatMap((root) =>
  walk(path.join(rootDir, root))
    .filter((fullPath) => /\.(ts|tsx|js|json|md)$/.test(fullPath))
    .map((fullPath) => {
      const file = toRepoPath(fullPath);
      const content = read(file);
      return { file, content };
    }),
);

const detectedPermissionEntries = sourceFiles
  .filter(({ content }) => permissionPatterns.some((pattern) => pattern.test(content)))
  .map(({ file, content }) => ({
    name: extractEntries(content)[0] || path.basename(file),
    status: 'existing',
    kind: inferKind(file, content),
    source_plugin: inferPlugin(file),
    file,
    matched_terms: permissionPatterns.filter((pattern) => pattern.test(content)).map((pattern) => pattern.source.replace(/\\/g, '')),
    exported_entries: extractEntries(content).slice(0, 12),
  }));

const allContent = sourceFiles.map(({ content }) => content).join('\n');

const plannedPermissionEntries = [
  {
    name: 'finance_sensitive_totals_visibility',
    status: 'planned',
    business_rule: '总收入、总付款额、未来应收只对财务和管理员可见，普通操作员不可见。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'payment_attachment_visibility',
    status: 'planned',
    business_rule: '完整付款截图仅财务和管理员可访问，其他角色只可见脱敏状态。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'contract_scan_visibility',
    status: 'planned',
    business_rule: '合同扫描件为敏感文件，仅授权业务管理角色可访问。',
    source_plugin: 'plugin-contract-documents',
  },
  {
    name: 'driver_document_visibility',
    status: 'planned',
    business_rule: '司机证件字段必须脱敏，非授权角色不得查看。司机不登录系统。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'iopgps_secret_never_exposed',
    status: 'planned',
    business_rule: 'IOPGPS 登录凭据、系统密钥和 token 永不在 UI/API/operation logs 中明文暴露。',
    source_plugin: 'plugin-iopgps',
  },
  {
    name: 'gps_raw_track_visibility',
    status: 'planned',
    business_rule: '车辆 GPS 原始轨迹仅管理员和 GPS 维护角色可访问；财务默认不可见。',
    source_plugin: 'plugin-iopgps',
  },
  {
    name: 'operation_log_redaction_policy',
    status: 'planned',
    business_rule: 'operation logs 可审计，但必须过滤系统密钥、凭据、真实文件内容和令牌。',
    source_plugin: 'plugin-rental-core/plugin-iopgps/plugin-contract-documents',
  },
];

const expectedPermissionEntries = [
  ['总收入隐藏规则', /total.*income|income.*visibility|revenue.*visibility|总收入.*权限/i, 'plugin-rental-core'],
  ['总付款额隐藏规则', /total.*payment|payment.*visibility|总付款额.*权限/i, 'plugin-rental-core'],
  ['未来应收隐藏规则', /future.*receivable|未来应收.*权限|future receivable visibility/i, 'plugin-rental-core'],
  ['付款截图访问规则', /payment.*screenshot|payment.*attachment|付款截图.*权限/i, 'plugin-rental-core'],
  ['合同扫描件访问规则', /signed_scan_file|contract.*scan|合同扫描件.*权限/i, 'plugin-contract-documents'],
  ['司机证件访问规则', /driver.*document|driver.*license|司机证件.*权限/i, 'plugin-rental-core'],
  ['IOPGPS secret 隐藏规则', /login_key_encrypted|access_token|iopgps.*secret|iopgps.*凭据/i, 'plugin-iopgps'],
  ['GPS 原始轨迹访问规则', /gps.*raw.*track|raw.*gps|车辆 GPS 原始轨迹/i, 'plugin-iopgps'],
  ['普通操作员权限', /operator|普通操作员/i, 'plugin-rental-core'],
  ['财务角色权限', /finance|财务/i, 'plugin-rental-core'],
  ['管理员业务敏感数据权限', /system_admin|administrator|管理员/i, 'plugin-rental-core'],
  ['系统密钥永不暴露规则', /secret.*redact|credential.*redact|系统密钥.*泄露/i, 'all'],
  ['司机不登录规则', /司机不登录|driver.*no.*login/i, 'plugin-rental-core'],
  ['customer portal 禁止规则', /customer portal|customer_portal/i, 'plugin-rental-core'],
  ['online payment 禁止规则', /online payment|online_payment/i, 'plugin-rental-core'],
  ['operation log 审计规则', /operationLog|operation log|operationLogs/i, 'plugin-rental-core'],
];

const missingPermissionEntries = expectedPermissionEntries
  .filter(([, pattern]) => !pattern.test(allContent))
  .map(([name, , sourcePlugin]) => ({
    name,
    status: 'missing',
    source_plugin: sourcePlugin,
    note: '未在当前 server/shared automation 扫描中找到明确真实权限入口；本阶段只记录修改项，不失败退出。',
  }));

const pendingPermissionEntries = [
  {
    name: 'NocoBase ACL API exact registration point',
    status: 'pending_verification',
    business_rule: '正式实现前需在完整宿主工程确认 v2.0.61 ACL / resource action / field permission API。',
    source_plugin: 'nocobase host',
  },
  {
    name: 'owner scoped access exact policy',
    status: 'pending_verification',
    business_rule: '如后续引入业务 owner 维度，需确认 record permissions 具体接入点。',
    source_plugin: 'plugin-rental-core',
  },
];

const sensitiveFieldRules = [
  '非授权角色不得查看总收入。',
  '非授权角色不得查看总付款额。',
  '非授权角色不得查看未来应收。',
  '非授权角色不得查看完整付款截图。',
  '非授权角色不得查看合同扫描件。',
  '非授权角色不得查看司机证件。',
  '非授权角色不得查看 IOPGPS 登录凭据。',
  '非授权角色不得查看车辆 GPS 原始轨迹。',
  '普通操作员只能看到必要操作字段。',
  '财务角色可以查看收款、欠款、押金，但仍不得查看系统密钥。',
  '管理员可以查看业务敏感数据，但不得在 UI/API 中暴露系统密钥。',
  '司机不登录系统，没有司机端权限。',
  '没有 customer portal。',
  '没有 online payment permission。',
  '押金不计入租金收入。',
  '当前欠款不包含未来应收。',
  'operation logs 可审计，但不得泄露密钥。',
];

const roleMatrix = [
  {
    role: 'operator',
    allowed: ['必要操作字段', '合同基础状态', '车辆基础状态'],
    denied: ['总收入', '总付款额', '未来应收', '完整付款截图', '合同扫描件', '司机证件', '系统密钥', 'GPS 原始轨迹'],
  },
  {
    role: 'finance',
    allowed: ['收款', '欠款', '押金', '付款分配状态'],
    denied: ['系统密钥', 'IOPGPS 登录凭据', '车辆 GPS 原始轨迹', '司机证件原文'],
  },
  {
    role: 'manager',
    allowed: ['业务敏感数据', '合同扫描件授权查看', '司机证件脱敏查看'],
    denied: ['系统密钥明文', 'IOPGPS 登录凭据明文'],
  },
  {
    role: 'system_admin',
    allowed: ['业务敏感数据', '权限配置后续执行', '审计配置'],
    denied: ['UI/API 中暴露系统密钥明文', 'operation logs 中泄露凭据'],
  },
  {
    role: 'driver',
    allowed: [],
    denied: ['系统登录', '司机端权限', 'customer portal', 'online payment permission'],
  },
];

const blockers = [];
const warnings = [
  '当前不要求用户本地运行；正式版前才本地执行真实权限注册和本地/NAS 隔离验证。',
  '本 dry-run 不连接数据库、不真实注册权限、不创建角色、不写 schema、不执行 migration、不启用真实 IOPGPS。',
  'missing_permission_entries 只记录为修改项，不导致 Codex-only dry-run 失败。',
  'mock 数据不能进入生产，真实司机资料、真实付款截图、真实合同扫描件均不得用于本阶段。',
];

const possibleCredentialLeak = sourceFiles.some(({ file, content }) => {
  if (!file.includes('plugin-iopgps')) return false;
  return /console\.log\([^)]*(login|credential|secret|token|password)/i.test(content);
});
if (possibleCredentialLeak) blockers.push('发现 IOPGPS 凭据或密钥字段可能被日志输出，必须改为脱敏。');

const mockProductionRisk = sourceFiles.some(({ content }) => /mock.*production|production.*mock/i.test(content));
if (mockProductionRisk) blockers.push('发现 mock 数据可能进入生产的风险描述，请人工复核生产防 mock 门禁。');

if (/production_ready\s*[:=]\s*true/i.test(allContent)) blockers.push('发现 production_ready=true，当前阶段禁止标记生产就绪。');

const modificationItems = [
  ...missingPermissionEntries.map((entry) => `补齐 ${entry.name} 的真实权限/字段可见性规则。`),
  ...plannedPermissionEntries.map((entry) => `将 planned 权限项 ${entry.name} 接入真实 ACL / field visibility / resource action。`),
  '正式版前本地/NAS 执行前，需把本 Codex-only dry-run 结果转为真实权限注册验证。',
  '继续保持 production_ready=false，直到所有 local_pre_release 权限验证通过。',
];

const report = {
  generated_at: generatedAt,
  workflow_mode: 'codex_only',
  stage: 'permission_sensitive_field',
  execution_mode: 'codex_dry_run',
  production_ready: false,
  local_execution_required_pre_release: true,
  scan_roots: scanRoots,
  detected_permission_entries: detectedPermissionEntries,
  planned_permission_entries: plannedPermissionEntries,
  missing_permission_entries: missingPermissionEntries,
  pending_verification_entries: pendingPermissionEntries,
  sensitive_field_rules: sensitiveFieldRules,
  role_matrix: roleMatrix,
  blockers,
  warnings,
  modification_items: modificationItems,
};

fs.writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

function tableRows(items, mapper) {
  return items.map(mapper).join('\n');
}

const markdown = `# Car Rental Permission / Sensitive Field Dry-run Report

- generated_at: ${report.generated_at}
- 当前阶段: ${report.stage}
- 执行模式: ${report.execution_mode}
- workflow_mode: ${report.workflow_mode}
- production_ready: ${String(report.production_ready)}
- pre-release local execution required: ${String(report.local_execution_required_pre_release)}

## 当前执行说明

当前为 Codex-only dry-run / codex_mock_report 阶段，当前不要求用户本地运行；正式版前才本地执行 run-full 入口和真实权限注册验证。本报告不连接数据库、不真实注册权限、不创建角色、不真实创建页面、不导入数据、不写 schema、不执行 migration、不启用真实 IOPGPS，不使用真实司机资料、真实付款截图或真实合同扫描件，mock 数据不能进入生产。

## Detected permission entries

| 状态 | 类型 | 插件/模块 | 文件 | 导出/角色/权限入口 |
| --- | --- | --- | --- | --- |
${tableRows(report.detected_permission_entries.slice(0, 140), (entry) => `| ${entry.status} | ${entry.kind} | ${entry.source_plugin} | \`${entry.file}\` | ${entry.exported_entries.join(', ') || entry.name} |`)}

## Planned permission entries

| 状态 | permission / visibility | 插件 | 业务规则 |
| --- | --- | --- | --- |
${tableRows(report.planned_permission_entries, (entry) => `| ${entry.status} | ${entry.name} | ${entry.source_plugin} | ${entry.business_rule} |`)}

## Missing permission entries

${report.missing_permission_entries.length ? report.missing_permission_entries.map((entry) => `- ${entry.name} (${entry.source_plugin}): ${entry.note}`).join('\n') : '- 未发现必须记录的 missing 权限项；仍需正式版前本地验证。'}

## Pending verification entries

${report.pending_verification_entries.map((entry) => `- ${entry.name}: ${entry.business_rule}`).join('\n')}

## Role matrix

| 角色 | 允许 | 禁止 |
| --- | --- | --- |
${tableRows(report.role_matrix, (entry) => `| ${entry.role} | ${entry.allowed.join('、') || '无'} | ${entry.denied.join('、')} |`)}

## Sensitive field rules

${report.sensitive_field_rules.map((item) => `- ${item}`).join('\n')}

## Blockers

${report.blockers.length ? report.blockers.map((item) => `- ${item}`).join('\n') : '- 无 Codex-only dry-run blocker；仍不代表 production_ready。'}

## Warnings

${report.warnings.map((item) => `- ${item}`).join('\n')}

## modification_items

${report.modification_items.map((item) => `- ${item}`).join('\n')}
`;

fs.writeFileSync(mdReportPath, markdown, 'utf8');
console.log(JSON.stringify({ generated: true, report: path.relative(rootDir, jsonReportPath), markdown: path.relative(rootDir, mdReportPath), blockers: blockers.length }, null, 2));
NODE
