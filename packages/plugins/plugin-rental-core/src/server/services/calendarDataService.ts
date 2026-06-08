/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DateRange, ID } from '../types/commonTypes';
import type { DepositRecord } from '../types/depositTypes';
import type { LedgerCalendarStatus, LedgerPaymentStatus, RentDailyLedger } from '../types/ledgerTypes';
import type { CurrentUserContext, CurrentUserPermissionContext } from '../types/permissionTypes';
import type { DriverCalendarData, DriverCalendarDay, SummaryContractLike } from '../types/summaryTypes';
import { compareBillingDate } from './dateBillingUtils';
import { throwBusinessError } from './errors';
import { filterCalendarSensitiveData } from './permissionFilterService';
import { refreshDriverCalendarSummary } from './summaryService';

export interface DriverCalendarFilters {
  contract_id?: ID;
  vehicle_id?: ID;
  payment_status?: LedgerPaymentStatus;
  calendar_status?: LedgerCalendarStatus;
  debt_only?: boolean;
  /** debt_only 场景默认不把争议混入欠款列表，确需查看争议时显式开启。 */
  include_dispute?: boolean;
}

export interface GetDriverCalendarDataInput {
  driver_id: ID;
  contracts: SummaryContractLike[];
  ledgers: RentDailyLedger[];
  deposits: DepositRecord[];
  date_range?: DateRange;
  current_user: CurrentUserContext | CurrentUserPermissionContext;
  today: string;
  filters?: DriverCalendarFilters;
}

function isInDateRange(date: string, dateRange?: DateRange): boolean {
  if (!dateRange) return true;
  if (compareBillingDate(dateRange.fromDate, dateRange.toDate) > 0) {
    throwBusinessError('calendar_date_range_invalid');
  }
  return compareBillingDate(date, dateRange.fromDate) >= 0 && compareBillingDate(date, dateRange.toDate) <= 0;
}

function applyCalendarFilters(
  ledger: RentDailyLedger,
  filters: DriverCalendarFilters | undefined,
  today: string,
): boolean {
  if (!filters) return true;
  if (filters.contract_id !== undefined && String(ledger.contract_id) !== String(filters.contract_id)) return false;
  if (filters.vehicle_id !== undefined && String(ledger.vehicle_id) !== String(filters.vehicle_id)) return false;
  if (filters.payment_status !== undefined && ledger.payment_status !== filters.payment_status) return false;
  if (filters.calendar_status !== undefined && ledger.calendar_status !== filters.calendar_status) return false;

  if (filters.debt_only) {
    const isFuture = compareBillingDate(ledger.rent_date, today) > 0;
    const isDispute = ledger.shortfall_disposition === 'dispute';
    if (isFuture) return false;
    if (!ledger.is_payable) return false;
    if (ledger.balance_amount <= 0) return false;
    if (isDispute && !filters.include_dispute) return false;
  }

  return true;
}

function toCalendarDay(ledger: RentDailyLedger): DriverCalendarDay {
  const source = ledger as RentDailyLedger & {
    latest_payment_at?: string;
    payment_screenshot?: unknown;
    payment_method?: string;
  };

  return {
    ledger_id: ledger.ledger_id,
    contract_id: ledger.contract_id,
    driver_id: ledger.driver_id,
    vehicle_id: ledger.vehicle_id,
    rent_date: ledger.rent_date,
    weekday: ledger.weekday,
    is_payable: ledger.is_payable,
    due_amount: ledger.due_amount,
    paid_amount: ledger.paid_amount,
    waived_amount: ledger.waived_amount,
    balance_amount: ledger.balance_amount,
    payment_status: ledger.payment_status,
    unpaid_reason: ledger.unpaid_reason,
    shortfall_disposition: ledger.shortfall_disposition,
    calendar_status: ledger.calendar_status,
    latest_payment_at: source.latest_payment_at,
    payment_screenshot: source.payment_screenshot,
    payment_method: source.payment_method,
  };
}

/**
 * 获取司机日历数据的纯函数入口。
 * 本轮只处理传入数组，不查询真实数据库、不配置页面；后续接入 NocoBase 时必须继续在服务端执行同等过滤。
 */
export function getDriverCalendarData(input: GetDriverCalendarDataInput): DriverCalendarData {
  if (input.driver_id === undefined || input.driver_id === null || input.driver_id === '') {
    throwBusinessError('calendar_driver_required');
  }
  if (!input.today) {
    throwBusinessError('summary_today_required');
  }

  const ledgers = input.ledgers
    .filter((ledger) => String(ledger.driver_id) === String(input.driver_id))
    .filter((ledger) => isInDateRange(ledger.rent_date, input.date_range))
    .filter((ledger) => applyCalendarFilters(ledger, input.filters, input.today));

  const summary = refreshDriverCalendarSummary(
    input.driver_id,
    input.contracts,
    ledgers,
    input.deposits,
    input.date_range,
    input.today,
  );

  const unfilteredData: DriverCalendarData = {
    summary,
    days: ledgers.map(toCalendarDay),
    hidden_fields: [],
    visible_fields: {} as DriverCalendarData['visible_fields'],
  };

  return filterCalendarSensitiveData(unfilteredData, input.current_user).data;
}
