/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PageInitializationPlan, ValidationResult } from './types';

const combine = (...results: ValidationResult[]): ValidationResult => ({
  passed: results.every((result) => result.passed),
  errors: results.flatMap((result) => result.errors),
  warnings: results.flatMap((result) => result.warnings),
});

const pageText = (plan: PageInitializationPlan): string => JSON.stringify(plan).toLowerCase();

export const REQUIRED_PAGE_NAMES = [
  'driver-list',
  'vehicle-list',
  'contract-list',
  'rent-ledger-list',
  'rent-calendar',
  'payment-list',
  'deposit-list',
  'contract-documents',
  'gps-devices',
  'gps-status',
  'operation-logs',
];

export const REQUIRED_PAGE_ACTION_NAMES = [
  'activate_contract',
  'generate_fixed_term_ledgers',
  'ensure_open_ended_ledgers',
  'confirm_rent_payment',
  'reverse_rent_payment',
  'request_rent_waiver',
  'approve_rent_waiver',
  'create_deposit',
  'deduct_deposit',
  'refund_deposit',
  'generate_contract_documents',
  'upload_signed_contract_scan',
  'sync_device_status',
  'sync_location',
  'sync_daily_mileage',
];

const forbiddenPatterns = [
  'booking',
  'reservation',
  'short_rental',
  'driver_login',
  'customer_portal',
  'vehicle_category_rental',
  'gps_rent_calculation',
];

const hasFieldInBlocks = (plan: PageInitializationPlan, fieldName: string): boolean =>
  plan.blocks.some(
    (block) =>
      block.fields.includes(fieldName) ||
      block.hiddenFields.includes(fieldName) ||
      block.visibleFields.includes(fieldName),
  );

const hiddenInBlocks = (plan: PageInitializationPlan, fieldName: string): boolean =>
  plan.blocks.some((block) => block.hiddenFields.includes(fieldName));

export const validatePageInitializationPlan = (plan: PageInitializationPlan): ValidationResult => {
  const errors: string[] = [];
  if (plan.menus.length === 0) errors.push('页面初始化计划必须包含菜单。');
  if (plan.pages.length === 0) errors.push('页面初始化计划必须包含页面。');
  if (plan.blocks.length === 0) errors.push('页面初始化计划必须包含区块。');
  if (plan.filters.length === 0) errors.push('页面初始化计划必须包含筛选器。');
  if (plan.actions.length === 0) errors.push('页面初始化计划必须包含页面动作。');

  const pageNames = new Set(plan.pages.map((page) => page.name));
  for (const pageName of REQUIRED_PAGE_NAMES) {
    if (!pageNames.has(pageName)) errors.push(`缺少必需页面计划：${pageName}`);
  }

  for (const menu of plan.menus) {
    if (!menu.name) errors.push('菜单 name 必须存在。');
    if (!menu.title) errors.push(`菜单 ${menu.name || '<未命名>'} title 必须存在。`);
    if (!menu.path) errors.push(`菜单 ${menu.name || '<未命名>'} path 必须存在。`);
  }

  for (const page of plan.pages) {
    if (!page.name) errors.push('页面 name 必须存在。');
    if (!page.title) errors.push(`页面 ${page.name || '<未命名>'} title 必须存在。`);
    if (!page.route) errors.push(`页面 ${page.name || '<未命名>'} route 必须存在。`);
    if (!page.menuName) errors.push(`页面 ${page.name || '<未命名>'} menuName 必须存在。`);
    if (!page.collection) errors.push(`页面 ${page.name || '<未命名>'} collection 必须存在。`);
    if (page.blocks.length === 0) errors.push(`页面 ${page.name || '<未命名>'} 必须关联区块。`);
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
  }

  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validatePageForbiddenPatterns = (plan: PageInitializationPlan): ValidationResult => {
  const serialized = pageText(plan);
  const errors = forbiddenPatterns
    .filter((pattern) => serialized.includes(pattern))
    .map((pattern) => `页面初始化计划中出现禁止对象或逻辑：${pattern}`);
  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validateSensitivePageFields = (plan: PageInitializationPlan): ValidationResult => {
  const errors: string[] = [];
  const requiredHiddenFields = [
    'screenshot_file',
    'method',
    'required_amount',
    'received_amount',
    'total_paid_amount',
    'future_receivable_amount',
    'id_no',
    'id_front_file',
    'id_back_file',
    'license_front_file',
    'license_back_file',
    'signed_scan_file',
  ];

  for (const fieldName of requiredHiddenFields) {
    if (!hiddenInBlocks(plan, fieldName)) errors.push(`敏感页面字段未隐藏或未标记敏感：${fieldName}`);
  }

  for (const fieldName of ['access_token', 'login_key', 'login_key_encrypted']) {
    if (hasFieldInBlocks(plan, fieldName)) errors.push(`普通页面不应出现 IOPGPS 凭据字段：${fieldName}`);
  }

  const paymentBlocks = plan.blocks.filter((block) => block.collection === 'rent_payments');
  if (
    !paymentBlocks.some(
      (block) => !block.requiredRoles.includes('operator') && block.hiddenFields.includes('screenshot_file'),
    )
  ) {
    errors.push('operator 默认不能查看付款截图，付款截图区块必须排除 operator 并隐藏 screenshot_file。');
  }

  const financialBlocks = plan.blocks.filter((block) =>
    block.hiddenFields.some((field) =>
      ['total_paid_amount', 'future_receivable_amount', 'total_arrears_amount'].includes(field),
    ),
  );
  if (!financialBlocks.every((block) => !block.requiredRoles.includes('gps_maintenance'))) {
    errors.push('gps_maintenance 默认不能查看财务汇总。');
  }

  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validateRequiredPageActions = (plan: PageInitializationPlan): ValidationResult => {
  const actionNames = new Set(plan.actions.map((action) => action.name));
  const errors = REQUIRED_PAGE_ACTION_NAMES.filter((actionName) => !actionNames.has(actionName)).map(
    (actionName) => `缺少必需页面动作计划：${actionName}`,
  );
  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validatePageInitialization = (plan: PageInitializationPlan): ValidationResult =>
  combine(
    validatePageInitializationPlan(plan),
    validatePageForbiddenPatterns(plan),
    validateSensitivePageFields(plan),
    validateRequiredPageActions(plan),
  );
