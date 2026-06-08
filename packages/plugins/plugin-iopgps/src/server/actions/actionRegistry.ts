/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface IopgpsActionDraft {
  name: string;
  title: string;
  input: string[];
  output: string;
  requiredRoles: string[];
  callsService: string;
  failureScenarios: string[];
  callsRealApi: false;
  writesDatabase: false;
}

export const iopgpsActionRegistry: IopgpsActionDraft[] = [
  {
    name: 'sync_device_status',
    title: '手动同步设备状态',
    input: ['device_id?', 'imei?'],
    output: '同步结果和错误日志草案',
    requiredRoles: ['system_admin', 'manager', 'gps_maintenance'],
    callsService: 'iopgpsDeviceStatusService',
    failureScenarios: ['token 失效', 'IOPGPS API 失败'],
    callsRealApi: false,
    writesDatabase: false,
  },
  {
    name: 'sync_location',
    title: '手动同步定位',
    input: ['device_id?', 'imei?'],
    output: '定位快照草案',
    requiredRoles: ['system_admin', 'manager', 'gps_maintenance'],
    callsService: 'iopgpsLocationService',
    failureScenarios: ['缺少 IMEI', '定位数据非法'],
    callsRealApi: false,
    writesDatabase: false,
  },
  {
    name: 'sync_daily_mileage',
    title: '手动同步每日里程',
    input: ['device_id', 'mileage_date'],
    output: '每日里程草案',
    requiredRoles: ['system_admin', 'manager', 'gps_maintenance'],
    callsService: 'iopgpsMileageService',
    failureScenarios: ['里程日期缺失', '里程为负数'],
    callsRealApi: false,
    writesDatabase: false,
  },
  {
    name: 'backfill_mileage',
    title: '补同步历史里程',
    input: ['device_id', 'date_range'],
    output: '补同步结果草案',
    requiredRoles: ['system_admin', 'manager'],
    callsService: 'iopgpsMileageService',
    failureScenarios: ['日期范围非法', 'IOPGPS API 失败'],
    callsRealApi: false,
    writesDatabase: false,
  },
];
