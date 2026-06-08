/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：lease_contracts（合同表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const leaseContractsCollectionDraft = {
  name: 'lease_contracts',
  title: '合同表',
  fields: [
    'contract_id',
    'contract_no',
    'contract_type',
    'driver_id',
    'vehicle_id',
    'start_date',
    'term_months',
    'calculated_end_date',
    'weekly_payable_days',
    'default_free_weekdays',
    'daily_rent_amount',
    'deposit_required_amount',
    'deposit_received_amount',
    'total_paid_amount',
    'current_debt_amount',
    'current_debt_days',
    'future_receivable_amount',
    'status',
    'remark',
  ],
  indexes: ['driver_id', 'vehicle_id', 'status', 'start_date'],
  uniqueConstraints: [['contract_no']],
  sensitiveFields: [
    'deposit_required_amount',
    'deposit_received_amount',
    'total_paid_amount',
    'current_debt_amount',
    'current_debt_days',
    'future_receivable_amount',
  ],
  relations: [
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
    '同一车辆不能存在冲突有效合同，后续由服务端校验和数据库约束共同保证。',
    'rental-core 不依赖 IOPGPS 或合同文件插件。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
