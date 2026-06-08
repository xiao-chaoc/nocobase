/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RealSmokeTestContext,
  RealSmokeTestPlan,
  RealSmokeTestReportDraft,
  RealSmokeTestStage,
  ValidationResult,
} from './types';

const requiredStages: RealSmokeTestStage[] = [
  'environment_check',
  'collection_registration_check',
  'runtime_registration_check',
  'page_registration_check',
  'seed_data_import_check',
  'core_business_flow_check',
  'permission_check',
  'failure_isolation_check',
  'rollback_check',
];

const forbiddenTerms = [
  'booking',
  'reservation',
  'short_rental_order',
  'driver_login',
  'customer_portal',
  'vehicle_category_rental',
  'gps_rent_calculation',
  'deposit_as_rent_payment',
];

const result = (errors: string[], warnings: string[] = []): ValidationResult => ({
  passed: errors.length === 0,
  errors: [...new Set(errors)],
  warnings: [...new Set(warnings)],
});
const textOf = (value: unknown) => JSON.stringify(value).toLowerCase();

export function validateRealSmokeTestSafety(plan: RealSmokeTestPlan, context: RealSmokeTestContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (plan.mode === 'real') errors.push('计划 mode 不能在当前仓库设为 real。');
  if (context.mode === 'real') {
    if (!context.allowRealExecution) errors.push('real 模式必须显式 allowRealExecution=true，否则拒绝。');
    if (!context.requireBackup) errors.push('real 模式必须 requireBackup=true。');
    if (!context.requireRollbackPlan) errors.push('real 模式必须 requireRollbackPlan=true。');
    if (!context.requireIsolatedDatabase) errors.push('real 模式必须 requireIsolatedDatabase=true。');
    if (!context.requireMockDataOnly) errors.push('real 模式必须 requireMockDataOnly=true。');
    if (!context.requireIopgpsDisabled) errors.push('real 模式必须 requireIopgpsDisabled=true。');
    if (context.adapterEnvironment.status !== 'ready')
      errors.push('adapterEnvironment 必须 ready，否则不能执行 real。');
    errors.push('当前仓库环境下不能执行 real 模式。');
    errors.push('当前仓库不允许真实生产环境执行。');
    errors.push('当前仓库不允许真实 IOPGPS。');
    errors.push('当前仓库不允许真实司机资料。');
    errors.push('当前仓库不允许真实付款截图。');
    errors.push('当前仓库不允许真实合同扫描件。');
  }
  if (context.adapterEnvironment.mode === 'real') errors.push('adapterEnvironment 不能指向真实生产执行模式。');
  if (!context.requireIopgpsDisabled) errors.push('当前草案要求禁用真实 IOPGPS。');
  if (!context.requireMockDataOnly) errors.push('当前草案只允许 mock 数据。');
  if (context.mode !== 'real')
    warnings.push('当前仅允许 plan_only、validate_only 或 dry_run，真实 Smoke Test 必须进入下一阶段。');
  return result(errors, warnings);
}

export function validateRealSmokeTestPlan(plan: RealSmokeTestPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!plan.stages?.length) errors.push('stages 不能为空。');
  if (!plan.steps?.length) errors.push('steps 不能为空。');
  for (const stage of requiredStages) {
    if (!plan.stages.includes(stage)) errors.push(`必须包含阶段 ${stage}。`);
    if (!plan.steps.some((step) => step.stage === stage)) errors.push(`必须包含 ${stage} 的步骤。`);
  }
  const text = textOf(plan);
  for (const term of forbiddenTerms) if (text.includes(term)) errors.push(`不允许包含 ${term}。`);
  if (text.includes('gps 参与租金计算') || text.includes('gps参与租金计算')) errors.push('GPS 数据不得参与租金计算。');
  if (text.includes('押金计入租金已付') || text.includes('押金作为租金已付')) errors.push('押金不得计入租金已付。');
  if (!plan.businessChecks.some((step) => step.title.includes('单日不可超付')))
    errors.push('核心业务 smoke test 必须包含单日不可超付。');
  if (!plan.permissionChecks.length) errors.push('权限 smoke test 不能为空。');
  if (!plan.failureIsolationChecks.length) errors.push('失败隔离 smoke test 不能为空。');
  if (!plan.rollbackChecks.length) errors.push('回滚 smoke test 不能为空。');
  if (plan.mode === 'real') errors.push('当前仓库不允许 real 模式计划。');
  if (plan.errors.length > 0) warnings.push('计划自身已包含错误，需要先处理。');
  return result(errors, warnings);
}

export function validateRealSmokeTestReportDraft(report: RealSmokeTestReportDraft): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (report.mode === 'real') errors.push('报告草案 mode 不能是 real。');
  if (report.executed !== false) errors.push('报告草案必须保持 executed=false。');
  if (report.stepsPlanned <= 0) errors.push('stepsPlanned 必须大于 0。');
  if (report.blockers.length > 0 && report.nextActions.length === 0) errors.push('blockers 必须有明确 nextActions。');
  if (report.success && report.errors.length > 0) errors.push('success=true 时 errors 必须为空。');
  const text = textOf(report);
  if (text.includes('production_ready') || text.includes('生产就绪') || text.includes('正式上线就绪'))
    errors.push('当前仓库不应报告生产就绪。');
  if (report.success) warnings.push('即使草案校验成功，也不代表真实 Smoke Test 已执行。');
  return result(errors, warnings);
}
