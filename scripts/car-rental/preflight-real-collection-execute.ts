import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildRealCollectionExecutePreflightContext,
  summarizeRealCollectionExecutePreflight,
  validateRealCollectionExecutePreflight,
  type RealCollectionExecutePreflightContext,
  type RealCollectionExecutePreflightValidationResult,
} from './realCollectionExecutePreflight';

const JSON_REPORT_PATH = 'test-data/generated/real-collection-execute-preflight.generated.json';
const MARKDOWN_REPORT_PATH = 'docs/car-rental-real-collection-execute-preflight.md';

interface ExecutePreflightReport {
  generated_at: string;
  root: string;
  context: RealCollectionExecutePreflightContext;
  validation: RealCollectionExecutePreflightValidationResult;
  production_ready: false;
  executed: false;
  writesDatabase: false;
  createsCollection: false;
  runsMigration: false;
  callsIopgps: false;
  manualConfirmationChecklist: string[];
  requestFile?: string;
}

const MANUAL_CONFIRMATION_CHECKLIST = [
  '当前 NocoBase 版本 2.0.61。',
  '当前包管理器 yarn。',
  '当前数据库是 PostgreSQL。',
  '当前数据库是隔离测试库。',
  '当前数据库不是生产库。',
  '已完成数据库备份。',
  '已验证回滚路径。',
  'IOPGPS_SYNC_ENABLED=false。',
  '只使用 mock 数据。',
  '不使用真实司机资料。',
  '不使用真实付款截图。',
  '不使用真实合同扫描件。',
  '不启用真实 IOPGPS。',
  '已阅读 real collection adapter plan。',
  '已阅读 execute preflight 报告。',
  '已明确最小 Collection 范围。',
];

const MINIMAL_COLLECTIONS = [
  'drivers',
  'vehicles',
  'lease_contracts',
  'rent_daily_ledgers',
  'rent_payments',
  'rent_payment_allocations',
  'deposit_records',
  'operation_logs',
];

const OUT_OF_SCOPE = [
  'contract_documents',
  'contract_templates',
  'gps_devices',
  'gps_daily_mileages',
  'gps_location_snapshots',
  'iopgps_settings',
  '页面',
  '权限',
  '服务动作',
  '测试数据导入',
];

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeMarkdown(filePath: string, report: ExecutePreflightReport): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const context = report.context;
  const validation = report.validation;
  const line = (label: string, value: boolean, detail = '') =>
    `- ${value ? '✅' : '❌'} ${label}${detail ? `：\`${detail}\`` : ''}`;
  const content = `# car-rental 真实 Collection execute preflight 报告

## 1. 当前结论

- 报告生成时间：\`${report.generated_at}\`。
- 宿主工程：\`${report.root}\`。
- preflight 是否通过：\`${validation.valid}\`。
- 是否 production_ready：\`${report.production_ready}\`。
- 是否真实执行 Collection 注册：\`${report.executed}\`。
- 是否写数据库：\`${report.writesDatabase}\`。
- 是否创建 Collection：\`${report.createsCollection}\`。
- 是否执行 migration：\`${report.runsMigration}\`。
- 是否调用 IOPGPS：\`${report.callsIopgps}\`。
- 本轮只做 execute 前置检查；即使无 blocker，也不得在本轮真实执行。
- execute request 文件：\`${report.requestFile ?? '未提供'}\`。

## 2. preflight 检查项

${line('NocoBase 版本必须为 2.0.61', context.targetVersion === '2.0.61', context.targetVersion ?? 'unknown')}
${line('包管理器必须为 yarn', context.packageManager === 'yarn', context.packageManager ?? 'unknown')}
${line('数据库类型必须为 PostgreSQL', context.isPostgreSQL, context.databaseDialect ?? 'unknown')}
${line('必须明确是隔离测试库', context.isIsolatedDatabase, context.databaseSafetyLabel)}
${line('不得是生产或类生产库', !context.isProductionLikeDatabase)}
${line('必须有备份计划', context.hasBackupPlan)}
${line('必须有回滚计划', context.hasRollbackPlan)}
${line('必须禁用 IOPGPS 真实同步', !context.iopgpsRealSyncAllowed)}
${line('必须只允许 mock 数据', context.mockDataOnly)}
${line('必须存在最小 Collection plan', context.collectionPlanExists)}
${line('必须存在 real host environment report', context.hostEnvironmentReportExists)}
${line('必须存在未执行、未写库的 real collection adapter plan', context.realCollectionPlanExists)}
${line('execute request 已校验并应用', context.executeRequestApplied, context.executeRequestFile ?? '未提供')}
${line('execute 显式允许门禁本轮必须关闭', !context.executeExplicitlyAllowed)}

## 3. Blockers

${validation.blockers.length > 0 ? validation.blockers.map((item) => `- ${item}`).join('\n') : '- 无。'}

## 4. Warnings

${validation.warnings.length > 0 ? validation.warnings.map((item) => `- ${item}`).join('\n') : '- 无。'}

## 5. 下一步动作

${validation.nextActions.length > 0 ? validation.nextActions.map((item) => `- ${item}`).join('\n') : '- 无。'}

## 6. execute 人工确认清单

${report.manualConfirmationChecklist.map((item) => `- [ ] ${item}`).join('\n')}

## 7. 最小 Collection 范围

${MINIMAL_COLLECTIONS.map((item) => `- \`${item}\``).join('\n')}

## 8. 本阶段仍不包括

${OUT_OF_SCOPE.map((item) => `- \`${item}\``).join('\n')}

## 9. 安全声明

- 本脚本不读取 \`.env\` 文件。
- 本脚本不输出应用、数据库或 IOPGPS 密钥值。
- 本脚本不连接数据库。
- 本脚本不创建 Collection。
- 本脚本不执行 migration。
- 本脚本不调用真实 IOPGPS。
- 本脚本不导入真实或 mock 业务数据。
- 没有 preflight 通过和另起 PR 的人工确认，不得进入真实 Collection 创建。
`;
  fs.writeFileSync(filePath, content, 'utf8');
}

function getArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] ?? null;
}

function buildReport(requestFile?: string): ExecutePreflightReport {
  const context = buildRealCollectionExecutePreflightContext({ requestFile });
  const validation = validateRealCollectionExecutePreflight(context);
  return {
    generated_at: new Date().toISOString(),
    root: process.cwd(),
    context: {
      ...context,
      warnings: validation.warnings,
      errors: validation.errors,
      blockers: validation.blockers,
      nextActions: validation.nextActions,
    },
    validation,
    production_ready: false,
    executed: false,
    writesDatabase: false,
    createsCollection: false,
    runsMigration: false,
    callsIopgps: false,
    manualConfirmationChecklist: MANUAL_CONFIRMATION_CHECKLIST,
    requestFile,
  };
}

function main(): void {
  const requestFile = getArgValue(process.argv.slice(2), '--request');
  const allowBlockersForReport = process.argv.includes('--allow-blockers-for-report');
  const report = buildReport(requestFile ?? undefined);
  writeJson(JSON_REPORT_PATH, report);
  writeMarkdown(MARKDOWN_REPORT_PATH, report);
  // eslint-disable-next-line no-console
  console.log(summarizeRealCollectionExecutePreflight(report.context));
  if (report.validation.blockers.length > 0 && !allowBlockersForReport) {
    process.exitCode = 1;
  }
}

main();
