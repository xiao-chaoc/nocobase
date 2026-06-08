/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：vehicles（车辆表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const vehiclesCollectionDraft = {
  name: 'vehicles',
  title: '车辆表',
  fields: [
    'vehicle_id',
    'vehicle_no',
    'plate_no',
    'vin',
    'brand',
    'model',
    'gps_device_id',
    'gps_imei',
    'availability_status',
    'gps_status',
    'last_gps_lat',
    'last_gps_lng',
    'last_gps_address',
    'last_gps_time',
    'status',
    'remark',
  ],
  indexes: ['plate_no', 'availability_status', 'gps_status'],
  uniqueConstraints: [['vehicle_no'], ['plate_no'], ['vin']],
  sensitiveFields: ['last_gps_lat', 'last_gps_lng', 'last_gps_address', 'last_gps_time'],
  relations: [
    {
      field: 'gps_device_id',
      target: 'gps_devices.device_id',
      type: 'externalPluginReference',
    },
  ],
  notes: [
    '合同必须绑定具体车牌，brand/model 只作资料，不按车型出租。',
    'GPS 数据仅用于运营监控，不参与租金计算。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
