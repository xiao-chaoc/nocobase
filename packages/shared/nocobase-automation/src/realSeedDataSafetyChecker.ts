/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RealSeedDataImportContext, RealSeedDataImportPlan, ValidationResult } from './types';

const requiredEntities = [
  'drivers',
  'vehicles',
  'lease_contracts',
  'rent_daily_ledgers',
  'rent_payments',
  'rent_payment_allocations',
  'deposit_records',
];
const gpsMockEntities = ['gps_devices', 'gps_location_snapshots', 'gps_daily_mileages'];
const forbiddenTerms = [
  'booking',
  'reservation',
  'short_rental_order',
  'driver_login',
  'customer_portal',
  'vehicle_category_rental',
];
const forbiddenRuleTerms = ['gps_rent_calculation', 'deposit_as_rent_payment'];

const result = (errors: string[], warnings: string[] = []): ValidationResult => ({
  passed: errors.length === 0,
  errors,
  warnings,
});
const jsonText = (value: unknown): string => JSON.stringify(value).toLowerCase();

export function validateRealSeedDataImportSafety(
  plan: RealSeedDataImportPlan,
  context: RealSeedDataImportContext,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (context.mode === 'real') {
    if (!context.allowRealExecution) errors.push('real 模式必须显式 allowRealExecution=true，否则拒绝。');
    if (!context.requireBackup) errors.push('real 模式必须要求备份。');
    if (!context.requireRollbackPlan) errors.push('real 模式必须要求回滚计划。');
    if (!context.requireTransaction) errors.push('real 模式必须要求事务。');
    if (context.adapterEnvironment.status !== 'ready') errors.push('adapterEnvironment 未 ready，不能执行 real。');
    errors.push('当前仓库环境下不能执行 real 模式。');
    errors.push('当前仓库不允许真实执行数据库写入。');
    errors.push('当前仓库不允许真实文件上传。');
    errors.push('当前仓库不允许真实生产环境执行。');
  }
  if (plan.mode === 'real') errors.push('计划 mode 不能在当前仓库设为 real。');
  if (!plan.rollbackPlan || plan.rollbackPlan.length === 0) errors.push('缺少 rollbackPlan，不能进入真实导入准备。');
  if (!plan.transactionPlan || plan.transactionPlan.length === 0)
    errors.push('缺少 transactionPlan，不能进入真实导入准备。');
  if (context.mode !== 'real')
    warnings.push('当前仅允许 plan_only、validate_only 或 dry_run，真实导入必须进入下一阶段。');
  return result(errors, warnings);
}

export function validateRealSeedDataSchemaDraft(plan: RealSeedDataImportPlan): ValidationResult {
  const errors: string[] = [];
  if (plan.entities.length === 0) errors.push('entities 不能为空。');
  if (plan.steps.length === 0) errors.push('steps 不能为空。');
  if (!plan.transactionPlan || plan.transactionPlan.length === 0) errors.push('transactionPlan 必须存在。');
  if (!plan.rollbackPlan || plan.rollbackPlan.length === 0) errors.push('rollbackPlan 必须存在。');
  if (!plan.postImportValidationPlan || plan.postImportValidationPlan.length === 0)
    errors.push('postImportValidationPlan 必须存在。');
  const entityNames = plan.entities.map((entity) => entity.entityType);
  for (const name of [...requiredEntities, ...gpsMockEntities, 'contract_documents']) {
    if (!entityNames.includes(name)) errors.push(`必须包含实体 ${name}。`);
  }
  const text = jsonText(plan);
  for (const term of forbiddenTerms) if (text.includes(term)) errors.push(`不允许包含 ${term}。`);
  if (text.includes('gps_rent_calculation')) errors.push('GPS 数据不得参与租金计算。');
  if (text.includes('deposit_as_rent_payment')) errors.push('押金不得计入租金已付。');
  for (const entity of plan.entities) {
    for (const fileField of entity.fileFields) {
      if (!fileField.sensitive) errors.push(`文件字段必须标记敏感：${entity.entityType}.${fileField.fieldName}`);
    }
    for (const field of entity.sensitiveFields) {
      if ((field.includes('access_token') || field.includes('login_key')) && !field.includes('raw_response'))
        errors.push(`${field} 不能作为真实值导入。`);
    }
  }
  for (const term of forbiddenRuleTerms) if (text.includes(term)) errors.push(`不允许包含 ${term}。`);
  return result(errors);
}

export function validateRealSeedDataNoRealData(plan: RealSeedDataImportPlan): ValidationResult {
  const errors: string[] = [];
  const text = jsonText(plan);
  for (const entity of plan.entities) {
    for (const fileField of entity.fileFields) {
      const strategy = `${fileField.placeholderStrategy} ${fileField.notes.join(' ')}`.toUpperCase();
      if (!strategy.includes('TEST_') && !strategy.includes('MOCK'))
        errors.push(`文件字段缺少 TEST_ 或 MOCK 占位策略：${entity.entityType}.${fileField.fieldName}`);
    }
  }
  if (/https?:\/\/(?!test|mock|example|localhost)/i.test(text)) errors.push('计划中疑似包含真实 URL。');
  if (/\b\d{17}[0-9x]\b/i.test(text)) errors.push('计划中疑似包含真实证件号。');
  if (/\b1[3-9]\d{9}\b/.test(text)) errors.push('计划中疑似包含真实手机号。');
  if (/access_token\s*[:=]\s*(?!test|mock|占位|\[已隐藏\])/i.test(text))
    errors.push('计划中疑似包含真实 IOPGPS access_token。');
  if (/login_key\s*[:=]\s*(?!test|mock|占位|\[已隐藏\])/i.test(text)) errors.push('计划中疑似包含真实 login_key。');
  if (text.includes('signed_scan_file') && !text.includes('test_') && !text.includes('mock'))
    errors.push('合同扫描件只能使用 TEST_ 或 MOCK 占位。');
  return result(errors);
}
