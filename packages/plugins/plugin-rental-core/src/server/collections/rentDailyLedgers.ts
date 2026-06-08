/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：rent_daily_ledgers（每日租金台账）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const rentDailyLedgersCollectionDraft = {
  name: 'rent_daily_ledgers',
  title: '每日租金台账',
  fields: [
    'ledger_id',
    'ledger_no',
    'contract_id',
    'billing_week_id',
    'driver_id',
    'vehicle_id',
    'rent_date',
    'is_payable',
    'due_amount',
    'paid_amount',
    'waived_amount',
    'balance_amount',
    'payment_status',
    'unpaid_reason',
    'shortfall_disposition',
    'calendar_status',
    'status',
    'remark',
  ],
  indexes: ['contract_id', 'rent_date', 'driver_id', 'vehicle_id', 'calendar_status', 'payment_status'],
  uniqueConstraints: [['ledger_no'], ['contract_id', 'rent_date']],
  sensitiveFields: ['paid_amount', 'waived_amount', 'balance_amount', 'unpaid_reason'],
  relations: [
    {
      field: 'contract_id',
      target: 'lease_contracts.contract_id',
      type: 'belongsTo',
    },
    {
      field: 'billing_week_id',
      target: 'contract_billing_weeks.billing_week_id',
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
    '每日租金台账是应收、已付、欠款、未来应收和日历显示的唯一事实来源。',
    'contract_id + rent_date 必须唯一。',
    '单日不可超付，最终由服务端付款分配校验保证。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
