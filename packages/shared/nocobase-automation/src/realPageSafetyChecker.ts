/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RealPageRegistrationContext,
  RealPageRegistrationPlan,
  RealPageRegistrationSafetyCheck,
  ValidationResult,
} from './types';

const FORBIDDEN_PATTERNS = [
  'booking',
  'reservation',
  'short_rental_order',
  'driver_login',
  'customer_portal',
  'vehicle_category_rental',
];

const SENSITIVE_PATTERNS = [
  'payment_screenshot',
  'deposit_amount',
  'deposit_screenshot',
  'id_number',
  'id_photo',
  'license_photo',
  'signed_scan',
  'total_paid',
  'future_receivable',
];

function makeCheck(name: string, errors: string[] = [], warnings: string[] = []): RealPageRegistrationSafetyCheck {
  return { name, passed: errors.length === 0, warnings: [...new Set(warnings)], errors: [...new Set(errors)] };
}

function planText(plan: RealPageRegistrationPlan): string {
  return JSON.stringify(plan).toLowerCase();
}

export function validateRealPageSchemaDraft(plan: RealPageRegistrationPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (plan.menus.length === 0) errors.push('真实 Page 草案必须包含菜单。');
  if (plan.pages.length === 0) errors.push('真实 Page 草案必须包含页面。');
  if (plan.blocks.length === 0) errors.push('真实 Page 草案必须包含区块。');

  for (const menu of plan.menus) {
    if (!menu.name) errors.push('菜单 name 必须存在。');
    if (!menu.title) errors.push(`菜单 ${menu.name || '<未命名>'} title 必须存在。`);
    if (!menu.path) errors.push(`菜单 ${menu.name || '<未命名>'} path 必须存在。`);
    if (menu.requiredRoles.length === 0) warnings.push(`菜单 ${menu.name} 缺少 requiredRoles。`);
  }
  for (const page of plan.pages) {
    if (!page.name) errors.push('页面 name 必须存在。');
    if (!page.route) errors.push(`页面 ${page.name || '<未命名>'} route 必须存在。`);
    if (!page.menuName) errors.push(`页面 ${page.name || '<未命名>'} menuName 必须存在。`);
    if (!page.collection) errors.push(`页面 ${page.name || '<未命名>'} collection 必须存在。`);
    if (page.blocks.length === 0) errors.push(`页面 ${page.name || '<未命名>'} 必须包含区块引用。`);
    if (page.requiredRoles.length === 0) warnings.push(`页面 ${page.name} 缺少 requiredRoles。`);
  }
  for (const block of plan.blocks) {
    if (!block.name) errors.push('区块 name 必须存在。');
    if (!block.collection) errors.push(`区块 ${block.name || '<未命名>'} collection 必须存在。`);
    if (block.fields.length === 0) errors.push(`区块 ${block.name || '<未命名>'} fields 必须存在。`);
  }
  for (const filter of plan.filters) {
    if (!filter.name) errors.push('筛选器 name 必须存在。');
    if (!filter.collection) errors.push(`筛选器 ${filter.name || '<未命名>'} collection 必须存在。`);
    if (!filter.field) errors.push(`筛选器 ${filter.name || '<未命名>'} field 必须存在。`);
  }
  for (const action of plan.actions) {
    if (!action.name) errors.push('页面动作 name 必须存在。');
    if (!action.serviceName) errors.push(`页面动作 ${action.name || '<未命名>'} serviceName 必须存在。`);
    if (!action.collection) errors.push(`页面动作 ${action.name || '<未命名>'} collection 必须存在。`);
    if (action.requiredRoles.length === 0)
      errors.push(`页面动作 ${action.name || '<未命名>'} requiredRoles 必须存在。`);
    if (action.danger && !action.confirmationRequired)
      errors.push(`危险页面动作 ${action.name || '<未命名>'} 必须启用确认提示。`);
  }
  return { passed: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

export function validateRealPageRegistrationSafety(
  plan: RealPageRegistrationPlan,
  context: RealPageRegistrationContext,
): RealPageRegistrationSafetyCheck[] {
  const text = planText(plan);
  const forbiddenErrors = FORBIDDEN_PATTERNS.filter((pattern) => text.includes(pattern.toLowerCase())).map(
    (pattern) => `不允许出现禁用业务：${pattern}`,
  );
  const gpsErrors =
    text.includes('gps_rent_calculation') || text.includes('gps 参与租金计算') || text.includes('gps参与租金计算')
      ? ['GPS 不得参与租金计算。']
      : [];
  const depositErrors =
    text.includes('deposit_as_rent_payment') || text.includes('押金计入租金已付') || text.includes('押金作为租金已付')
      ? ['押金不得计入租金已付。']
      : [];
  const schema = validateRealPageSchemaDraft(plan);
  const sensitiveExists = SENSITIVE_PATTERNS.some((pattern) => text.includes(pattern));
  const sensitiveWarnings = sensitiveExists
    ? ['草案包含敏感字段，真实接入必须使用服务端 ACL 和字段级权限，不能只靠前端隐藏。']
    : [];
  const rollbackErrors =
    context.requireRollbackPlan && plan.rollbackPlan.length === 0
      ? ['要求回滚计划时，真实 Page 草案必须包含 rollbackPlan。']
      : [];
  const postValidationErrors =
    !plan.postRegistrationValidationPlan || plan.postRegistrationValidationPlan.length === 0
      ? ['真实 Page 草案必须包含注册后核验计划。']
      : [];

  return [
    makeCheck('执行模式安全', plan.mode === 'real' ? ['当前仓库不允许真实执行 Page 注册。'] : []),
    makeCheck('真实执行开关', context.allowRealExecution ? ['当前上下文不得允许真实 Page 注册执行。'] : []),
    makeCheck(
      '环境可用性',
      context.adapterEnvironment.hasUiSchema ? [] : [],
      context.adapterEnvironment.hasUiSchema ? [] : ['当前环境没有真实 UI Schema manager，本轮只能生成草案。'],
    ),
    makeCheck('页面 schema 完整性', schema.errors, schema.warnings),
    makeCheck('禁用业务边界', [...forbiddenErrors, ...gpsErrors, ...depositErrors]),
    makeCheck('敏感字段权限边界', [], sensitiveWarnings),
    makeCheck('回滚计划', rollbackErrors),
    makeCheck('注册后核验计划', postValidationErrors),
  ];
}
