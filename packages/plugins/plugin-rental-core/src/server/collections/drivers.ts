/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：drivers（司机表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const driversCollectionDraft = {
  name: 'drivers',
  title: '司机表',
  fields: [
    'driver_id',
    'driver_no',
    'name',
    'phone',
    'email',
    'id_no',
    'id_front_file',
    'id_back_file',
    'license_no',
    'license_front_file',
    'license_back_file',
    'current_contract_id',
    'risk_status',
    'status',
    'remark',
  ],
  indexes: ['driver_no', 'phone', 'status'],
  uniqueConstraints: [['driver_no']],
  sensitiveFields: ['id_no', 'id_front_file', 'id_back_file', 'license_front_file', 'license_back_file'],
  relations: [
    {
      field: 'current_contract_id',
      target: 'lease_contracts.contract_id',
      type: 'belongsTo',
    },
  ],
  notes: ['司机不登录系统，不关联 NocoBase 用户。', '当前仅为 Collection 注册草案，不是数据库迁移。'],
} as const;
