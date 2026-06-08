/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AutomatedGoLiveRegistrationPlan, NocobaseCollectionPlan, ValidationResult } from './types';

const expectedPluginOrder = ['plugin-rental-core', 'plugin-contract-documents', 'plugin-iopgps'];
const requiredCollections = [
  'drivers',
  'vehicles',
  'lease_contracts',
  'rent_daily_ledgers',
  'rent_payments',
  'rent_payment_allocations',
  'deposit_records',
  'operation_logs',
  'gps_devices',
  'gps_daily_mileages',
  'iopgps_settings',
  'contract_templates',
  'contract_documents',
];
const requiredUniqueRules: Array<{ collection: string; fields: string[] }> = [
  { collection: 'rent_daily_ledgers', fields: ['contract_id', 'rent_date'] },
  { collection: 'vehicles', fields: ['plate_no'] },
  { collection: 'gps_devices', fields: ['imei'] },
  { collection: 'gps_daily_mileages', fields: ['device_id', 'mileage_date'] },
  { collection: 'contract_documents', fields: ['document_no'] },
];
const forbiddenTerms = [
  'booking',
  'reservation',
  'short_rental_orders',
  'driver_login',
  'customer_portal',
  'vehicle_category_rental',
];

function combineResults(...results: ValidationResult[]): ValidationResult {
  return {
    passed: results.every((result) => result.passed),
    errors: results.flatMap((result) => result.errors),
    warnings: results.flatMap((result) => result.warnings),
  };
}

function hasCollection(plan: AutomatedGoLiveRegistrationPlan, name: string): boolean {
  return plan.collections.some((collection) => collection.name === name);
}

function hasAnyText(plan: AutomatedGoLiveRegistrationPlan, patterns: string[]): boolean {
  const text = JSON.stringify(plan);
  return patterns.some((pattern) => text.includes(pattern));
}

function hasUniqueConstraint(collection: NocobaseCollectionPlan | undefined, fields: string[]): boolean {
  if (!collection) return false;
  return collection.uniqueConstraints.some(
    (constraint) => fields.every((field) => constraint.includes(field)) && constraint.length === fields.length,
  );
}

export function validateCollectionUniquenessRules(plan: AutomatedGoLiveRegistrationPlan): ValidationResult {
  const errors: string[] = [];
  for (const rule of requiredUniqueRules) {
    const collection = plan.collections.find((item) => item.name === rule.collection);
    if (!hasUniqueConstraint(collection, rule.fields))
      errors.push(`${rule.collection} 缺少唯一约束：${rule.fields.join(' + ')}`);
  }
  return { passed: errors.length === 0, errors, warnings: [] };
}

export function validateSensitiveFieldCoverage(plan: AutomatedGoLiveRegistrationPlan): ValidationResult {
  const errors: string[] = [];
  const sensitiveText = [
    ...plan.collections.flatMap((collection) => collection.sensitiveFields),
    ...plan.permissions.flatMap((permission) => permission.sensitiveFields),
    JSON.stringify(plan.permissions),
    JSON.stringify(plan.collections),
  ].join('|');
  const requiredGroups: Array<{ label: string; aliases: string[] }> = [
    { label: '司机证件号', aliases: ['id_no', 'driver_id_no'] },
    { label: '司机证件照片', aliases: ['id_front_file', 'id_back_file', 'driver_id_files'] },
    { label: '驾照照片', aliases: ['license_front_file', 'license_back_file', 'driver_license_files'] },
    { label: '付款截图', aliases: ['screenshot_file', 'payment_screenshot'] },
    { label: '付款方式', aliases: ['payment_method', 'method'] },
    {
      label: '押金金额',
      aliases: [
        'deposit_required_amount',
        'deposit_received_amount',
        'required_amount',
        'received_amount',
        'available_amount',
      ],
    },
    { label: '总已付金额', aliases: ['total_paid_amount', 'paid_amount'] },
    { label: '总欠款金额', aliases: ['current_debt_amount', 'balance_amount'] },
    { label: '未来应收金额', aliases: ['future_receivable_amount'] },
    { label: 'IOPGPS login_key', aliases: ['login_key', 'login_key_encrypted'] },
    { label: 'IOPGPS access_token', aliases: ['access_token'] },
    { label: '合同扫描件', aliases: ['signed_scan_file', 'contract_scan'] },
  ];
  for (const group of requiredGroups) {
    if (!group.aliases.some((alias) => sensitiveText.includes(alias))) errors.push(`敏感字段未覆盖：${group.label}`);
  }
  return { passed: errors.length === 0, errors, warnings: [] };
}

export function validateAutomatedRegistrationPlan(plan: AutomatedGoLiveRegistrationPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pluginNames = plan.plugins.map((plugin) => plugin.pluginName);
  if (pluginNames.length !== 3) errors.push('必须包含三个插件。');
  if (pluginNames.join('>') !== expectedPluginOrder.join('>'))
    errors.push(`插件顺序错误，应为：${expectedPluginOrder.join(' -> ')}`);
  const rental = plan.plugins.find((plugin) => plugin.pluginName === 'plugin-rental-core');
  const contract = plan.plugins.find((plugin) => plugin.pluginName === 'plugin-contract-documents');
  const iopgps = plan.plugins.find((plugin) => plugin.pluginName === 'plugin-iopgps');
  if (!rental) errors.push('缺少 plugin-rental-core。');
  if (!contract) errors.push('缺少 plugin-contract-documents。');
  if (!iopgps) errors.push('缺少 plugin-iopgps。');
  if (rental?.dependencies.includes('plugin-iopgps')) errors.push('plugin-rental-core 不得依赖 plugin-iopgps。');
  if (rental?.dependencies.includes('plugin-contract-documents'))
    errors.push('plugin-rental-core 不得依赖 plugin-contract-documents。');
  if (!contract?.dependencies.includes('plugin-rental-core'))
    errors.push('plugin-contract-documents 必须依赖 plugin-rental-core。');
  if (!iopgps?.dependencies.includes('plugin-rental-core')) errors.push('plugin-iopgps 必须依赖 plugin-rental-core。');
  for (const collection of requiredCollections) {
    if (!hasCollection(plan, collection)) errors.push(`缺少核心 Collection：${collection}`);
  }
  if (plan.actions.length === 0) errors.push('必须有核心 Actions。');
  if (plan.permissions.length === 0) errors.push('必须有核心 Permissions。');
  if (plan.i18n.length === 0) errors.push('必须有 i18n 计划。');
  if (plan.pages.length === 0) errors.push('必须有页面计划。');
  if (plan.smokeTests.length === 0) errors.push('必须有 smoke test 计划。');
  const text = JSON.stringify(plan);
  for (const forbidden of forbiddenTerms) {
    if (text.includes(forbidden)) errors.push(`不允许出现对象或逻辑：${forbidden}`);
  }
  if (text.includes('GPS 参与租金计算')) errors.push('GPS 计划不得参与租金计算。');
  if (!hasAnyText(plan, ['GPS 数据不参与租金计算', 'GPS 不参与租金计算', 'GPS 里程只用于运营核查']))
    errors.push('GPS 计划必须明确不参与租金计算。');
  if (!hasAnyText(plan, ['押金不计入租金收入', '押金不计入租金已付', '押金和租金分开管理']))
    errors.push('押金计划必须明确不计入租金已付或租金收入。');
  const combined = combineResults(
    { passed: errors.length === 0, errors, warnings },
    validateSensitiveFieldCoverage(plan),
    validateCollectionUniquenessRules(plan),
  );
  return combined;
}
