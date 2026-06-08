/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RealSeedDataEntitySchemaDraft,
  RealSeedDataFileFieldDraft,
  RealSeedDataRelationDraft,
  SeedDataEntityPlan,
  SeedDataImportPlan,
} from './types';

const forbiddenEntityKeywords = [
  'booking',
  'reservation',
  'short_rental_order',
  'driver_login',
  'customer_portal',
  'vehicle_category_rental',
];

const fileFieldByEntity: Record<string, string[]> = {
  drivers: ['id_front_file', 'id_back_file', 'license_front_file', 'license_back_file'],
  rent_payments: ['screenshot_file'],
  deposit_records: ['screenshot_file'],
  contract_documents: ['generated_docx_file', 'generated_pdf_file', 'signed_scan_file'],
};

const relationRules: Array<{
  entityType: string;
  relationField: string;
  targetEntityType: string;
  targetCollection: string;
  targetKey: string;
}> = [
  {
    entityType: 'lease_contracts',
    relationField: 'driver_id',
    targetEntityType: 'drivers',
    targetCollection: 'drivers',
    targetKey: 'driver_id',
  },
  {
    entityType: 'lease_contracts',
    relationField: 'vehicle_id',
    targetEntityType: 'vehicles',
    targetCollection: 'vehicles',
    targetKey: 'vehicle_id',
  },
  {
    entityType: 'rent_daily_ledgers',
    relationField: 'contract_id',
    targetEntityType: 'lease_contracts',
    targetCollection: 'lease_contracts',
    targetKey: 'contract_id',
  },
  {
    entityType: 'rent_payment_allocations',
    relationField: 'payment_id',
    targetEntityType: 'rent_payments',
    targetCollection: 'rent_payments',
    targetKey: 'payment_id',
  },
  {
    entityType: 'rent_payment_allocations',
    relationField: 'ledger_id',
    targetEntityType: 'rent_daily_ledgers',
    targetCollection: 'rent_daily_ledgers',
    targetKey: 'ledger_id',
  },
  {
    entityType: 'deposit_records',
    relationField: 'contract_id',
    targetEntityType: 'lease_contracts',
    targetCollection: 'lease_contracts',
    targetKey: 'contract_id',
  },
  {
    entityType: 'gps_daily_mileages',
    relationField: 'device_id',
    targetEntityType: 'gps_devices',
    targetCollection: 'gps_devices',
    targetKey: 'device_id',
  },
  {
    entityType: 'contract_documents',
    relationField: 'contract_id',
    targetEntityType: 'lease_contracts',
    targetCollection: 'lease_contracts',
    targetKey: 'contract_id',
  },
];

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const hasForbiddenEntityName = (entityType: string): boolean =>
  forbiddenEntityKeywords.some((keyword) => entityType.includes(keyword));

export function extractFileFieldDrafts(entityPlan: SeedDataEntityPlan): RealSeedDataFileFieldDraft[] {
  return (fileFieldByEntity[entityPlan.entityType] ?? []).map((fieldName) => ({
    fieldName,
    entityType: entityPlan.entityType,
    placeholderStrategy: '仅允许导入 TEST_ 或 MOCK_ 文件占位符；本轮不上传文件、不绑定真实 file storage 对象。',
    requiresFileStorage: true,
    sensitive: true,
    unsupportedReason: '当前仓库未接入真实 NocoBase 文件存储 API，不能上传真实司机证件、付款截图或合同文件。',
    notes: ['文件字段默认视为敏感字段。', '真实导入阶段必须先完成文件存储、访问权限和回滚策略。'],
  }));
}

export function extractRelationDrafts(entityPlan: SeedDataEntityPlan): RealSeedDataRelationDraft[] {
  const explicitRules = relationRules.filter((rule) => rule.entityType === entityPlan.entityType);
  const fromDependencies = entityPlan.dependencies.map((dependency) => ({
    entityType: entityPlan.entityType,
    relationField: dependency.relationField,
    targetEntityType: dependency.dependsOn,
    targetCollection: dependency.dependsOn,
    targetKey: dependency.targetKey,
    required: dependency.required,
    validationNotes: uniqueStrings([...dependency.notes, '真实导入前必须校验目标记录已按导入顺序存在。']),
  }));
  const fromRules = explicitRules.map((rule) => ({
    ...rule,
    required: true,
    validationNotes: [
      '来自真实 Seed Data Import 草案的固定引用关系。',
      '本轮只生成引用完整性校验草案，不查询真实数据库。',
    ],
  }));
  const byKey = new Map<string, RealSeedDataRelationDraft>();
  [...fromDependencies, ...fromRules].forEach((relation) =>
    byKey.set(
      `${relation.entityType}.${relation.relationField}->${relation.targetEntityType}.${relation.targetKey}`,
      relation,
    ),
  );
  return Array.from(byKey.values());
}

export function mapSeedDataEntityPlanToRealSchemaDraft(entityPlan: SeedDataEntityPlan): RealSeedDataEntitySchemaDraft {
  const warnings: string[] = [];
  const unsupportedFeatures: string[] = [
    '真实 repository/db 写入 API 尚未接入。',
    '真实文件上传 API 尚未接入。',
    '真实事务提交与回滚 API 尚未接入。',
  ];
  if (hasForbiddenEntityName(entityPlan.entityType))
    warnings.push(`发现禁止业务实体：${entityPlan.entityType}，真实导入计划必须拒绝。`);
  if (entityPlan.recordsCount < 0)
    warnings.push('recordCount 来自 dry-run 计划占位值，真实导入前必须读取源文件确认记录数。');
  if (entityPlan.uniqueKeys.length === 0) warnings.push('缺少唯一键计划，真实导入前必须明确冲突处理策略。');
  const fileFields = extractFileFieldDrafts(entityPlan);
  const sensitiveFields = uniqueStrings([...entityPlan.sensitiveFields, ...fileFields.map((field) => field.fieldName)]);
  return {
    entityType: entityPlan.entityType,
    sourceFile: entityPlan.sourceFile,
    targetCollection: entityPlan.targetCollection,
    importOrder: entityPlan.importOrder,
    dependencies: [...entityPlan.dependencies],
    uniqueKeys: entityPlan.uniqueKeys.map((key) => [...key]),
    sensitiveFields,
    recordCount: entityPlan.recordsCount,
    fileFields,
    relationFields: extractRelationDrafts(entityPlan),
    importNotes: uniqueStrings([
      ...entityPlan.notes,
      ...entityPlan.validationRules.map((rule) => `导入前校验：${rule}`),
      '本草案不新增实体、不删除敏感字段、不调用真实 NocoBase。',
    ]),
    unsupportedFeatures,
    warnings: uniqueStrings(warnings),
  };
}

export function mapSeedDataImportPlanToRealSchemaDraft(
  importPlan: SeedDataImportPlan,
): RealSeedDataEntitySchemaDraft[] {
  return importPlan.entities
    .slice()
    .sort((left, right) => left.importOrder - right.importOrder)
    .map((entityPlan) => mapSeedDataEntityPlanToRealSchemaDraft(entityPlan));
}
