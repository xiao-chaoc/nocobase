/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：deposit_records（押金记录表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const depositRecordsCollectionDraft = {
  name: 'deposit_records',
  title: '押金记录表',
  fields: [
    'deposit_id',
    'deposit_no',
    'contract_id',
    'driver_id',
    'vehicle_id',
    'required_amount',
    'received_amount',
    'deducted_amount',
    'refunded_amount',
    'waived_amount',
    'available_amount',
    'method',
    'screenshot_file',
    'received_at',
    'status',
    'remark',
  ],
  indexes: ['contract_id', 'driver_id', 'vehicle_id', 'status'],
  uniqueConstraints: [['deposit_no']],
  sensitiveFields: [
    'required_amount',
    'received_amount',
    'deducted_amount',
    'refunded_amount',
    'waived_amount',
    'available_amount',
    'method',
    'screenshot_file',
  ],
  relations: [
    {
      field: 'contract_id',
      target: 'lease_contracts.contract_id',
      type: 'belongsTo',
    },
    {
      field: 'driver_id',
      target: 'drivers.driver_id',
      type: 'belongsTo',
    },
    {
      field: 'vehicle_id',
      target: 'vehicles.vehicle_id',
      type: 'belongsTo',
    },
  ],
  notes: [
    '押金和租金分开管理，不计入每日租金收入或 rent_payments.total_paid_amount。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
