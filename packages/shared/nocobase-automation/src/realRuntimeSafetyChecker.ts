/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CORE_ROLE_NAMES } from './runtimeRegistrationValidator';
import type {
  RealRuntimeRegistrationContext,
  RealRuntimeRegistrationPlan,
  RealRuntimeRegistrationSafetyCheck,
  ValidationResult,
} from './types';

const REQUIRED_LANGUAGES = ['zh-CN', 'en-US', 'fr-FR'];
const FORBIDDEN_PATTERNS = [
  'booking',
  'reservation',
  'short_rental_order',
  'driver_login',
  'customer_portal',
  'vehicle_category_rental',
  'gps_rent_calculation',
  'deposit_as_rent_payment',
];

const planText = (plan: RealRuntimeRegistrationPlan): string => JSON.stringify(plan).toLowerCase();
const passed = (checks: RealRuntimeRegistrationSafetyCheck[]): boolean => checks.every((check) => check.passed);
const flattenErrors = (checks: RealRuntimeRegistrationSafetyCheck[]): string[] =>
  checks.flatMap((check) => check.errors);
const flattenWarnings = (checks: RealRuntimeRegistrationSafetyCheck[]): string[] =>
  checks.flatMap((check) => check.warnings);

function check(name: string, errors: string[], warnings: string[] = []): RealRuntimeRegistrationSafetyCheck {
  return { name, passed: errors.length === 0, errors, warnings };
}

export function validateRealRuntimeRegistrationSafety(
  plan: RealRuntimeRegistrationPlan,
  context: RealRuntimeRegistrationContext,
): ValidationResult & { safetyChecks: RealRuntimeRegistrationSafetyCheck[] } {
  const checks: RealRuntimeRegistrationSafetyCheck[] = [];
  const mode = context.mode ?? plan.mode;
  checks.push(
    check(
      'mode 不能默认为 real',
      mode === 'real' && !context.allowRealExecution
        ? ['real 模式不能作为默认模式；当前仓库仅允许 plan_only、validate_only、dry_run。']
        : [],
    ),
  );
  checks.push(
    check(
      'real 模式必须显式允许',
      mode === 'real' && !context.allowRealExecution ? ['mode = real 时必须 allowRealExecution = true。'] : [],
    ),
  );
  checks.push(
    check(
      'real 模式必须要求备份',
      mode === 'real' && !context.requireBackup ? ['mode = real 时必须 requireBackup = true。'] : [],
    ),
  );
  checks.push(
    check(
      'real 模式必须要求回滚计划',
      mode === 'real' && !context.requireRollbackPlan ? ['mode = real 时必须 requireRollbackPlan = true。'] : [],
    ),
  );
  checks.push(
    check(
      'adapterEnvironment 必须 ready 才能 real',
      mode === 'real' && context.adapterEnvironment.status !== 'ready'
        ? ['adapterEnvironment.status 不是 ready，不能执行 real。']
        : [],
    ),
  );
  checks.push(
    check(
      '当前仓库环境禁止 real',
      mode === 'real' ? ['当前仓库不是完整 NocoBase 工程，禁止执行 real Runtime 注册。'] : [],
    ),
  );
  checks.push(
    check(
      '禁止真实执行 Runtime 注册',
      mode === 'real' ? ['本轮禁止真实执行服务、动作、权限、定时任务和 i18n 注册。'] : [],
    ),
  );
  checks.push(
    check(
      '必须提供 rollbackPlan',
      plan.rollbackPlan.length === 0 ? ['真实 Runtime 注册草案必须包含 rollbackPlan。'] : [],
    ),
  );
  checks.push(
    check(
      '禁止真实生产环境执行',
      mode === 'real' || context.adapterEnvironment.mode === 'real'
        ? ['当前仓库禁止在真实生产环境执行 Runtime 注册。']
        : [],
    ),
  );
  const iopgpsEnabled = plan.schedules.some(
    (schedule) => schedule.sourcePlugin === 'plugin-iopgps' && schedule.enabledByDefault,
  );
  checks.push(check('IOPGPS 定时任务默认不能真实启用', iopgpsEnabled ? ['IOPGPS 定时任务默认不能真实启用。'] : []));
  return {
    passed: passed(checks),
    errors: flattenErrors(checks),
    warnings: flattenWarnings(checks),
    safetyChecks: checks,
  };
}

export function validateRealRuntimeSchemaDraft(plan: RealRuntimeRegistrationPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (plan.services.length === 0) errors.push('真实 Runtime 草案必须包含 services。');
  if (plan.actions.length === 0) errors.push('真实 Runtime 草案必须包含 actions。');
  if (plan.permissions.length === 0) errors.push('真实 Runtime 草案必须包含 permissions。');
  if (plan.i18n.length === 0) errors.push('真实 Runtime 草案必须包含 i18n。');

  for (const action of plan.actions) {
    if (!action.serviceName) errors.push(`动作必须关联 serviceName：${action.name || '<未命名动作>'}`);
  }
  for (const permission of plan.permissions) {
    if (!permission.role) errors.push('权限草案必须关联 role。');
  }
  for (const item of plan.i18n) {
    for (const language of REQUIRED_LANGUAGES) {
      if (!item.languages.includes(language)) errors.push(`i18n ${item.namespace || '<未命名>'} 缺少语言：${language}`);
    }
  }

  const roles = new Set(plan.permissions.map((permission) => permission.role));
  for (const role of CORE_ROLE_NAMES) {
    if (!roles.has(role)) errors.push(`缺少权限角色：${role}`);
  }
  const byRole = new Map(plan.permissions.map((permission) => [permission.role, permission]));
  const operator = byRole.get('operator');
  if (operator && operator.fieldVisibility.payment_screenshot !== 'hidden')
    errors.push('operator 默认不能查看付款截图。');
  const gps = byRole.get('gps_maintenance');
  if (
    gps &&
    ['total_paid_amount', 'future_receivable_amount', 'current_debt_amount', 'payment_screenshot'].some(
      (field) => gps.fieldVisibility[field] !== 'hidden',
    )
  ) {
    errors.push('gps_maintenance 默认不能查看财务汇总和付款截图。');
  }
  const manager = byRole.get('manager');
  if (manager && !JSON.stringify(manager).includes('审批')) errors.push('manager 必须可审批免除。');
  const accountant = byRole.get('accountant');
  if (
    accountant &&
    (!accountant.collections.includes('rent_payments') || !accountant.collections.includes('deposit_records'))
  )
    errors.push('accountant 必须可访问付款和押金。');

  const text = planText(plan);
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (text.includes(pattern)) errors.push(`不允许出现 runtime 对象或逻辑：${pattern}`);
  }
  if (text.includes('gps 参与租金计算') || text.includes('gps参与租金计算')) errors.push('GPS 服务不得参与租金计算。');
  if (text.includes('押金计入租金已付') || text.includes('押金作为租金已付')) errors.push('押金不得计入租金已付。');
  if (!text.includes('gps 数据不参与租金计算') && !text.includes('gps 不参与租金计算'))
    warnings.push('真实 Runtime 草案应明确 GPS 数据不参与租金计算。');
  if (!text.includes('押金不计入租金') && !text.includes('押金和租金分开管理'))
    warnings.push('真实 Runtime 草案应明确押金不计入租金已付。');
  return { passed: errors.length === 0, errors, warnings };
}
