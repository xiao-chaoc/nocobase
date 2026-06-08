/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：gps_device_bindings（GPS 绑定历史表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const gpsDeviceBindingsCollectionDraft = {
  name: 'gps_device_bindings',
  title: 'GPS 绑定历史表',
  fields: ['binding_id', 'device_id', 'vehicle_id', 'imei', 'bound_at', 'unbound_at', 'status', 'remark'],
  indexes: ['device_id', 'vehicle_id', 'imei', 'status'],
  uniqueConstraints: [['device_id', 'status']],
  sensitiveFields: [],
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
    '同一 device_id 同时仅一条 active 绑定，后续需以条件唯一约束或服务端校验实现。',
    'GPS 绑定不参与租金计算。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
