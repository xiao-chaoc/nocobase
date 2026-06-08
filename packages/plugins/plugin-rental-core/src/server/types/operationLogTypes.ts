/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID } from './commonTypes';

export type OperationAction =
  | 'driver_created'
  | 'vehicle_created'
  | 'contract_created'
  | 'contract_activated'
  | 'contract_terminated'
  | 'ledger_generated'
  | 'ledger_manual_adjusted'
  | 'free_day_adjusted'
  | 'payable_day_adjusted'
  | 'payment_created'
  | 'payment_confirmed'
  | 'payment_reversed'
  | 'unpaid_reason_changed'
  | 'shortfall_marked_debt'
  | 'shortfall_marked_dispute'
  | 'waiver_requested'
  | 'waiver_approved'
  | 'waiver_rejected'
  | 'deposit_created'
  | 'deposit_collected'
  | 'deposit_deducted'
  | 'deposit_refunded'
  | 'deposit_waived'
  | 'gps_sync_failed'
  | 'contract_document_generated'
  | 'contract_document_scanned'
  | 'permission_sensitive_data_filtered';

export interface OperationLog {
  log_id: ID;
  log_no: string;
  operator_id: ID;
  action: OperationAction;
  target_collection: string;
  target_id: ID;
  /** JSON 快照，写入前必须脱敏。 */
  before_value?: unknown;
  /** JSON 快照，写入前必须脱敏。 */
  after_value?: unknown;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  remark?: string;
}

export interface RecordOperationLogInput {
  operator_id: ID;
  action: OperationAction;
  target_collection: string;
  target_id: ID;
  before_value?: unknown;
  after_value?: unknown;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  remark?: string;
}
