/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  NocobaseBlockPlan,
  NocobaseFilterPlan,
  NocobaseMenuPlan,
  NocobasePageActionPlan,
  NocobasePagePlan,
  RealBlockSchemaDraft,
  RealFilterSchemaDraft,
  RealMenuSchemaDraft,
  RealPageActionSchemaDraft,
  RealPageSchemaDraft,
} from './types';

const SENSITIVE_FIELD_KEYWORDS = [
  'id_number',
  'id_photo',
  'license_photo',
  'payment_screenshot',
  'payment_method',
  'deposit_amount',
  'deposit_screenshot',
  'total_paid',
  'total_debt',
  'future_receivable',
  'signed_scan',
  'access_token',
  'login_key',
];

function uniqueStrings(values: string[]): string[] {
  return [
    ...new Set(
      values
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
        .map((value) => String(value).trim()),
    ),
  ];
}

function textIncludesAny(values: unknown, keywords: string[]): boolean {
  const text = JSON.stringify(values).toLowerCase();
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

export function mapMenuPlanToRealPageSchemaDraft(menu: NocobaseMenuPlan): RealMenuSchemaDraft {
  const warnings: string[] = [];
  if (!menu.path.startsWith('/')) warnings.push('菜单 path 不是绝对路径，真实 UI 注册前需确认路由挂载方式。');
  if (menu.requiredRoles.length === 0) warnings.push('菜单缺少 requiredRoles，不能只依赖前端入口隐藏。');
  return {
    name: menu.name,
    title: menu.title,
    path: menu.path,
    icon: menu.icon,
    order: menu.order,
    parentName: menu.parentName,
    requiredRoles: [...menu.requiredRoles],
    sourcePlugin: menu.sourcePlugin,
    uiSchemaNotes: uniqueStrings([
      ...menu.notes,
      '这是真实菜单 schema 草案，不是真实 NocoBase 菜单写入请求。',
      '后续必须确认目标 NocoBase 版本的菜单注册 API 或稳定配置导入机制。',
      '本轮不写入 UI Schema、不创建真实菜单。',
    ]),
    unsupportedFeatures: ['真实菜单注册 API 尚未接入。'],
    warnings: uniqueStrings(warnings),
  };
}

export function mapPagePlanToRealPageSchemaDraft(page: NocobasePagePlan): RealPageSchemaDraft {
  const warnings: string[] = [];
  if (!page.route) warnings.push('页面缺少 route，真实页面注册前必须补齐。');
  if (!page.menuName) warnings.push('页面缺少 menuName，真实页面注册前必须绑定菜单。');
  if (!page.collection) warnings.push('页面缺少主 collection，真实页面注册前必须补齐。');
  if (page.requiredRoles.length === 0) warnings.push('页面缺少 requiredRoles，不能只依赖前端隐藏。');
  const collections = uniqueStrings([...(page.collections ?? []), ...(page.collection ? [page.collection] : [])]);
  return {
    name: page.name,
    title: page.title,
    route: page.route ?? page.menuPath,
    menuName: page.menuName ?? '',
    menuPath: page.menuPath,
    collection: page.collection ?? collections[0] ?? '',
    collections,
    blocks: [...page.blocks],
    filters: [...(page.filters ?? [])],
    actions: [...(page.actions ?? [])],
    requiredRoles: [...page.requiredRoles],
    layout: page.layout ?? 'internal-record-list',
    sourcePlugin: page.sourcePlugin,
    uiSchemaNotes: uniqueStrings([
      ...page.notes,
      '这是真实页面 schema 草案，不是真实 NocoBase 页面写入请求。',
      '页面仅供内部员工使用，不创建司机登录、客户门户、短租预订或按车型出租入口。',
      '本轮不写入 UI Schema、不创建真实页面。',
    ]),
    unsupportedFeatures: ['真实页面 route、schema initializer 和区块挂载 API 尚未接入。'],
    warnings: uniqueStrings(warnings),
  };
}

export function mapBlockPlanToRealPageSchemaDraft(block: NocobaseBlockPlan): RealBlockSchemaDraft {
  const warnings: string[] = [];
  const sensitiveFieldWarnings: string[] = [];
  if (block.fields.length === 0) warnings.push('区块缺少 fields，真实区块注册前必须补齐。');
  if (block.requiredRoles.length === 0) warnings.push('区块缺少 requiredRoles，不能只依赖页面隐藏。');
  const sensitiveFields = uniqueStrings(
    [...block.fields, ...block.visibleFields, ...block.hiddenFields].filter((field) =>
      textIncludesAny(field, SENSITIVE_FIELD_KEYWORDS),
    ),
  );
  if (sensitiveFields.length > 0) {
    sensitiveFieldWarnings.push(
      `区块包含敏感字段：${sensitiveFields.join('、')}；真实接入必须做服务端字段级权限控制。`,
    );
  }
  if (textIncludesAny(block, ['payment_screenshot', 'deposit', 'total_paid', 'future_receivable'])) {
    sensitiveFieldWarnings.push('付款截图、押金、总已付和未来应收不能只靠前端隐藏。');
  }
  return {
    name: block.name,
    title: block.title,
    blockType: block.blockType,
    collection: block.collection,
    fields: [...block.fields],
    filters: [...block.filters],
    actions: [...block.actions],
    visibleFields: [...block.visibleFields],
    hiddenFields: [...block.hiddenFields],
    requiredRoles: [...block.requiredRoles],
    sourcePlugin: block.sourcePlugin,
    uiSchemaNotes: uniqueStrings([
      ...block.notes,
      '这是真实区块 schema 草案，不是真实 NocoBase 区块写入请求。',
      '敏感字段必须接入 ACL 和字段级权限，不能只依赖前端隐藏。',
      '本轮不写入 UI Schema、不创建真实区块。',
    ]),
    sensitiveFieldWarnings: uniqueStrings(sensitiveFieldWarnings),
    unsupportedFeatures: ['真实区块 schema initializer、字段组件和 ACL 联动 API 尚未接入。'],
    warnings: uniqueStrings(warnings),
  };
}

export function mapFilterPlanToRealPageSchemaDraft(filter: NocobaseFilterPlan): RealFilterSchemaDraft {
  const warnings: string[] = [];
  if (!filter.operator) warnings.push('筛选器缺少 operator，真实筛选器注册前必须补齐。');
  if (filter.requiredRoles.length === 0) warnings.push('筛选器缺少 requiredRoles，需确认是否允许所有内部角色使用。');
  return {
    name: filter.name,
    title: filter.title,
    collection: filter.collection,
    field: filter.field,
    operator: filter.operator,
    defaultValue: filter.defaultValue,
    requiredRoles: [...filter.requiredRoles],
    sourcePlugin: filter.sourcePlugin,
    uiSchemaNotes: uniqueStrings([
      ...filter.notes,
      '这是真实筛选器 schema 草案，不是真实 NocoBase 筛选器写入请求。',
      '本轮不写入 UI Schema、不创建真实筛选器。',
    ]),
    unsupportedFeatures: ['真实筛选器组件和查询参数绑定 API 尚未接入。'],
    warnings: uniqueStrings(warnings),
  };
}

export function mapPageActionPlanToRealPageSchemaDraft(action: NocobasePageActionPlan): RealPageActionSchemaDraft {
  const dangerByName = textIncludesAny(action, [
    'reverse',
    'void',
    'delete',
    'deduct',
    'refund',
    'waive',
    '作废',
    '撤销',
    '退款',
    '抵扣',
    '免除',
  ]);
  const warnings: string[] = [];
  if (!action.serviceName) warnings.push('页面动作缺少 serviceName，真实按钮注册前必须绑定 runtime 服务。');
  if (action.requiredRoles.length === 0) warnings.push('页面动作缺少 requiredRoles，危险动作不能只依赖前端隐藏。');
  if ((action.danger || dangerByName) && !action.confirmationRequired)
    warnings.push('危险页面动作缺少 confirmationRequired，草案已标记为需要确认。');
  return {
    name: action.name,
    title: action.title,
    actionType: action.actionType,
    serviceName: action.serviceName,
    collection: action.collection,
    requiredRoles: [...action.requiredRoles],
    confirmationRequired: action.confirmationRequired || action.danger || dangerByName,
    danger: action.danger || dangerByName,
    sourcePlugin: action.sourcePlugin,
    uiSchemaNotes: uniqueStrings([
      ...action.notes,
      '这是真实页面动作 schema 草案，不是真实按钮或 API 注册请求。',
      '页面动作必须绑定 runtime 服务、ACL 和事务边界。',
      '本轮不注册真实按钮、不调用真实服务。',
    ]),
    unsupportedFeatures: ['真实页面动作、按钮组件、服务调用和 ACL 绑定机制尚未接入。'],
    warnings: uniqueStrings(warnings),
  };
}
