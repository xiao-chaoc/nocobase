/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DateRange, ID } from '../types/commonTypes';
import type { DepositRecord, DepositStatus } from '../types/depositTypes';
import type { RentDailyLedger } from '../types/ledgerTypes';
import type { ContractFinancialSummary, DriverCalendarSummary, SummaryContractLike } from '../types/summaryTypes';
import { compareBillingDate } from './dateBillingUtils';
import { throwBusinessError } from './errors';

function assertToday(today: string): void {
  if (!today) {
    throwBusinessError('summary_today_required');
  }
}

function isInDateRange(date: string, dateRange?: DateRange): boolean {
  if (!dateRange) return true;
  if (compareBillingDate(dateRange.fromDate, dateRange.toDate) > 0) {
    throwBusinessError('calendar_date_range_invalid');
  }
  return compareBillingDate(date, dateRange.fromDate) >= 0 && compareBillingDate(date, dateRange.toDate) <= 0;
}

function isActiveLedger(ledger: RentDailyLedger): boolean {
  return ledger.status !== 'cancelled';
}

function isPayableActiveLedger(ledger: RentDailyLedger): boolean {
  return isActiveLedger(ledger) && ledger.is_payable;
}

function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function uniqueIds(values: ID[]): ID[] {
  const seen = new Set<string>();
  const result: ID[] = [];
  for (const value of values) {
    const key = String(value);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}

function summarizeDepositStatus(deposits: DepositRecord[]): DepositStatus {
  if (deposits.length === 0) return 'pending';
  if (deposits.every((deposit) => deposit.status === 'cancelled')) return 'cancelled';
  if (deposits.some((deposit) => deposit.status === 'refund_pending')) return 'refund_pending';

  const activeDeposits = deposits.filter((deposit) => deposit.status !== 'cancelled');
  const requiredAmount = activeDeposits.reduce((sum, deposit) => sum + deposit.required_amount, 0);
  const receivedAmount = activeDeposits.reduce((sum, deposit) => sum + deposit.received_amount, 0);
  const deductedAmount = activeDeposits.reduce((sum, deposit) => sum + deposit.deducted_amount, 0);
  const refundedAmount = activeDeposits.reduce((sum, deposit) => sum + deposit.refunded_amount, 0);
  const availableAmount = activeDeposits.reduce(
    (sum, deposit) =>
      sum + (deposit.available_amount ?? deposit.received_amount - deposit.deducted_amount - deposit.refunded_amount),
    0,
  );

  if (activeDeposits.length > 0 && activeDeposits.every((deposit) => deposit.status === 'waived')) return 'waived';
  if (receivedAmount > 0 && refundedAmount >= receivedAmount) return 'refunded';
  if (refundedAmount > 0 && availableAmount > 0) return 'partially_refunded';
  if (deductedAmount > 0 && availableAmount === 0) return 'deducted';
  if (deductedAmount > 0 && availableAmount > 0) return 'partially_deducted';
  if (receivedAmount >= requiredAmount && requiredAmount > 0) return 'held';
  if (receivedAmount > 0) return 'collected';
  return 'pending';
}

function buildEmptyContractSummary(contract: SummaryContractLike, deposits: DepositRecord[]): ContractFinancialSummary {
  return {
    contract_id: contract.contract_id,
    driver_id: contract.driver_id,
    vehicle_id: contract.vehicle_id,
    total_due_amount: 0,
    total_paid_amount: 0,
    total_waived_amount: 0,
    current_debt_amount: 0,
    current_debt_days: 0,
    future_receivable_amount: 0,
    payable_days_count: 0,
    paid_days_count: 0,
    unpaid_days_count: 0,
    waived_days_count: 0,
    non_payable_days_count: 0,
    dispute_amount: 0,
    dispute_days: 0,
    deposit_required_amount: roundMoney(
      deposits
        .filter((deposit) => deposit.status !== 'cancelled')
        .reduce((sum, deposit) => sum + deposit.required_amount, 0),
    ),
    deposit_received_amount: roundMoney(
      deposits
        .filter((deposit) => deposit.status !== 'cancelled')
        .reduce((sum, deposit) => sum + deposit.received_amount, 0),
    ),
    deposit_status: summarizeDepositStatus(deposits),
  };
}

function applyLedgerToSummary<T extends ContractFinancialSummary | DriverCalendarSummary>(
  summary: T,
  ledger: RentDailyLedger,
  today: string,
): void {
  if (!isActiveLedger(ledger)) return;

  if (!ledger.is_payable) {
    summary.non_payable_days_count += 1;
    return;
  }

  summary.payable_days_count += 1;
  summary.total_paid_amount = roundMoney(summary.total_paid_amount + ledger.paid_amount);
  summary.total_waived_amount = roundMoney(summary.total_waived_amount + ledger.waived_amount);
  if ('total_due_amount' in summary) {
    summary.total_due_amount = roundMoney(summary.total_due_amount + ledger.due_amount);
  }

  if (
    (ledger.calendar_status === 'paid' || ledger.calendar_status === 'partial_waived') &&
    ledger.balance_amount === 0
  ) {
    summary.paid_days_count += 1;
  }
  if (ledger.calendar_status === 'waived' || ledger.calendar_status === 'partial_waived') {
    summary.waived_days_count += 1;
  }

  const isFuture = compareBillingDate(ledger.rent_date, today) > 0;
  const hasBalance = ledger.balance_amount > 0;
  const isDispute = ledger.shortfall_disposition === 'dispute';

  if (isFuture && hasBalance) {
    summary.future_receivable_amount = roundMoney(summary.future_receivable_amount + ledger.balance_amount);
    return;
  }

  if (!isFuture && hasBalance && isDispute) {
    summary.dispute_amount = roundMoney(summary.dispute_amount + ledger.balance_amount);
    summary.dispute_days += 1;
    return;
  }

  if (!isFuture && hasBalance) {
    summary.current_debt_amount = roundMoney(summary.current_debt_amount + ledger.balance_amount);
    summary.current_debt_days += 1;
    if (ledger.calendar_status === 'unpaid_debt' || ledger.calendar_status === 'partial_debt') {
      summary.unpaid_days_count += 1;
    }
  }
}

/**
 * 根据合同下的每日租金台账和押金记录计算合同财务汇总。
 * 本函数只处理传入数组，不写数据库；后续落库更新 lease_contracts 汇总字段时必须使用服务端事务。
 * TODO: 若押金被用于抵扣租金欠款，后续应通过专门业务流程写押金抵扣记录，不能伪造普通租金付款。
 */
export function refreshContractFinancialSummary(
  contract: SummaryContractLike,
  ledgers: RentDailyLedger[],
  deposits: DepositRecord[],
  today: string,
): ContractFinancialSummary {
  assertToday(today);
  const contractLedgers = ledgers.filter((ledger) => String(ledger.contract_id) === String(contract.contract_id));
  const contractDeposits = deposits.filter((deposit) => String(deposit.contract_id) === String(contract.contract_id));
  const summary = buildEmptyContractSummary(contract, contractDeposits);

  for (const ledger of contractLedgers) {
    applyLedgerToSummary(summary, ledger, today);
  }

  return summary;
}

/**
 * 计算某个司机在指定日期范围内的日历汇总。
 * 当前欠款只统计截至 today 的应收未结清日期；未来应收单独统计，不混入当前欠款。
 */
export function refreshDriverCalendarSummary(
  driverId: ID,
  contracts: SummaryContractLike[],
  ledgers: RentDailyLedger[],
  deposits: DepositRecord[],
  dateRange: DateRange | undefined,
  today: string,
): DriverCalendarSummary {
  if (driverId === undefined || driverId === null || driverId === '') {
    throwBusinessError('calendar_driver_required');
  }
  assertToday(today);
  if (dateRange && compareBillingDate(dateRange.fromDate, dateRange.toDate) > 0) {
    throwBusinessError('calendar_date_range_invalid');
  }

  const driverContracts = contracts.filter((contract) => String(contract.driver_id) === String(driverId));
  const driverContractIds = uniqueIds(driverContracts.map((contract) => contract.contract_id));
  const driverVehicleIds = uniqueIds(driverContracts.map((contract) => contract.vehicle_id));
  const driverLedgers = ledgers.filter(
    (ledger) => String(ledger.driver_id) === String(driverId) && isInDateRange(ledger.rent_date, dateRange),
  );
  const driverDeposits = deposits.filter((deposit) => String(deposit.driver_id) === String(driverId));

  const summary: DriverCalendarSummary = {
    driver_id: driverId,
    contract_ids: driverContractIds,
    vehicle_ids: driverVehicleIds,
    date_range_start: dateRange?.fromDate,
    date_range_end: dateRange?.toDate,
    current_debt_amount: 0,
    current_debt_days: 0,
    total_paid_amount: 0,
    total_waived_amount: 0,
    future_receivable_amount: 0,
    deposit_required_amount: roundMoney(
      driverDeposits
        .filter((deposit) => deposit.status !== 'cancelled')
        .reduce((sum, deposit) => sum + deposit.required_amount, 0),
    ),
    deposit_received_amount: roundMoney(
      driverDeposits
        .filter((deposit) => deposit.status !== 'cancelled')
        .reduce((sum, deposit) => sum + deposit.received_amount, 0),
    ),
    payable_days_count: 0,
    paid_days_count: 0,
    unpaid_days_count: 0,
    waived_days_count: 0,
    non_payable_days_count: 0,
    dispute_amount: 0,
    dispute_days: 0,
  };

  for (const ledger of driverLedgers) {
    applyLedgerToSummary(summary, ledger, today);
  }

  // TODO: 后续可在服务端根据合同状态和日期范围补充 current_contract/current_vehicle 快照字段。
  return summary;
}

export { isPayableActiveLedger };
