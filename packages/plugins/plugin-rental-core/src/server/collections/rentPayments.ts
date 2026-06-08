/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：rent_payments（付款记录表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const rentPaymentsCollectionDraft = {
  name: 'rent_payments',
  title: '付款记录表',
  fields: [
    'payment_id',
    'payment_no',
    'driver_id',
    'contract_id',
    'vehicle_id',
    'payment_date',
    'paid_at',
    'amount',
    'method',
    'screenshot_file',
    'received_by',
    'status',
    'remark',
  ],
  indexes: ['driver_id', 'contract_id', 'vehicle_id', 'payment_date', 'status'],
  uniqueConstraints: [['payment_no']],
  sensitiveFields: ['amount', 'method', 'screenshot_file'],
  relations: [
    {
      field: 'driver_id',
      target: 'drivers.driver_id',
      type: 'belongsTo',
    },
    {
      field: 'contract_id',
      target: 'lease_contracts.contract_id',
      type: 'belongsTo',
    },
    {
      field: 'vehicle_id',
      target: 'vehicles.vehicle_id',
      type: 'belongsTo',
    },
  ],
  notes: [
    '付款必须分配到具体日期，不允许只保存总金额。',
    'payment_no 必须唯一。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
