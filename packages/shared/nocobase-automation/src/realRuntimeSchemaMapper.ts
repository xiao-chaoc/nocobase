/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeActionPlan } from './actionPlanNormalizer';
import { normalizeI18nPlan } from './i18nPlanNormalizer';
import { normalizePermissionPlan } from './permissionPlanNormalizer';
import { normalizeSchedulePlan } from './schedulePlanNormalizer';
import { normalizeServicePlan } from './servicePlanNormalizer';
import type {
  NocobaseActionPlan,
  NocobaseI18nPlan,
  NocobasePermissionPlan,
  NocobaseSchedulePlan,
  NocobaseServicePlan,
  RealActionSchemaDraft,
  RealI18nSchemaDraft,
  RealPermissionSchemaDraft,
  RealScheduleSchemaDraft,
  RealServiceSchemaDraft,
} from './types';

const REQUIRED_LANGUAGES = ['zh-CN', 'en-US', 'fr-FR'];

const uniqueStrings = (values: string[]): string[] => [...new Set(values.filter(Boolean))];
const textOf = (value: unknown): string => JSON.stringify(value).toLowerCase();
const includesAny = (value: unknown, patterns: string[]): boolean =>
  patterns.some((pattern) => textOf(value).includes(pattern));

export function mapServicePlanToRealSchemaDraft(servicePlan: NocobaseServicePlan): RealServiceSchemaDraft {
  const normalized = normalizeServicePlan(servicePlan);
  const warnings: string[] = [];
  const unsupportedFeatures = [
    '真实服务注册机制尚未绑定目标 NocoBase 版本，本轮不调用 app、plugin 或 service registry。',
  ];
  if (normalized.permissions.length === 0) warnings.push('服务缺少权限要求，真实注册前必须补齐服务端权限。');
  if (normalized.transactional)
    warnings.push('事务服务必须在真实 adapter 中接入数据库事务，当前仅保留 transactional 标记。');
  return {
    name: normalized.name,
    sourcePlugin: normalized.sourcePlugin,
    handlerName: normalized.handlerName,
    permissions: [...normalized.permissions],
    transactional: normalized.transactional,
    nocobaseServiceNotes: uniqueStrings([
      ...normalized.notes,
      '这是真实 Runtime 服务 schema 草案，不是真实 NocoBase 服务注册请求。',
      '本轮不连接 NocoBase、不注册服务方法、不伪造服务注册成功。',
      ...(normalized.transactional ? ['该服务需要数据库事务边界，后续必须由真实 db transaction 包裹。'] : []),
    ]),
    unsupportedFeatures,
    warnings: uniqueStrings(warnings),
  };
}

export function mapActionPlanToRealSchemaDraft(actionPlan: NocobaseActionPlan): RealActionSchemaDraft {
  const normalized = normalizeActionPlan(actionPlan);
  const danger = includesAny(normalized, ['reverse', 'void', 'delete', '作废', '撤销', '退款', '抵扣']);
  const confirmationRequired =
    danger || includesAny(normalized, ['approve', 'confirm', 'upload', 'sync', '审批', '确认', '上传', '同步']);
  const warnings: string[] = [];
  if (!normalized.serviceName) warnings.push('动作缺少 serviceName，真实注册前必须绑定服务方法。');
  if (normalized.requiredPermissions.length === 0)
    warnings.push('动作缺少 requiredPermissions，不能只依赖前端按钮隐藏。');
  return {
    name: normalized.name,
    title: normalized.title,
    sourcePlugin: normalized.sourcePlugin,
    serviceName: normalized.serviceName,
    requiredPermissions: [...normalized.requiredPermissions],
    inputSchema: [...normalized.inputSchema],
    outputSchema: normalized.outputSchema,
    confirmationRequired,
    danger,
    nocobaseActionNotes: uniqueStrings([
      ...normalized.notes,
      '这是真实 Runtime 动作 schema 草案，不是真实按钮、API、command 或 route 注册。',
      '后续需要确认目标 NocoBase 的 action / command / route / UI action 绑定机制。',
      '本轮不注册按钮、不注册 API、不调用 app.router 或 app.command。',
    ]),
    unsupportedFeatures: [
      '真实按钮绑定方式尚未确认。',
      '真实 API/route/action 注册方式尚未确认。',
      '真实动作与服务方法的事务和权限边界尚未接入。',
    ],
    warnings: uniqueStrings(warnings),
  };
}

export function mapPermissionPlanToRealSchemaDraft(permissionPlan: NocobasePermissionPlan): RealPermissionSchemaDraft {
  const normalized = normalizePermissionPlan(permissionPlan);
  const warnings: string[] = [];
  if (!normalized.role) warnings.push('权限计划缺少 role，真实 ACL 注册前必须补齐。');
  if (normalized.sensitiveFields.length === 0 && normalized.role !== 'readonly_auditor')
    warnings.push('权限计划未列出敏感字段，真实接入前需确认字段级权限。');
  return {
    role: normalized.role,
    sourcePlugin: normalized.notes.find((note) => note.includes('plugin-')) ?? 'runtime-permission-plan',
    collections: [...normalized.collections],
    actions: [...normalized.actions],
    fieldVisibility: { ...normalized.fieldVisibility },
    sensitiveFields: [...normalized.sensitiveFields],
    aclNotes: uniqueStrings([
      ...normalized.notes,
      '必须接入真实 NocoBase ACL、字段级权限、脱敏和导出控制；不能只靠前端隐藏。',
      '付款截图、总已付、未来应收、押金和财务汇总必须做服务端权限控制。',
      '本轮不注册真实角色、不注册真实 ACL、不写权限数据库。',
    ]),
    unsupportedFeatures: ['真实 NocoBase ACL 与字段级权限 API 尚未接入。'],
    warnings: uniqueStrings(warnings),
  };
}

export function mapSchedulePlanToRealSchemaDraft(schedulePlan: NocobaseSchedulePlan): RealScheduleSchemaDraft {
  const normalized = normalizeSchedulePlan(schedulePlan);
  const isIopgps =
    normalized.sourcePlugin === 'plugin-iopgps' ||
    normalized.name.toLowerCase().includes('iopgps') ||
    normalized.serviceName.toLowerCase().includes('iopgps');
  const enabledByDefault = isIopgps ? false : normalized.enabledByDefault;
  const warnings: string[] = [];
  if (isIopgps && normalized.enabledByDefault) warnings.push('IOPGPS 定时任务在草案中被强制改为默认不真实启用。');
  if (!normalized.serviceName) warnings.push('定时任务缺少 serviceName，真实 scheduler 注册前必须补齐。');
  return {
    name: normalized.name,
    title: normalized.title,
    sourcePlugin: normalized.sourcePlugin,
    cron: normalized.cron,
    enabledByDefault,
    serviceName: normalized.serviceName,
    schedulerNotes: uniqueStrings([
      ...normalized.notes,
      '这是真实 Runtime 定时任务 schema 草案，不是真实 scheduler 注册。',
      '定时任务必须具备失败隔离；IOPGPS 同步失败不能影响租金台账和付款逻辑。',
      '本轮不注册真实 scheduler、不启动任何定时任务。',
    ]),
    unsupportedFeatures: ['真实 NocoBase scheduler API、启停策略和失败隔离实现尚未接入。'],
    warnings: uniqueStrings(warnings),
  };
}

export function mapI18nPlanToRealSchemaDraft(i18nPlan: NocobaseI18nPlan): RealI18nSchemaDraft {
  const normalized = normalizeI18nPlan(i18nPlan);
  const missingLanguages = REQUIRED_LANGUAGES.filter((language) => !normalized.languages.includes(language));
  return {
    namespace: normalized.namespace,
    sourcePlugin: normalized.sourcePlugin,
    languages: [...normalized.languages],
    localeFiles: [...normalized.localeFiles],
    i18nNotes: uniqueStrings([
      ...normalized.notes,
      '必须支持 zh-CN、en-US、fr-FR 三种界面和合同语言。',
      '这是真实 Runtime i18n schema 草案，不是真实 i18n loader 调用。',
      '本轮不加载真实多语言资源、不写入 NocoBase i18n 配置。',
    ]),
    unsupportedFeatures: ['真实 NocoBase i18n 资源加载机制尚未接入。'],
    warnings: missingLanguages.map((language) => `i18n 缺少必需语言：${language}`),
  };
}
