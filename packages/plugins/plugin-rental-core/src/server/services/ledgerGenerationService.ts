/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LeaseContractForLedgerGeneration } from '../types/contractTypes';
import type { LedgerPreviewResult, LedgerPreviewSummary, RentDailyLedger } from '../types/ledgerTypes';
import {
  addDaysForBilling,
  calculateFixedTermEndDate,
  compareBillingDate,
  eachDateBetween,
  getNaturalWeekRange,
  getWeekday,
} from './dateBillingUtils';
import { isDefaultFreeWeekday, validateDefaultFreeWeekdays } from './billingRuleService';
import { throwBusinessError } from './errors';

function assertDailyRentAmount(amount: number): void {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throwBusinessError('daily_rent_amount_invalid');
  }
}

function validateLedgerContract(contract: LeaseContractForLedgerGeneration): void {
  if (contract.contract_type !== 'fixed_term' && contract.contract_type !== 'open_ended') {
    throwBusinessError('contract_type_invalid');
  }
  assertDailyRentAmount(contract.daily_rent_amount);
  validateDefaultFreeWeekdays(contract.weekly_payable_days, contract.default_free_weekdays);
}

/**
 * 根据合同和租金日期生成单日台账对象。
 * 本函数不处理付款分配、不处理免除审批、不写真实数据库。
 */
export function buildDailyLedgerForDate(
  contract: LeaseContractForLedgerGeneration,
  rentDate: string,
  today: string,
): RentDailyLedger {
  validateLedgerContract(contract);
  const weekRange = getNaturalWeekRange(rentDate, contract.week_start_day ?? 'monday');
  const weekday = getWeekday(rentDate);
  const isFreeDay = isDefaultFreeWeekday(weekday, contract.default_free_weekdays);

  if (isFreeDay) {
    return {
      ledger_id: `${contract.contract_id}:${rentDate}`,
      contract_id: contract.contract_id,
      driver_id: contract.driver_id,
      vehicle_id: contract.vehicle_id,
      rent_date: rentDate,
      natural_week_start_date: weekRange.natural_week_start_date,
      natural_week_end_date: weekRange.natural_week_end_date,
      weekday,
      is_payable: false,
      non_payable_reason: 'default_free_day',
      due_amount: 0,
      paid_amount: 0,
      waived_amount: 0,
      balance_amount: 0,
      payment_status: 'non_payable',
      unpaid_reason: 'none',
      shortfall_disposition: 'none',
      calendar_status: 'non_payable',
      manual_adjusted: false,
      status: 'active',
    };
  }

  return {
    ledger_id: `${contract.contract_id}:${rentDate}`,
    contract_id: contract.contract_id,
    driver_id: contract.driver_id,
    vehicle_id: contract.vehicle_id,
    rent_date: rentDate,
    natural_week_start_date: weekRange.natural_week_start_date,
    natural_week_end_date: weekRange.natural_week_end_date,
    weekday,
    is_payable: true,
    non_payable_reason: 'none',
    due_amount: contract.daily_rent_amount,
    paid_amount: 0,
    waived_amount: 0,
    balance_amount: contract.daily_rent_amount,
    payment_status: 'unpaid',
    unpaid_reason: compareBillingDate(rentDate, today) > 0 ? 'none' : 'waiting_for_payment',
    shortfall_disposition: 'none',
    calendar_status: compareBillingDate(rentDate, today) > 0 ? 'future_receivable' : 'unpaid_debt',
    manual_adjusted: false,
    status: 'active',
  };
}

/** 为时限合同生成完整合同期每日台账预览，不写数据库。 */
export function generateFixedTermDailyLedgerPreview(
  contract: LeaseContractForLedgerGeneration,
  today: string,
): LedgerPreviewResult {
  validateLedgerContract(contract);
  if (contract.contract_type !== 'fixed_term') {
    throwBusinessError('contract_type_invalid');
  }
  if (!contract.term_months || contract.term_months < 6) {
    throwBusinessError('fixed_term_months_invalid');
  }

  const calculatedEndDate = calculateFixedTermEndDate(contract.start_date, contract.term_months);
  const contractWithEndDate: LeaseContractForLedgerGeneration = {
    ...contract,
    calculated_end_date: calculatedEndDate,
  };
  const ledgers = eachDateBetween(contract.start_date, calculatedEndDate).map((rentDate) =>
    buildDailyLedgerForDate(contractWithEndDate, rentDate, today),
  );

  return {
    ledgers,
    summary: summarizeLedgerPreview(ledgers, today),
  };
}

/** 为长租合同生成未来每日台账预览，不写数据库。 */
export function generateOpenEndedDailyLedgerPreview(
  contract: LeaseContractForLedgerGeneration,
  fromDate: string,
  horizonDays: number,
  today: string,
): LedgerPreviewResult {
  validateLedgerContract(contract);
  if (contract.contract_type !== 'open_ended') {
    throwBusinessError('contract_type_invalid');
  }
  if (!Number.isInteger(horizonDays) || horizonDays < 0) {
    throwBusinessError('horizon_days_invalid');
  }

  const startDate = compareBillingDate(fromDate, contract.start_date) < 0 ? contract.start_date : fromDate;
  let endDate = addDaysForBilling(startDate, horizonDays);
  if (contract.termination_date && compareBillingDate(endDate, contract.termination_date) > 0) {
    endDate = contract.termination_date;
  }

  if (compareBillingDate(startDate, endDate) > 0) {
    return {
      ledgers: [],
      summary: summarizeLedgerPreview([], today),
    };
  }

  const ledgers = eachDateBetween(startDate, endDate).map((rentDate) =>
    buildDailyLedgerForDate(contract, rentDate, today),
  );
  return {
    ledgers,
    summary: summarizeLedgerPreview(ledgers, today),
  };
}

/** 计算台账预览汇总。未来应收不计入当前欠款，免租日不计应收。 */
export function summarizeLedgerPreview(ledgers: readonly RentDailyLedger[], today: string): LedgerPreviewSummary {
  return ledgers.reduce<LedgerPreviewSummary>(
    (summary, ledger) => {
      summary.ledger_count += 1;
      if (ledger.is_payable) {
        summary.payable_days_count += 1;
        summary.total_due_amount += ledger.due_amount;
        if (compareBillingDate(ledger.rent_date, today) <= 0 && ledger.balance_amount > 0) {
          summary.current_debt_amount += ledger.balance_amount;
          summary.current_debt_days += 1;
        }
        if (compareBillingDate(ledger.rent_date, today) > 0) {
          summary.future_receivable_amount += ledger.balance_amount;
        }
      } else {
        summary.non_payable_days_count += 1;
      }
      return summary;
    },
    {
      total_due_amount: 0,
      current_debt_amount: 0,
      current_debt_days: 0,
      future_receivable_amount: 0,
      payable_days_count: 0,
      non_payable_days_count: 0,
      ledger_count: 0,
    },
  );
}

/**
 * generateFixedTermDailyLedgers：数据库落库版预留。
 * TODO: 后续接入 NocoBase Collection / 服务端事务，使用 unique(contract_id, rent_date) 防止重复生成。
 */
export async function generateFixedTermDailyLedgers(): Promise<never> {
  throw new Error('TODO: generateFixedTermDailyLedgers 需要接入 NocoBase Collection 和事务后实现。');
}

/**
 * ensureOpenEndedDailyLedgers：数据库落库版预留。
 * TODO: 后续接入数据库时跳过已存在日期，不得覆盖已付款、已免除、已手动调整日期。
 */
export async function ensureOpenEndedDailyLedgers(): Promise<never> {
  throw new Error('TODO: ensureOpenEndedDailyLedgers 需要接入 NocoBase Collection 和事务后实现。');
}
