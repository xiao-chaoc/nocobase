/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RuntimeRegistrationPlan, ValidationResult } from './types';
import { normalizeServicePlans } from './servicePlanNormalizer';
import { normalizeActionPlans } from './actionPlanNormalizer';
import { normalizePermissionPlans } from './permissionPlanNormalizer';
import { normalizeSchedulePlans } from './schedulePlanNormalizer';
import { normalizeI18nPlans, requiredRuntimeLanguages } from './i18nPlanNormalizer';

export const CORE_SERVICE_NAMES = [
  'activateLeaseContract',
  'generateFixedTermDailyLedgers',
  'ensureOpenEndedDailyLedgers',
  'buildDailyLedgerForDate',
  'validateDefaultFreeWeekdays',
  'createRentPayment',
  'validatePaymentAllocations',
  'validateNoOverpayment',
  'allocateRentPayment',
  'reverseRentPayment',
  'markUnpaidReason',
  'requestRentWaiver',
  'approveRentWaiver',
  'refreshLedgerPaymentStatus',
  'refreshContractFinancialSummary',
  'getDriverCalendarData',
  'filterCalendarSensitiveData',
  'createDepositRecord',
  'deductDeposit',
  'refundDeposit',
  'recordOperationLog',
  'generateContractDocuments',
  'getContractTemplateByLanguage',
  'markContractPrinted',
  'uploadSignedContractScan',
  'voidContractDocument',
  'getIopgpsAccessToken',
  'syncIopgpsDeviceStatus',
  'syncIopgpsLocation',
  'syncIopgpsDailyMileage',
  'normalizeIopgpsStatus',
];

export const CORE_ACTION_NAMES = [
  'activate_contract',
  'generate_fixed_term_ledgers',
  'ensure_open_ended_ledgers',
  'confirm_rent_payment',
  'reverse_rent_payment',
  'mark_unpaid_reason',
  'request_rent_waiver',
  'approve_rent_waiver',
  'create_deposit',
  'deduct_deposit',
  'refund_deposit',
  'generate_contract_documents',
  'mark_contract_printed',
  'upload_signed_contract_scan',
  'void_contract_document',
  'sync_device_status',
  'sync_location',
  'sync_daily_mileage',
];

export const CORE_ROLE_NAMES = [
  'system_admin',
  'manager',
  'accountant',
  'operator',
  'gps_maintenance',
  'readonly_auditor',
];

const combine = (...results: ValidationResult[]): ValidationResult => ({
  passed: results.every((result) => result.passed),
  errors: results.flatMap((result) => result.errors),
  warnings: results.flatMap((result) => result.warnings),
});

const planText = (plan: RuntimeRegistrationPlan): string => JSON.stringify(plan).toLowerCase();

const hasService = (plan: RuntimeRegistrationPlan, serviceName: string): boolean =>
  normalizeServicePlans(plan.services).some(
    (service) =>
      service.handlerName === serviceName || service.name.endsWith(`.${serviceName}`) || service.name === serviceName,
  );

export const validateCoreServiceCoverage = (plan: RuntimeRegistrationPlan): ValidationResult => {
  const errors = CORE_SERVICE_NAMES.filter((serviceName) => !hasService(plan, serviceName)).map(
    (serviceName) => `缺少核心服务方法：${serviceName}`,
  );
  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validateCoreActionCoverage = (plan: RuntimeRegistrationPlan): ValidationResult => {
  const actions = normalizeActionPlans(plan.actions);
  const actionNames = new Set(actions.map((action) => action.name));
  const errors = CORE_ACTION_NAMES.filter((actionName) => !actionNames.has(actionName)).map(
    (actionName) => `缺少核心动作：${actionName}`,
  );
  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validateRolePermissionCoverage = (plan: RuntimeRegistrationPlan): ValidationResult => {
  const permissions = normalizePermissionPlans(plan.permissions);
  const byRole = new Map(permissions.map((permission) => [permission.role, permission]));
  const errors: string[] = [];

  for (const role of CORE_ROLE_NAMES) {
    if (!byRole.has(role)) errors.push(`缺少权限角色：${role}`);
  }

  const accountant = byRole.get('accountant');
  if (
    accountant &&
    (!accountant.collections.includes('rent_payments') || !accountant.collections.includes('deposit_records'))
  ) {
    errors.push('accountant 必须可访问付款和押金。');
  }

  const operator = byRole.get('operator');
  if (operator && operator.fieldVisibility.payment_screenshot !== 'hidden') {
    errors.push('operator 默认不能查看付款截图。');
  }
  if (
    operator &&
    ['total_paid_amount', 'future_receivable_amount', 'current_debt_amount'].some(
      (field) => operator.fieldVisibility[field] !== 'hidden',
    )
  ) {
    errors.push('operator 默认不能查看敏感财务汇总。');
  }

  const gps = byRole.get('gps_maintenance');
  if (
    gps &&
    ['total_paid_amount', 'future_receivable_amount', 'current_debt_amount', 'payment_screenshot'].some(
      (field) => gps.fieldVisibility[field] !== 'hidden',
    )
  ) {
    errors.push('gps_maintenance 默认不能查看财务汇总和付款截图。');
  }

  const readonly = byRole.get('readonly_auditor');
  if (readonly && readonly.actions.some((action) => action !== 'read')) {
    errors.push('readonly_auditor 默认不可修改。');
  }

  const admin = byRole.get('system_admin');
  if (admin && admin.sensitiveFields.length === 0) {
    errors.push('system_admin 必须可见全部敏感字段。');
  }

  const manager = byRole.get('manager');
  if (manager && !JSON.stringify(manager).includes('审批')) {
    errors.push('manager 必须可审批免除。');
  }

  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validateRuntimeForbiddenPatterns = (plan: RuntimeRegistrationPlan): ValidationResult => {
  const text = planText(plan);
  const forbiddenPatterns = [
    'booking',
    'reservation',
    'short_rental_order',
    'driver_login',
    'customer_portal',
    'vehicle_category_rental',
    'gps_rent_calculation',
    'deposit_as_rent_payment',
  ];
  const errors = forbiddenPatterns
    .filter((pattern) => text.includes(pattern))
    .map((pattern) => `不允许出现 runtime 对象或逻辑：${pattern}`);
  if (text.includes('gps 参与租金计算') || text.includes('gps参与租金计算')) {
    errors.push('GPS 服务不得参与租金计算。');
  }
  if (text.includes('押金计入租金已付') || text.includes('押金作为租金已付')) {
    errors.push('押金服务不得计入租金已付。');
  }
  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validateRuntimeRegistrationPlan = (plan: RuntimeRegistrationPlan): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const services = normalizeServicePlans(plan.services);
  const actions = normalizeActionPlans(plan.actions);
  const permissions = normalizePermissionPlans(plan.permissions);
  const schedules = normalizeSchedulePlans(plan.schedules);
  const i18n = normalizeI18nPlans(plan.i18n);

  if (services.length === 0) errors.push('必须包含服务计划。');
  if (actions.length === 0) errors.push('必须包含动作计划。');
  if (permissions.length === 0) errors.push('必须包含权限计划。');
  if (i18n.length === 0) errors.push('必须包含 i18n 计划。');

  for (const service of services) {
    if (!service.name) errors.push('服务 name 必须存在。');
    if (!service.sourcePlugin) errors.push(`服务 sourcePlugin 必须存在：${service.name || '<未命名服务>'}`);
    if (!service.handlerName) errors.push(`服务 handlerName 必须存在：${service.name || '<未命名服务>'}`);
  }

  for (const action of actions) {
    if (!action.name) errors.push('动作 name 必须存在。');
    if (!action.sourcePlugin) errors.push(`动作 sourcePlugin 必须存在：${action.name || '<未命名动作>'}`);
    if (!action.serviceName) errors.push(`动作 serviceName 必须存在：${action.name || '<未命名动作>'}`);
  }

  for (const schedule of schedules) {
    if (!schedule.name) errors.push('定时任务 name 必须存在。');
    if (!schedule.sourcePlugin) errors.push(`定时任务 sourcePlugin 必须存在：${schedule.name || '<未命名任务>'}`);
    if (!schedule.serviceName) errors.push(`定时任务 serviceName 必须存在：${schedule.name || '<未命名任务>'}`);
  }

  for (const item of i18n) {
    if (!item.namespace) errors.push('i18n namespace 必须存在。');
    for (const language of requiredRuntimeLanguages) {
      if (!item.languages.includes(language)) errors.push(`i18n ${item.namespace || '<未命名>'} 缺少语言：${language}`);
    }
    if (item.localeFiles.length === 0) errors.push(`i18n ${item.namespace || '<未命名>'} 缺少 localeFiles。`);
  }

  const text = planText(plan);
  const contractServices = services.filter((service) => service.sourcePlugin === 'plugin-contract-documents');
  for (const service of contractServices) {
    const serviceText = JSON.stringify(service);
    if (
      serviceText.includes('合同文件服务处理租金') ||
      serviceText.includes('合同文件服务处理付款') ||
      serviceText.includes('contract_documents_handles_rent') ||
      serviceText.includes('contract_documents_handles_payment')
    ) {
      errors.push('合同文件服务不得处理租金或付款。');
    }
  }
  if (
    !text.includes('gps 数据不参与租金计算') &&
    !text.includes('gps 不参与租金计算') &&
    !text.includes('gps 里程只用于运营核查')
  ) {
    warnings.push('runtime 计划应明确 GPS 不参与租金计算。');
  }
  if (!text.includes('押金不计入租金') && !text.includes('押金和租金分开管理')) {
    warnings.push('runtime 计划应明确押金不计入租金已付。');
  }

  return combine(
    { passed: errors.length === 0, errors, warnings },
    validateCoreServiceCoverage(plan),
    validateCoreActionCoverage(plan),
    validateRolePermissionCoverage(plan),
    validateRuntimeForbiddenPatterns(plan),
  );
};
