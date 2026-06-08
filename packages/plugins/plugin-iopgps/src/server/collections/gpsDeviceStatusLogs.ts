/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：gps_device_status_logs（GPS 状态日志表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const gpsDeviceStatusLogsCollectionDraft = {
  name: 'gps_device_status_logs',
  title: 'GPS 状态日志表',
  fields: [
    'status_log_id',
    'device_id',
    'vehicle_id',
    'imei',
    'provider_status',
    'normalized_status',
    'lat',
    'lng',
    'gps_time',
    'raw_response',
    'created_at',
  ],
  indexes: ['device_id', 'vehicle_id', 'imei', 'normalized_status', 'gps_time'],
  uniqueConstraints: [],
  sensitiveFields: ['lat', 'lng', 'raw_response'],
  relations: [
    {
      field: 'device_id',
      target: 'gps_devices.device_id',
      type: 'belongsTo',
    },
    {
      field: 'vehicle_id',
      target: 'vehicles.vehicle_id',
      type: 'externalPluginReference',
    },
  ],
  notes: [
    '记录 normal/offline/fault/low_power/power_cut 等状态变化，仅用于运营监控。',
    'raw_response 为排障字段。',
    'IOPGPS 失败不能影响租金台账和付款逻辑。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
