/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：rent_payment_allocations（付款分配表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const rentPaymentAllocationsCollectionDraft = {
  name: 'rent_payment_allocations',
  title: '付款分配表',
  fields: [
    'allocation_id',
    'payment_id',
    'ledger_id',
    'contract_id',
    'driver_id',
    'rent_date',
    'allocated_amount',
    'status',
    'reversed_at',
    'reversed_reason',
  ],
  indexes: ['payment_id', 'ledger_id', 'contract_id', 'rent_date', 'status'],
  uniqueConstraints: [['payment_id', 'ledger_id', 'status']],
  sensitiveFields: ['allocated_amount'],
  relations: [
    {
      field: 'payment_id',
      target: 'rent_payments.payment_id',
      type: 'belongsTo',
    },
    {
      field: 'ledger_id',
      target: 'rent_daily_ledgers.ledger_id',
      type: 'belongsTo',
    },
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
  ],
  notes: [
    '任意日期超付时整笔付款失败，不允许部分成功。',
    '不允许自动转移超付金额或生成预收款，最终由服务端校验。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
