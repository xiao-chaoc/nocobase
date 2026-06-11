#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
JSON_REPORT="${ROOT_DIR}/test-data/generated/car-rental-runtime-registration-dry-run.generated.json"
MD_REPORT="${ROOT_DIR}/docs/car-rental-runtime-registration-dry-run-report.md"
GENERATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Codex-only dry-run guardrails:
# - workflow_mode=codex_only
# - production_ready=false
# - no database connection, no runtime registration, no schema write, no migration
# - IOPGPS real sync stays disabled; this script only scans source files and writes mock reports

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

const plugins = [
  'packages/plugins/plugin-rental-core/src/server',
  'packages/plugins/plugin-contract-documents/src/server',
  'packages/plugins/plugin-iopgps/src/server',
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

function detectKind(relativePath, content) {
  if (relativePath.includes('/actions/')) return 'action';
  if (relativePath.includes('/services/')) return 'service';
  if (relativePath.includes('/permissions/')) return 'permission';
  if (relativePath.includes('/schedules/')) return 'schedule';
  if (relativePath.includes('/collections/')) return 'collection_resource';
  if (relativePath.endsWith('pluginRegistration.ts')) return 'plugin_registration';
  if (relativePath.includes('Runtime')) return 'runtime_automation';
  if (/router|middleware|repository|resourcer|acl|workflow|scheduler/i.test(content)) return 'runtime_candidate';
  return 'server_export';
}

function inferPlugin(relativePath) {
  if (relativePath.includes('plugin-rental-core')) return 'plugin-rental-core';
  if (relativePath.includes('plugin-contract-documents')) return 'plugin-contract-documents';
  if (relativePath.includes('plugin-iopgps')) return 'plugin-iopgps';
  if (relativePath.includes('nocobase-automation')) return 'nocobase-automation';
  return 'unknown';
}

function extractExports(content) {
  const matches = [...content.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]);
  const constMatches = [...content.matchAll(/export\s+const\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]);
  return [...matches, ...constMatches];
}

const detectedRuntimeEntries = scanRoots.flatMap((root) =>
  walk(path.join(rootDir, root))
    .filter((fullPath) => fullPath.endsWith('.ts'))
    .map((fullPath) => {
      const relativePath = toRepoPath(fullPath);
      const content = read(relativePath);
      const exports = extractExports(content);
      return {
        name: exports[0] || path.basename(relativePath, '.ts'),
        status: 'existing',
        kind: detectKind(relativePath, content),
        source_plugin: inferPlugin(relativePath),
        file: relativePath,
        exported_entries: exports,
      };
    })
    .filter(
      (entry) =>
        entry.kind !== 'server_export' ||
        entry.exported_entries.length > 0 ||
        /service|action|resource|repository|router|middleware|pluginRegistration|register|workflow|scheduler|permission|contract|IOPGPS|sync/i.test(
          read(entry.file),
        ),
    ),
);

const plannedRuntimeEntries = [
  {
    name: 'contract_creation_runtime',
    status: 'planned',
    business_rule: '合同创建需校验司机、车辆、长租/时限合同规则，激活后才能生成台账。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'natural_week_ledger_generation_runtime',
    status: 'planned',
    business_rule: '按自然周生成租金台账，支持默认免租日；每日台账为唯一事实来源。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'payment_daily_allocation_runtime',
    status: 'planned',
    business_rule: '付款必须分配到具体日期，单日不可超付，整笔分配失败需整体失败。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'deposit_lifecycle_runtime',
    status: 'planned',
    business_rule: '押金收取、抵扣、退还与租金收入隔离。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'shortfall_calculation_runtime',
    status: 'planned',
    business_rule: '当前欠款不包含未来应收，并保留未付原因。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'contract_document_generation_runtime',
    status: 'planned',
    business_rule: '只在后续真实执行中生成合同文件，本阶段不生成真实合同。',
    source_plugin: 'plugin-contract-documents',
  },
  {
    name: 'iopgps_mock_sync_runtime',
    status: 'planned',
    business_rule: 'IOPGPS 真实同步默认禁用，仅允许 mock sync 与错误日志隔离。',
    source_plugin: 'plugin-iopgps',
  },
  {
    name: 'operation_log_runtime',
    status: 'planned',
    business_rule: '关键动作写 operation logs，并对敏感字段脱敏。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'permission_check_runtime_placeholder',
    status: 'planned',
    business_rule: '权限和敏感字段阶段补齐真实权限校验。',
    source_plugin: 'plugin-rental-core',
  },
  {
    name: 'page_action_runtime_placeholder',
    status: 'planned',
    business_rule: '页面、菜单、区块初始化阶段补齐页面动作绑定。',
    source_plugin: 'plugin-rental-core',
  },
];

const contentByFile = Object.fromEntries(detectedRuntimeEntries.map((entry) => [entry.file, read(entry.file)]));
const allContent = Object.values(contentByFile).join('\n');

const expectedCapabilities = [
  ['合同创建 runtime', /activate_contract|contractLifecycleService|create.*contract/i],
  ['租金台账生成 runtime', /ledgerGenerationService|generate_fixed_term_ledgers|ensure_open_ended_ledgers/i],
  ['付款分配 runtime', /paymentAllocationService|confirm_rent_payment/i],
  ['押金处理 runtime', /depositService|deposit/i],
  ['欠款计算 runtime', /shortfallService|shortfall/i],
  ['合同文档生成 runtime', /renderContractDocument|generate_contract_document|contractDocumentService/i],
  ['GPS mock sync runtime', /callsRealApi:\s*false|defaultEnabled:\s*false|iopgps.*sync/i],
  ['operation log runtime', /operationLogService|operationLogs/i],
  ['权限检查 runtime placeholder', /permissionFilterService|PermissionRegistry|permissions/i],
  ['页面动作 runtime placeholder', /page action|页面|button|block/i],
];

const missingRuntimeEntries = expectedCapabilities
  .filter(([, pattern]) => !pattern.test(allContent))
  .map(([name]) => ({ name, status: 'missing', note: '未在 Codex-only 扫描中找到明确入口，后续阶段补齐。' }));

const blockers = [];
const warnings = [
  '当前 Codex-only 阶段不要求用户本地运行；正式版前才进行本地/NAS 隔离执行。',
  '本 dry-run 不连接数据库、不注册真实 runtime、不写 schema、不执行 migration。',
];

const iopgpsFiles = detectedRuntimeEntries.filter((entry) => entry.source_plugin === 'plugin-iopgps');
const iopgpsDefaultEnabled = iopgpsFiles.some((entry) => /defaultEnabled:\s*true|callsRealApi:\s*true|IOPGPS_SYNC_ENABLED\s*=\s*true/.test(read(entry.file)));
if (iopgpsDefaultEnabled) blockers.push('发现真实 IOPGPS sync 可能默认开启，必须改为默认禁用。');

const mockProductionRisk = plugins.some((root) =>
  walk(path.join(rootDir, root)).some((fullPath) => /mock.*production|production.*mock/i.test(fs.readFileSync(fullPath, 'utf8'))),
);
if (mockProductionRisk) blockers.push('发现 mock 数据可能进入生产的风险描述，请人工复核生产防 mock 门禁。');

if (/production_ready\s*[:=]\s*true/i.test(allContent)) blockers.push('发现 production_ready=true，当前阶段禁止标记生产就绪。');

const modificationItems = [
  ...missingRuntimeEntries.map((entry) => `补齐 ${entry.name} 的真实 runtime/service/action 注册。`),
  '将 Codex-only planned runtime 转换为真实 NocoBase service/action/permission 注册前，需增加本地 pre-release 验证。',
  '权限与敏感字段测试阶段需继续验证 permission placeholder。',
  '页面动作 runtime placeholder 需在页面 / 菜单 / 区块阶段绑定。',
];

const report = {
  generated_at: generatedAt,
  workflow_mode: 'codex_only',
  stage: 'runtime_registration',
  execution_mode: 'codex_dry_run',
  production_ready: false,
  local_execution_required_pre_release: true,
  scan_roots: scanRoots,
  detected_runtime_entries: detectedRuntimeEntries,
  planned_runtime_entries: plannedRuntimeEntries,
  missing_runtime_entries: missingRuntimeEntries,
  blockers,
  warnings,
  modification_items: modificationItems,
};

fs.writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

function tableRows(items, mapper) {
  return items.map(mapper).join('\n');
}

const markdown = `# Car Rental Runtime Registration Dry-run Report

- generated_at: ${report.generated_at}
- 当前阶段: ${report.stage}
- 执行模式: ${report.execution_mode}
- workflow_mode: ${report.workflow_mode}
- production_ready: ${String(report.production_ready)}
- pre-release local execution required: ${String(report.local_execution_required_pre_release)}

## 当前执行说明

当前为 Codex-only dry-run / codex_mock_report 阶段，当前不要求用户本地运行；正式版前才本地执行 run-full 入口和真实 runtime 验证。本报告不连接数据库、不真实注册 runtime、不写 schema、不执行 migration、不启用真实 IOPGPS，不使用真实司机资料、真实付款截图或真实合同扫描件，mock 数据不能进入生产。

## 检测到的 runtime 入口

| 状态 | 类型 | 插件/模块 | 文件 | 导出入口 |
| --- | --- | --- | --- | --- |
${tableRows(report.detected_runtime_entries.slice(0, 120), (entry) => `| ${entry.status} | ${entry.kind} | ${entry.source_plugin} | \`${entry.file}\` | ${entry.exported_entries.join(', ') || entry.name} |`)}

## Planned runtime 入口

| 状态 | runtime | 插件 | 业务规则 |
| --- | --- | --- | --- |
${tableRows(report.planned_runtime_entries, (entry) => `| ${entry.status} | ${entry.name} | ${entry.source_plugin} | ${entry.business_rule} |`)}

## 缺失 runtime 入口

${report.missing_runtime_entries.length ? report.missing_runtime_entries.map((entry) => `- ${entry.name}: ${entry.note}`).join('\n') : '- 本次扫描未发现必须失败的缺失项；真实 runtime 仍需后续 pre-release local execution 验证。'}

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
