/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

declare const require: any;

import type { SeedDataEntityType, SeedDataImportPlan, ValidationResult } from './types';
import {
  buildSeedDataSensitiveFieldPlan,
  buildSeedDataUniqueKeyPlan,
  getDefaultSeedDataImportOrder,
} from './seedDataImportPlan';

const fs = require('fs');
const path = require('path');

export type SeedDataByEntity = Partial<Record<SeedDataEntityType, any[]>>;

const ok = (warnings: string[] = []): ValidationResult => ({ passed: true, errors: [], warnings });
const result = (errors: string[], warnings: string[] = []): ValidationResult => ({
  passed: errors.length === 0,
  errors,
  warnings,
});
const records = (data: SeedDataByEntity, entity: SeedDataEntityType): any[] => data[entity] ?? [];
const textOf = (value: unknown): string => JSON.stringify(value).toLowerCase();
const hasForbidden = (value: unknown): boolean =>
  ['booking', 'reservation', 'short_rental_orders', 'driver_login', 'vehicle_category_rental'].some((item) =>
    textOf(value).includes(item),
  );
const idSet = (items: any[], key: string): Set<string> => new Set(items.map((item) => item?.[key]).filter(Boolean));
const addIfMissing = (errors: string[], set: Set<string>, value: string, message: string): void => {
  if (value && !set.has(value)) errors.push(message);
};
const keyValue = (item: any, keys: string[]): string => keys.map((key) => String(item?.[key] ?? '')).join('::');
const hasAllKeys = (item: any, keys: string[]): boolean =>
  keys.every((key) => item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== '');
const isPlaceholder = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return true;
  const text = String(value);
  return (
    text.includes('TEST') ||
    text.includes('[已隐藏]') ||
    text.includes('mock') ||
    text.includes('placeholder') ||
    text.includes('占位') ||
    text === '***'
  );
};

export const validateSeedDataImportPlan = (plan: SeedDataImportPlan): ValidationResult => {
  const errors: string[] = [];
  if (!plan.entities.length) errors.push('测试数据导入计划必须包含 entities。');
  if (!plan.importOrder.length) errors.push('测试数据导入计划 importOrder 不能为空。');
  const entityTypes = new Set(plan.entities.map((entity) => entity.entityType));
  for (const entityType of getDefaultSeedDataImportOrder())
    if (!entityTypes.has(entityType)) errors.push(`缺少核心导入实体：${entityType}`);
  const orderIndex = new Map(plan.importOrder.map((entityType, index) => [entityType, index]));
  for (const dependency of plan.dependencies) {
    if ((orderIndex.get(dependency.dependsOn) ?? 999) >= (orderIndex.get(dependency.entityType) ?? -1)) {
      errors.push(`导入顺序错误：${dependency.dependsOn} 必须早于 ${dependency.entityType}`);
    }
  }
  if (hasForbidden(plan)) errors.push('导入计划中不得包含短租、司机登录或按车型出租对象。');
  const planText = textOf(plan);
  if (planText.includes('gps_rent_calculation') || planText.includes('gps 参与租金计算'))
    errors.push('GPS 不得参与租金计算。');
  if (planText.includes('deposit_as_rent_payment') || planText.includes('押金计入租金收入'))
    errors.push('押金不得计入租金收入。');
  const sensitivePlan = buildSeedDataSensitiveFieldPlan();
  for (const entity of plan.entities) {
    for (const field of sensitivePlan[entity.entityType]) {
      if (!entity.sensitiveFields.includes(field)) errors.push(`敏感字段未标记：${entity.entityType}.${field}`);
    }
  }
  return result(errors);
};

export const validateSeedDataFilesExist = (plan: SeedDataImportPlan, sourceDir: string): ValidationResult => {
  const errors = plan.entities
    .filter((entity) => entity.required && !fs.existsSync(path.join(sourceDir, entity.sourceFile)))
    .map((entity) => `缺少生成文件：${entity.sourceFile}`);
  return result(errors);
};

export const validateSeedDataReferences = (data: SeedDataByEntity): ValidationResult => {
  const errors: string[] = [];
  const drivers = idSet(records(data, 'drivers'), 'driver_id');
  const vehicles = idSet(records(data, 'vehicles'), 'vehicle_id');
  const contracts = idSet(records(data, 'lease_contracts'), 'contract_id');
  const ledgers = idSet(records(data, 'rent_daily_ledgers'), 'ledger_id');
  const payments = idSet(records(data, 'rent_payments'), 'payment_id');
  const devices = idSet(records(data, 'gps_devices'), 'device_id');
  for (const contract of records(data, 'lease_contracts')) {
    addIfMissing(errors, drivers, contract.driver_id, `合同引用不存在的 driver_id：${contract.contract_id}`);
    addIfMissing(errors, vehicles, contract.vehicle_id, `合同引用不存在的 vehicle_id：${contract.contract_id}`);
  }
  for (const item of records(data, 'contract_billing_weeks'))
    addIfMissing(errors, contracts, item.contract_id, `计费周引用不存在的 contract_id：${item.billing_week_id}`);
  for (const ledger of records(data, 'rent_daily_ledgers')) {
    addIfMissing(errors, contracts, ledger.contract_id, `台账引用不存在的 contract_id：${ledger.ledger_id}`);
    addIfMissing(errors, drivers, ledger.driver_id, `台账引用不存在的 driver_id：${ledger.ledger_id}`);
    addIfMissing(errors, vehicles, ledger.vehicle_id, `台账引用不存在的 vehicle_id：${ledger.ledger_id}`);
  }
  for (const allocation of records(data, 'rent_payment_allocations')) {
    addIfMissing(
      errors,
      payments,
      allocation.payment_id,
      `付款分配引用不存在的 payment_id：${allocation.allocation_id}`,
    );
    addIfMissing(errors, ledgers, allocation.ledger_id, `付款分配引用不存在的 ledger_id：${allocation.allocation_id}`);
  }
  for (const deposit of records(data, 'deposit_records'))
    addIfMissing(errors, contracts, deposit.contract_id, `押金引用不存在的 contract_id：${deposit.deposit_id}`);
  for (const snapshot of records(data, 'gps_location_snapshots'))
    addIfMissing(errors, devices, snapshot.device_id, `GPS 位置引用不存在的 device_id：${snapshot.snapshot_id}`);
  for (const mileage of records(data, 'gps_daily_mileages'))
    addIfMissing(errors, devices, mileage.device_id, `GPS 里程引用不存在的 device_id：${mileage.mileage_id}`);
  for (const doc of records(data, 'contract_documents'))
    addIfMissing(errors, contracts, doc.contract_id, `合同文件引用不存在的 contract_id：${doc.document_id}`);
  return result(errors);
};

export const validateSeedDataUniqueKeys = (data: SeedDataByEntity): ValidationResult => {
  const errors: string[] = [];
  const plan = buildSeedDataUniqueKeyPlan();
  for (const [entityType, uniqueKeyGroups] of Object.entries(plan) as [SeedDataEntityType, string[][]][]) {
    for (const keys of uniqueKeyGroups) {
      const usable = records(data, entityType).filter((item) => hasAllKeys(item, keys));
      if (usable.length === 0) continue;
      const seen = new Set<string>();
      for (const item of usable) {
        const value = keyValue(item, keys);
        if (seen.has(value)) errors.push(`${entityType} 唯一键重复：${keys.join(' + ')} = ${value}`);
        seen.add(value);
      }
    }
  }
  return result(errors);
};

export const validateNoSensitiveRealData = (data: SeedDataByEntity): ValidationResult => {
  const errors: string[] = [];
  const allText = textOf(data);
  if (/\b1[3-9]\d{9}\b/.test(allText)) errors.push('测试数据中包含疑似真实手机号。');
  if (/\b\d{15}(\d{2}[0-9x])?\b/i.test(allText)) errors.push('测试数据中包含疑似真实身份证号。');
  if (/(https?:\/\/|file:\/\/|\/uploads\/).*(screenshot|scan|contract|payment)/i.test(allText))
    errors.push('测试数据中包含疑似真实付款截图或合同扫描件 URL。');
  const inspect = (value: unknown, trail = ''): void => {
    if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${trail}[${index}]`));
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (['access_token', 'login_key', 'token'].includes(lower) && !isPlaceholder(child))
        errors.push(`测试数据中包含疑似真实 ${key}：${trail}.${key}`);
      inspect(child, trail ? `${trail}.${key}` : key);
    }
  };
  inspect(data);
  return result(errors);
};

export const validateRentLedgerBusinessRules = (data: SeedDataByEntity): ValidationResult => {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const ledger of records(data, 'rent_daily_ledgers')) {
    const key = `${ledger.contract_id}:${ledger.rent_date}`;
    if (seen.has(key)) errors.push(`每日台账 contract_id + rent_date 重复：${key}`);
    seen.add(key);
    if (!ledger.is_payable && ledger.due_amount !== 0) errors.push(`免租日 due_amount 必须为 0：${ledger.ledger_id}`);
    if (ledger.is_payable && ledger.due_amount <= 0) errors.push(`应收日 due_amount 必须大于 0：${ledger.ledger_id}`);
    if ((ledger.paid_amount ?? 0) + (ledger.waived_amount ?? 0) > (ledger.due_amount ?? 0))
      errors.push(`单日不能超付：${ledger.ledger_id}`);
    if (ledger.future_receivable === true && (ledger.balance_amount ?? 0) < 0)
      errors.push(`未来应收不得计入当前欠款为负：${ledger.ledger_id}`);
  }
  if (hasForbidden(records(data, 'rent_daily_ledgers'))) errors.push('台账数据中不得包含短租订单。');
  return result(errors);
};

export const validatePaymentAllocationBusinessRules = (data: SeedDataByEntity): ValidationResult => {
  const errors: string[] = [];
  const ledgerMap = new Map(records(data, 'rent_daily_ledgers').map((ledger) => [ledger.ledger_id, ledger]));
  const allocationSumByPayment = new Map<string, number>();
  const allocationSumByLedger = new Map<string, number>();
  for (const allocation of records(data, 'rent_payment_allocations')) {
    const ledger = ledgerMap.get(allocation.ledger_id);
    if (!ledger) {
      errors.push(`付款分配指向不存在的 ledger：${allocation.allocation_id}`);
      continue;
    }
    if (!ledger.is_payable) errors.push(`付款分配不得分配到免租日：${allocation.allocation_id}`);
    allocationSumByPayment.set(
      allocation.payment_id,
      (allocationSumByPayment.get(allocation.payment_id) ?? 0) + allocation.allocated_amount,
    );
    const ledgerSum = (allocationSumByLedger.get(allocation.ledger_id) ?? 0) + allocation.allocated_amount;
    allocationSumByLedger.set(allocation.ledger_id, ledgerSum);
    if (ledgerSum > ledger.due_amount) errors.push(`付款分配导致单日超付：${allocation.ledger_id}`);
  }
  for (const payment of records(data, 'rent_payments')) {
    const sum = allocationSumByPayment.get(payment.payment_id) ?? 0;
    if (!['reversed', 'cancelled', 'voided'].includes(payment.status) && sum !== payment.paid_amount)
      errors.push(`付款金额应等于 allocation 合计：${payment.payment_no}`);
    if (
      String(payment.remark ?? '')
        .toLowerCase()
        .includes('prepayment')
    )
      errors.push(`不允许预收款：${payment.payment_no}`);
  }
  return result(errors);
};

export const validateDepositBusinessRules = (data: SeedDataByEntity): ValidationResult => {
  const errors: string[] = [];
  if (records(data, 'rent_payments').some((payment) => textOf(payment).includes('deposit')))
    errors.push('押金不得计入 rent_payments。');
  for (const deposit of records(data, 'deposit_records')) {
    if ((deposit.received_amount ?? 0) < 0) errors.push(`押金 received_amount 不得为负：${deposit.deposit_id}`);
    if ((deposit.deducted_amount ?? 0) > (deposit.received_amount ?? 0))
      errors.push(`押金 deducted_amount 不得超过 received_amount：${deposit.deposit_id}`);
    const refundable = Math.max(0, (deposit.received_amount ?? 0) - (deposit.deducted_amount ?? 0));
    if ((deposit.refunded_amount ?? 0) > refundable)
      errors.push(`押金 refunded_amount 不得超过可退金额：${deposit.deposit_id}`);
  }
  if (textOf(records(data, 'lease_contracts')).includes('deposit_as_rent_payment'))
    errors.push('押金不得计入 total_paid_amount。');
  return result(errors);
};

export const validateGpsMockRules = (data: SeedDataByEntity): ValidationResult => {
  const errors: string[] = [];
  const gpsText = textOf({
    snapshots: records(data, 'gps_location_snapshots'),
    mileages: records(data, 'gps_daily_mileages'),
  });
  if (gpsText.includes('gps_rent_calculation') || gpsText.includes('gps 参与租金计算'))
    errors.push('GPS 数据不得参与租金计算。');
  const mileageValidation = validateSeedDataUniqueKeys({ gps_daily_mileages: records(data, 'gps_daily_mileages') });
  errors.push(...mileageValidation.errors.filter((error) => error.includes('gps_daily_mileages')));
  const sensitive = validateNoSensitiveRealData({
    gps_location_snapshots: records(data, 'gps_location_snapshots'),
    gps_daily_mileages: records(data, 'gps_daily_mileages'),
  });
  errors.push(...sensitive.errors);
  return result(errors);
};

export const validateSeedDataForImport = (plan: SeedDataImportPlan, data: SeedDataByEntity): ValidationResult => {
  const validations = [
    validateSeedDataImportPlan(plan),
    validateSeedDataReferences(data),
    validateSeedDataUniqueKeys(data),
    validateNoSensitiveRealData(data),
    validateRentLedgerBusinessRules(data),
    validatePaymentAllocationBusinessRules(data),
    validateDepositBusinessRules(data),
    validateGpsMockRules(data),
  ];
  return {
    passed: validations.every((item) => item.passed),
    errors: validations.flatMap((item) => item.errors),
    warnings: validations.flatMap((item) => item.warnings),
  };
};

export const validateSeedDataImportResultBoundaries = (data: SeedDataByEntity): ValidationResult =>
  hasForbidden(data) ? result(['测试数据中不得包含短租、司机登录或按车型出租对象。']) : ok();
