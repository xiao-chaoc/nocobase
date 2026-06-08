/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：contract_billing_weeks（自然周账期表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const contractBillingWeeksCollectionDraft = {
  name: 'contract_billing_weeks',
  title: '自然周账期表',
  fields: [
    'billing_week_id',
    'contract_id',
    'driver_id',
    'vehicle_id',
    'natural_week_start_date',
    'natural_week_end_date',
    'payable_days_count',
    'week_due_amount',
    'week_paid_amount',
    'week_waived_amount',
    'week_debt_amount',
    'status',
    'remark',
  ],
  indexes: ['contract_id', 'natural_week_start_date', 'status'],
  uniqueConstraints: [['contract_id', 'natural_week_start_date']],
  sensitiveFields: ['week_paid_amount', 'week_debt_amount'],
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
    '自然周账期来源于每日租金台账汇总，不替代 rent_daily_ledgers 单一事实来源。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
