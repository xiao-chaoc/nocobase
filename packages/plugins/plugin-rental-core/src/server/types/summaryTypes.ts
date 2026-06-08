/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID, DateRange, Weekday } from './commonTypes';
import type { DepositStatus } from './depositTypes';
import type { CalendarSensitiveField, CalendarFieldVisibility } from './permissionTypes';
import type { LedgerCalendarStatus, LedgerPaymentStatus, ShortfallDisposition, UnpaidReason } from './ledgerTypes';

export interface SummaryContractLike {
  contract_id: ID;
  driver_id: ID;
  vehicle_id: ID;
}

export interface ContractFinancialSummary {
  contract_id: ID;
  driver_id: ID;
  vehicle_id: ID;
  total_due_amount: number;
  total_paid_amount: number;
  total_waived_amount: number;
  current_debt_amount: number;
  current_debt_days: number;
  future_receivable_amount: number;
  payable_days_count: number;
  paid_days_count: number;
  unpaid_days_count: number;
  waived_days_count: number;
  non_payable_days_count: number;
  dispute_amount: number;
  dispute_days: number;
  deposit_required_amount: number;
  deposit_received_amount: number;
  deposit_status: DepositStatus;
}

export interface DriverCalendarSummary {
  driver_id: ID;
  contract_ids: ID[];
  vehicle_ids: ID[];
  date_range_start?: string;
  date_range_end?: string;
  current_debt_amount: number;
  current_debt_days: number;
  total_paid_amount: number;
  total_waived_amount: number;
  future_receivable_amount: number;
  deposit_required_amount: number;
  deposit_received_amount: number;
  payable_days_count: number;
  paid_days_count: number;
  unpaid_days_count: number;
  waived_days_count: number;
  non_payable_days_count: number;
  dispute_amount: number;
  dispute_days: number;
}

export interface DriverCalendarDay {
  ledger_id: ID;
  contract_id: ID;
  driver_id: ID;
  vehicle_id: ID;
  rent_date: string;
  weekday?: Weekday;
  is_payable: boolean;
  due_amount: number | null;
  paid_amount: number | null;
  waived_amount: number | null;
  balance_amount: number | null;
  payment_status: LedgerPaymentStatus;
  unpaid_reason: UnpaidReason;
  shortfall_disposition: ShortfallDisposition;
  calendar_status: LedgerCalendarStatus;
  latest_payment_at?: string;
  payment_screenshot?: unknown;
  payment_method?: string | null;
}

export interface DriverCalendarData {
  summary: DriverCalendarSummary;
  days: DriverCalendarDay[];
  hidden_fields: CalendarSensitiveField[];
  visible_fields: CalendarFieldVisibility;
}

export type DriverCalendarDateRange = DateRange;
