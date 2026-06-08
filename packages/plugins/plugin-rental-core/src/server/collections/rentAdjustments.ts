/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：rent_adjustments（租金调整表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const rentAdjustmentsCollectionDraft = {
  name: 'rent_adjustments',
  title: '租金调整表',
  fields: [
    'adjustment_id',
    'adjustment_no',
    'ledger_id',
    'contract_id',
    'driver_id',
    'vehicle_id',
    'adjustment_type',
    'amount',
    'reason',
    'requested_by',
    'approved_by',
    'status',
    'created_at',
    'remark',
  ],
  indexes: ['contract_id', 'ledger_id', 'adjustment_type', 'status'],
  uniqueConstraints: [['adjustment_no']],
  sensitiveFields: ['amount', 'reason'],
  relations: [
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
  ],
  notes: ['免除和手动调整必须有原因并预留审批/操作日志。', '当前仅为 Collection 注册草案，不是数据库迁移。'],
} as const;
