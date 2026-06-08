/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  AutomatedGoLiveRegistrationPlan,
  NocobaseServicePlan,
  RuntimeRegistrationBatchResult,
  RuntimeRegistrationPlan,
} from './types';
import { normalizeServicePlans } from './servicePlanNormalizer';
import { normalizeActionPlans } from './actionPlanNormalizer';
import { normalizePermissionPlans } from './permissionPlanNormalizer';
import { normalizeSchedulePlans } from './schedulePlanNormalizer';
import { normalizeI18nPlans } from './i18nPlanNormalizer';
import { MockRuntimeAdapter } from './mockRuntimeAdapter';
import {
  CORE_SERVICE_NAMES,
  validateCoreActionCoverage,
  validateCoreServiceCoverage,
  validateRolePermissionCoverage,
  validateRuntimeForbiddenPatterns,
  validateRuntimeRegistrationPlan,
} from './runtimeRegistrationValidator';

const transactionalNames = new Set([
  'activateLeaseContract',
  'generateFixedTermDailyLedgers',
  'ensureOpenEndedDailyLedgers',
  'allocateRentPayment',
  'reverseRentPayment',
  'approveRentWaiver',
  'createDepositRecord',
  'deductDeposit',
  'refundDeposit',
]);

const servicePluginMap: Record<string, string> = {
  generateContractDocuments: 'plugin-contract-documents',
  getContractTemplateByLanguage: 'plugin-contract-documents',
  markContractPrinted: 'plugin-contract-documents',
  uploadSignedContractScan: 'plugin-contract-documents',
  voidContractDocument: 'plugin-contract-documents',
  getIopgpsAccessToken: 'plugin-iopgps',
  syncIopgpsDeviceStatus: 'plugin-iopgps',
  syncIopgpsLocation: 'plugin-iopgps',
  syncIopgpsDailyMileage: 'plugin-iopgps',
  normalizeIopgpsStatus: 'plugin-iopgps',
};

const serviceNotes = (serviceName: string, sourcePlugin: string): string[] => {
  if (sourcePlugin === 'plugin-iopgps') {
    return ['runtime dry-run 核心服务计划；不调用真实 IOPGPS API。', 'GPS 数据不参与租金计算。'];
  }
  if (sourcePlugin === 'plugin-contract-documents') {
    return ['runtime dry-run 核心服务计划；不真实生成合同文件。', '合同文件服务不处理租金计算，不处理付款分配。'];
  }
  if (serviceName.includes('Deposit')) {
    return ['runtime dry-run 核心服务计划；押金和租金分开管理。', '押金不计入租金已付。'];
  }
  return ['runtime dry-run 核心服务计划；不连接真实 NocoBase，不写数据库。'];
};

const buildCoreServicePlan = (serviceName: string): NocobaseServicePlan => {
  const sourcePlugin = servicePluginMap[serviceName] ?? 'plugin-rental-core';
  return {
    name: `${sourcePlugin}.${serviceName}`,
    sourcePlugin,
    handlerName: serviceName,
    permissions: ['后续接入真实 NocoBase 服务端权限'],
    transactional: transactionalNames.has(serviceName),
    notes: serviceNotes(serviceName, sourcePlugin),
  };
};

const ensureCoreServices = (services: NocobaseServicePlan[]): NocobaseServicePlan[] => {
  const normalized = normalizeServicePlans(services);
  const existing = new Set(normalized.flatMap((service) => [service.handlerName, service.name]));
  const missing = CORE_SERVICE_NAMES.filter(
    (serviceName) =>
      !existing.has(serviceName) &&
      !existing.has(`plugin-rental-core.${serviceName}`) &&
      !existing.has(`plugin-contract-documents.${serviceName}`) &&
      !existing.has(`plugin-iopgps.${serviceName}`),
  );
  return [...normalized, ...missing.map((serviceName) => buildCoreServicePlan(serviceName))];
};

export const buildRuntimeRegistrationPlanFromAutomatedPlan = (
  automatedPlan: AutomatedGoLiveRegistrationPlan,
): RuntimeRegistrationPlan => ({
  services: ensureCoreServices(automatedPlan.services),
  actions: normalizeActionPlans(automatedPlan.actions),
  permissions: normalizePermissionPlans(automatedPlan.permissions),
  schedules: normalizeSchedulePlans(automatedPlan.schedules),
  i18n: normalizeI18nPlans(automatedPlan.i18n),
  warnings: [
    ...automatedPlan.warnings,
    'runtime dry-run 不连接真实 NocoBase，不注册真实 API、按钮、ACL、定时任务或 i18n。',
  ],
  notes: [...automatedPlan.notes, '本 runtime 计划只补齐服务、动作、权限、定时任务和 i18n 的 dry-run 注册顺序。'],
});

const emptyRuntimeResult = (
  runtimePlan: RuntimeRegistrationPlan,
  errors: string[],
  warnings: string[],
): RuntimeRegistrationBatchResult => ({
  success: false,
  serviceResults: [],
  actionResults: [],
  permissionResults: [],
  scheduleResults: [],
  i18nResults: [],
  warnings,
  errors,
  summary: {
    serviceCount: runtimePlan.services.length,
    actionCount: runtimePlan.actions.length,
    permissionRoleCount: runtimePlan.permissions.length,
    scheduleCount: runtimePlan.schedules.length,
    i18nNamespaceCount: runtimePlan.i18n.length,
    successCount: 0,
    registeredCount: 0,
    skippedCount: 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    dryRunOnly: true,
  },
});

export const dryRunRegisterRuntime = (runtimePlan: RuntimeRegistrationPlan): RuntimeRegistrationBatchResult => {
  const normalizedPlan: RuntimeRegistrationPlan = {
    ...runtimePlan,
    services: normalizeServicePlans(runtimePlan.services),
    actions: normalizeActionPlans(runtimePlan.actions),
    permissions: normalizePermissionPlans(runtimePlan.permissions),
    schedules: normalizeSchedulePlans(runtimePlan.schedules),
    i18n: normalizeI18nPlans(runtimePlan.i18n),
  };
  const validations = [
    validateRuntimeRegistrationPlan(normalizedPlan),
    validateCoreServiceCoverage(normalizedPlan),
    validateCoreActionCoverage(normalizedPlan),
    validateRolePermissionCoverage(normalizedPlan),
    validateRuntimeForbiddenPatterns(normalizedPlan),
  ];
  const errors = validations.flatMap((validation) => validation.errors);
  const warnings = [
    ...normalizedPlan.warnings,
    ...validations.flatMap((validation) => validation.warnings),
    '本次 runtime 注册仅为 dry-run，不连接真实 NocoBase。',
    '本次 runtime 注册不写数据库、不注册真实 API、不注册真实按钮、不注册真实 ACL、不执行真实定时任务。',
  ];

  if (errors.length > 0) {
    return emptyRuntimeResult(normalizedPlan, errors, warnings);
  }

  const adapter = new MockRuntimeAdapter();
  const serviceResults = adapter.registerServices(normalizedPlan.services);
  const actionResults = adapter.registerActions(normalizedPlan.actions);
  const permissionResults = adapter.registerPermissions(normalizedPlan.permissions);
  const scheduleResults = adapter.registerSchedules(normalizedPlan.schedules);
  const i18nResults = adapter.registerI18n(normalizedPlan.i18n);
  const allResults = [...serviceResults, ...actionResults, ...permissionResults, ...scheduleResults, ...i18nResults];
  const resultWarnings = [...warnings, ...allResults.flatMap((result) => result.warnings)];
  const resultErrors = allResults.flatMap((result) => result.errors);

  return {
    success: allResults.every((result) => result.success) && resultErrors.length === 0,
    serviceResults,
    actionResults,
    permissionResults,
    scheduleResults,
    i18nResults,
    warnings: resultWarnings,
    errors: resultErrors,
    summary: {
      serviceCount: serviceResults.length,
      actionCount: actionResults.length,
      permissionRoleCount: permissionResults.length,
      scheduleCount: scheduleResults.length,
      i18nNamespaceCount: i18nResults.length,
      successCount: allResults.filter((result) => result.success).length,
      registeredCount: allResults.filter((result) => result.registered).length,
      skippedCount: allResults.filter((result) => result.skipped).length,
      errorCount: resultErrors.length,
      warningCount: resultWarnings.length,
      dryRunOnly: true,
    },
  };
};

export const summarizeRuntimeRegistrationResult = (result: RuntimeRegistrationBatchResult): string =>
  [
    `服务数量：${result.summary.serviceCount}`,
    `动作数量：${result.summary.actionCount}`,
    `权限角色数量：${result.summary.permissionRoleCount}`,
    `定时任务数量：${result.summary.scheduleCount}`,
    `i18n 命名空间数量：${result.summary.i18nNamespaceCount}`,
    `成功数量：${result.summary.successCount}`,
    `注册记录数量：${result.summary.registeredCount}`,
    `跳过数量：${result.summary.skippedCount}`,
    `错误数量：${result.summary.errorCount}`,
    `警告数量：${result.summary.warningCount}`,
    'dry-run 限制：不连接真实 NocoBase，不注册真实 API、按钮、ACL、定时任务或 i18n。',
  ].join('\n');
