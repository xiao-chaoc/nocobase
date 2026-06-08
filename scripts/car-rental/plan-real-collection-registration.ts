import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  depositRecordsCollectionDraft,
  driversCollectionDraft,
  leaseContractsCollectionDraft,
  operationLogsCollectionDraft,
  rentDailyLedgersCollectionDraft,
  rentPaymentAllocationsCollectionDraft,
  rentPaymentsCollectionDraft,
  vehiclesCollectionDraft,
} from '../../packages/plugins/plugin-rental-core/src/server/collections';
import {
  dryRunRegisterCollections,
  makeRealCollectionSchemaDraftFromPluginDraft,
  planRegisterCollections,
} from './realNocobaseCollectionAdapter';

const MINIMAL_COLLECTION_DRAFTS = [
  driversCollectionDraft,
  vehiclesCollectionDraft,
  leaseContractsCollectionDraft,
  rentDailyLedgersCollectionDraft,
  rentPaymentsCollectionDraft,
  rentPaymentAllocationsCollectionDraft,
  depositRecordsCollectionDraft,
  operationLogsCollectionDraft,
];

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeMarkdown(filePath: string, report: ReturnType<typeof buildReport>): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const apiRows = report.apiEvidence
    .map(
      (item) =>
        `| \`${item.filePath}\` | \`${item.methodName}\` | ${
          item.usableForAdapter ? '可用于计划/映射' : '仅作为后续验证'
        } | ${item.verified ? '已源码确认' : '需验证'} | ${item.summary} |`,
    )
    .join('\n');
  const collectionRows = report.collections
    .map(
      (item) =>
        `| \`${item.collectionName}\` | ${item.plannedAction} | ${item.fieldCount} | ${item.uniqueConstraintCount} | ${
          item.sensitiveFieldCount
        } | ${item.valid ? '通过' : '失败'} |`,
    )
    .join('\n');
  const content = `# car-rental 真实 Collection Adapter 最小计划

## 1. 当前实现范围

- 当前宿主工程：\`${report.root}\`。
- 当前 NocoBase 目标版本：\`${report.targetVersion}\`。
- 当前模式：\`${report.mode}\`。
- 是否执行真实注册：\`${report.executed}\`。
- 是否写数据库：\`${report.writesDatabase}\`。
- 是否创建 Collection：\`${report.createsCollection}\`。
- 是否执行 migration：\`${report.runsMigration}\`。
- 本轮只实现真实 Collection Adapter 的 plan-only / validate-only / dry-run 最小可验证路径，不真实建表。

## 2. 已检测到的 NocoBase Collection API 证据

| 文件路径 | 方法名 | 对本 Adapter 的用途 | 状态 | 摘要 |
| --- | --- | --- | --- | --- |
${apiRows}

## 3. 映射策略

- 将 car-rental 插件中的 Collection 草案转换为 \`RealCollectionSchemaDraft\`。
- 再将 \`RealCollectionSchemaDraft\` 映射为 NocoBase v2.0.61 可理解的 Collection schema 草案。
- 保留字段、关系、普通索引、唯一约束、敏感字段与业务 notes。
- 关系字段仅保留 schema 草案信息，不调用 \`db.collection\`、不调用 \`db.sync\`、不触发 migration。

## 4. 最小 Collection 范围

| Collection | plannedAction | 字段数 | 唯一约束数 | 敏感字段数 | 校验 |
| --- | --- | ---: | ---: | ---: | --- |
${collectionRows}

## 5. 暂不处理范围

- \`contract_templates\`
- \`contract_documents\`
- \`gps_devices\`
- \`gps_daily_mileages\`
- \`gps_location_snapshots\`
- \`iopgps_settings\`

上述 Collection 属于合同文件和 IOPGPS 后续阶段，本轮不真实处理。

## 6. 安全边界

- 不读取 \`.env\`。
- 不输出任何应用、数据库或 IOPGPS 真实密钥。
- 不连接生产库。
- 不创建 Collection。
- 不执行 migration。
- 不导入真实或测试业务数据。
- 不调用真实 IOPGPS。
- 不标记 \`production_ready\`。

## 7. 为什么本轮不真实建表

当前任务要求实现最小可验证真实 Adapter 代码、脚本、测试和报告，但明确禁止真实创建 Collection、执行 migration 或使用生产库。因此本轮只生成可审查的 schema 草案、校验结果和 dry-run 计划。

## 8. 进入真实执行前必须满足的条件

- 显式设置 \`mode=real\`。
- 显式设置 \`allowRealExecution=true\`。
- 完成数据库备份并记录回滚方案。
- 使用隔离数据库，不能使用生产库。
- 禁用真实 IOPGPS。
- 仅使用 mock 数据。
- 完成 NocoBase v2.0.61 API 二次验证和人工评审。

## 9. 当前结论与下一步建议

- 当前 blockers：${report.errors.length > 0 ? report.errors.map((error) => `\`${error}\``).join('、') : '无'}。
- 当前可以进入下一轮真实 Collection execute 前置检查，但仍不能真实执行。
- 下一步建议：在隔离数据库中验证 \`Database.collection(options)\`、Collection Manager 元数据写入路径、事务和回滚边界。
`;
  fs.writeFileSync(filePath, content, 'utf8');
}

function buildReport() {
  const root = process.cwd();
  const collectionDrafts = MINIMAL_COLLECTION_DRAFTS.map(makeRealCollectionSchemaDraftFromPluginDraft);
  const planOnly = planRegisterCollections(collectionDrafts, root);
  const dryRun = dryRunRegisterCollections(collectionDrafts, root);
  return {
    generated_at: new Date().toISOString(),
    root,
    targetVersion: planOnly.apiInspection.targetVersion,
    mode: 'dry_run' as const,
    executed: false,
    writesDatabase: false,
    createsCollection: false,
    runsMigration: false,
    production_ready: false,
    apiInspection: planOnly.apiInspection,
    apiEvidence: planOnly.apiInspection.evidence,
    planOnly,
    dryRun,
    collections: dryRun.collections.map((collection) => ({
      collectionName: collection.collectionName,
      plannedAction: collection.plannedAction,
      fieldCount: collection.schema.fields.length,
      uniqueConstraintCount: collection.schema.uniqueConstraints.length,
      sensitiveFieldCount: collection.schema.sensitiveFields.length,
      relationCount: collection.schema.relations.length,
      fields: collection.schema.fields.map((field) => field.name),
      uniqueConstraints: collection.schema.uniqueConstraints,
      sensitiveFields: collection.schema.sensitiveFields,
      relations: collection.schema.relations,
      valid: collection.validation.valid,
      warnings: collection.validation.warnings,
      errors: collection.validation.errors,
    })),
    deferredCollections: [
      'contract_templates',
      'contract_documents',
      'gps_devices',
      'gps_daily_mileages',
      'gps_location_snapshots',
      'iopgps_settings',
    ],
    safety: {
      readsEnv: false,
      outputsSecrets: false,
      connectsProductionDatabase: false,
      createsCollection: false,
      runsMigration: false,
      callsIopgps: false,
      usesRealBusinessData: false,
    },
    businessRules: {
      noBookingOrReservation: true,
      noDriverLoginOrCustomerPortal: true,
      noVehicleCategoryRental: true,
      gpsExcludedFromRentCalculation: true,
      depositExcludedFromRentRevenue: true,
    },
    warnings: [...new Set([...planOnly.warnings, ...dryRun.warnings])],
    errors: [...new Set([...planOnly.errors, ...dryRun.errors])],
    nextActions: ['进入下一轮真实 Collection execute 前置检查；本轮不得真实执行。'],
  };
}

function main(): void {
  const report = buildReport();
  const jsonPath = path.resolve(process.cwd(), 'test-data/generated/real-collection-adapter-plan.generated.json');
  const markdownPath = path.resolve(process.cwd(), 'docs/car-rental-real-collection-adapter-plan.md');
  writeJson(jsonPath, report);
  writeMarkdown(markdownPath, report);
  console.log('car-rental 真实 Collection Adapter 最小计划已生成。');
  console.log(`JSON 报告：${jsonPath}`);
  console.log(`Markdown 报告：${markdownPath}`);
  console.log(`模式：${report.mode}`);
  console.log(`真实执行：${report.executed ? '是' : '否'}`);
  console.log(`Collection 数量：${report.collections.length}`);
  console.log(`阻塞项：${report.errors.length > 0 ? report.errors.join('；') : '无'}`);
}

main();
