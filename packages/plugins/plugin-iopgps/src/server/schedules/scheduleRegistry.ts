/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface IopgpsScheduleDraft {
  name: string;
  title: string;
  description: string;
  defaultEnabled: boolean;
  callsRealApi: false;
  writesDatabase: false;
  notes: string[];
}

export const iopgpsScheduleRegistry: IopgpsScheduleDraft[] = [
  {
    name: 'sync_iopgps_device_status',
    title: '同步 IOPGPS 设备状态',
    description: '后续接入 scheduler / workflow 后定时同步设备状态并写错误日志。',
    defaultEnabled: false,
    callsRealApi: false,
    writesDatabase: false,
    notes: ['本轮不调用真实 IOPGPS API；失败不得影响租金台账和付款。'],
  },
  {
    name: 'sync_iopgps_location',
    title: '同步 IOPGPS 定位快照',
    description: '后续定时同步定位快照和车辆最近位置。',
    defaultEnabled: false,
    callsRealApi: false,
    writesDatabase: false,
    notes: ['本轮不写数据库，不调用真实 API。'],
  },
  {
    name: 'sync_iopgps_daily_mileage',
    title: '同步 IOPGPS 每日里程',
    description: '后续定时同步每日里程，GPS 里程只用于运营核查。',
    defaultEnabled: false,
    callsRealApi: false,
    writesDatabase: false,
    notes: ['GPS 里程不参与租金计算。'],
  },
];
