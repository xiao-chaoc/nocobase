/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocobaseActionPlan } from './types';

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

export const normalizeActionPlan = (rawActionPlan: NocobaseActionPlan): NocobaseActionPlan => {
  const name = String(rawActionPlan.name ?? '');
  const notes = asStringArray(rawActionPlan.notes);
  const requiredPermissions = asStringArray(rawActionPlan.requiredPermissions);
  if (requiredPermissions.length === 0) {
    notes.push('警告：动作缺少 requiredPermissions；真实 adapter 接入前必须补齐服务端权限。');
  }
  if (!name) notes.push('错误：动作 name 必须存在。');
  if (!rawActionPlan.sourcePlugin) notes.push('错误：动作 sourcePlugin 必须存在。');
  if (!rawActionPlan.serviceName) notes.push('错误：动作 serviceName 必须存在。');
  notes.push('本轮不真实注册按钮，不真实注册 API。');

  return {
    name,
    title: String(rawActionPlan.title ?? name),
    sourcePlugin: String(rawActionPlan.sourcePlugin ?? ''),
    inputSchema: asStringArray(rawActionPlan.inputSchema),
    outputSchema: String(rawActionPlan.outputSchema ?? ''),
    requiredPermissions,
    serviceName: String(rawActionPlan.serviceName ?? ''),
    notes,
  };
};

export const normalizeActionPlans = (actionPlans: NocobaseActionPlan[]): NocobaseActionPlan[] =>
  actionPlans.map((actionPlan) => normalizeActionPlan(actionPlan));
