/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID, Weekday } from './commonTypes';

export type LedgerPaymentStatus = 'non_payable' | 'unpaid' | 'partial' | 'paid' | 'waived' | 'cancelled';
export type LedgerCalendarStatus =
  | 'non_payable'
  | 'future_receivable'
  | 'paid'
  | 'unpaid_debt'
  | 'partial_debt'
  | 'waived'
  | 'partial_waived'
  | 'dispute'
  | 'cancelled';
export type CalendarStatus = LedgerCalendarStatus;
export type ShortfallDisposition = 'none' | 'debt' | 'waived' | 'pending_waiver_approval' | 'dispute';
export type UnpaidReason =
  | 'none'
  | 'waiting_for_payment'
  | 'driver_promised_to_pay'
  | 'dispute'
  | 'internal_review'
  | 'pending_waiver_approval'
  | 'other';
export type NonPayableReason =
  | 'none'
  | 'default_free_day'
  | 'manual_free_day'
  | 'contract_not_active'
  | 'cancelled'
  | 'other';
export type ManualAdjustmentType =
  | 'change_to_free_day'
  | 'change_to_payable_day'
  | 'change_unpaid_reason'
  | 'mark_debt'
  | 'request_waiver'
  | 'mark_dispute'
  | 'cancel_ledger'
  | 'correction';
export type LedgerRecordStatus = 'active' | 'locked' | 'cancelled';

export interface RentDailyLedger {
  ledger_id: ID;
  contract_id: ID;
  driver_id: ID;
  vehicle_id: ID;
  rent_date: string;
  natural_week_start_date?: string;
  natural_week_end_date?: string;
  weekday?: Weekday;
  is_payable: boolean;
  non_payable_reason?: NonPayableReason;
  due_amount: number;
  paid_amount: number;
  waived_amount: number;
  balance_amount: number;
  payment_status: LedgerPaymentStatus;
  unpaid_reason: UnpaidReason;
  shortfall_disposition: ShortfallDisposition;
  calendar_status: LedgerCalendarStatus;
  manual_adjusted?: boolean;
  status: LedgerRecordStatus;
  remark?: string;
}

export interface DailyLedgerDraft {
  contractId: ID;
  rentDate: string;
  isPayable: boolean;
  dueAmount: number;
  paymentStatus: LedgerPaymentStatus;
  calendarStatus: LedgerCalendarStatus;
}

export interface LedgerPreviewSummary {
  total_due_amount: number;
  current_debt_amount: number;
  current_debt_days: number;
  future_receivable_amount: number;
  payable_days_count: number;
  non_payable_days_count: number;
  ledger_count: number;
}

export interface LedgerPreviewResult {
  ledgers: RentDailyLedger[];
  summary: LedgerPreviewSummary;
}
