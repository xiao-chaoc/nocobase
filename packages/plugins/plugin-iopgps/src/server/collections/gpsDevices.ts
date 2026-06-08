/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：gps_devices（GPS 设备表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const gpsDevicesCollectionDraft = {
  name: 'gps_devices',
  title: 'GPS 设备表',
  fields: [
    'device_id',
    'imei',
    'provider',
    'device_name',
    'sim_no',
    'status',
    'last_status_raw',
    'last_sync_at',
    'remark',
  ],
  indexes: ['imei', 'status', 'last_sync_at'],
  uniqueConstraints: [['imei']],
  sensitiveFields: ['last_status_raw'],
  relations: [],
  notes: [
    'imei 必须唯一。',
    'raw_response/last_status_raw 仅用于排障，保存前应避免包含未脱敏密钥。',
    'GPS 数据不参与租金计算，IOPGPS 失败不能影响租金台账和付款逻辑。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
