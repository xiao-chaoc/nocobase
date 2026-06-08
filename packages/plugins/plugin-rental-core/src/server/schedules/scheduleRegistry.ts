/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface ScheduleDraft {
  name: string;
  title: string;
  description: string;
  taskType: 'scheduled' | 'workflow';
  defaultEnabled: boolean;
  sideEffects: 'none_in_skeleton';
  notes: string[];
}

export const rentalCoreScheduleRegistry: ScheduleDraft[] = [
  {
    name: 'ensure_open_ended_ledgers',
    title: '长租合同未来台账补生成',
    description: '后续接入 NocoBase scheduler / workflow 后，用于按 horizonDays 为长租合同补生成未来每日台账。',
    taskType: 'scheduled',
    defaultEnabled: false,
    sideEffects: 'none_in_skeleton',
    notes: ['本轮不写数据库，不真实执行。'],
  },
  {
    name: 'refresh_contract_summaries',
    title: '刷新合同财务汇总',
    description: '后续用于根据 rent_daily_ledgers 和 deposit_records 刷新合同汇总字段。',
    taskType: 'scheduled',
    defaultEnabled: false,
    sideEffects: 'none_in_skeleton',
    notes: ['本轮只保留任务草案；真实接入时需要服务端事务。'],
  },
  {
    name: 'refresh_driver_calendar_summaries',
    title: '刷新司机日历汇总',
    description: '后续用于刷新司机日历视图所需汇总，不替代每日台账事实来源。',
    taskType: 'scheduled',
    defaultEnabled: false,
    sideEffects: 'none_in_skeleton',
    notes: ['本轮不写数据库，不配置真实工作流。'],
  },
];
