/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocobaseSchedulePlan } from './types';

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

export const normalizeSchedulePlan = (rawSchedulePlan: NocobaseSchedulePlan): NocobaseSchedulePlan => {
  const name = String(rawSchedulePlan.name ?? '');
  const sourcePlugin = String(rawSchedulePlan.sourcePlugin ?? '');
  const notes = asStringArray(rawSchedulePlan.notes);
  let enabledByDefault = Boolean(rawSchedulePlan.enabledByDefault ?? false);

  if (!name) notes.push('错误：定时任务 name 必须存在。');
  if (!sourcePlugin) notes.push('错误：定时任务 sourcePlugin 必须存在。');
  if (!rawSchedulePlan.serviceName) notes.push('错误：定时任务 serviceName 必须存在。');
  if (sourcePlugin === 'plugin-iopgps' && !notes.some((note) => note.includes('mock'))) {
    enabledByDefault = false;
    notes.push('IOPGPS 定时任务 dry-run 默认关闭；真实同步必须人工启用并配置测试密钥。');
  }
  if (sourcePlugin === 'plugin-rental-core' && name.includes('open_ended')) {
    notes.push('长租未来台账补生成可能影响大量数据；真实启用前必须确认 horizonDays、事务和幂等策略。');
  }
  notes.push('本轮不真实注册定时任务，不执行真实 scheduler。');

  return {
    name,
    title: String(rawSchedulePlan.title ?? name),
    sourcePlugin,
    cron: String(rawSchedulePlan.cron ?? '后续接入真实 scheduler 后配置'),
    enabledByDefault,
    serviceName: String(rawSchedulePlan.serviceName ?? ''),
    notes,
  };
};

export const normalizeSchedulePlans = (schedulePlans: NocobaseSchedulePlan[]): NocobaseSchedulePlan[] =>
  schedulePlans.map((schedulePlan) => normalizeSchedulePlan(schedulePlan));
