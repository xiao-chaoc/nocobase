/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：gps_daily_mileages（GPS 每日里程表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const gpsDailyMileagesCollectionDraft = {
  name: 'gps_daily_mileages',
  title: 'GPS 每日里程表',
  fields: [
    'mileage_id',
    'vehicle_id',
    'device_id',
    'imei',
    'mileage_date',
    'start_time',
    'end_time',
    'mileage_km',
    'runtime_seconds',
    'contract_id',
    'driver_id',
    'raw_response',
    'sync_status',
    'error_message',
  ],
  indexes: ['vehicle_id', 'device_id', 'mileage_date', 'sync_status'],
  uniqueConstraints: [['device_id', 'mileage_date']],
  sensitiveFields: ['raw_response'],
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
    {
      field: 'contract_id',
      target: 'lease_contracts.contract_id',
      type: 'externalPluginReference',
    },
    {
      field: 'driver_id',
      target: 'drivers.driver_id',
      type: 'externalPluginReference',
    },
  ],
  notes: [
    'device_id + mileage_date 必须唯一，用于幂等保存。',
    'GPS 里程只用于运营核查，不参与租金计算。',
    'IOPGPS 失败不能影响租金台账和付款逻辑。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
