/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：gps_location_snapshots（GPS 定位快照表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const gpsLocationSnapshotsCollectionDraft = {
  name: 'gps_location_snapshots',
  title: 'GPS 定位快照表',
  fields: [
    'snapshot_id',
    'vehicle_id',
    'device_id',
    'imei',
    'lat',
    'lng',
    'address',
    'speed',
    'acc_status',
    'position_type',
    'gps_time',
    'raw_response',
    'created_at',
  ],
  indexes: ['vehicle_id', 'device_id', 'imei', 'gps_time'],
  uniqueConstraints: [],
  sensitiveFields: ['lat', 'lng', 'address', 'raw_response'],
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
    'raw_response 为排障字段。',
    '定位历史只用于运营监控，不参与租金计算。',
    '同步失败只写错误日志，不影响租金台账和付款逻辑。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
