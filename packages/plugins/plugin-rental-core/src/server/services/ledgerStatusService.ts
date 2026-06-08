/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RentDailyLedger } from '../types/ledgerTypes';
import { compareBillingDate } from './dateBillingUtils';
import { throwBusinessError } from './errors';

/**
 * 根据应收、已付、免除、余额、日期和差额处理方式刷新单日台账状态。
 * 本函数只返回刷新后的对象，不做合同汇总落库，不做权限过滤。
 */
export function refreshLedgerPaymentStatus(ledger: RentDailyLedger, today: string): RentDailyLedger {
  const next: RentDailyLedger = { ...ledger };

  if (next.status === 'cancelled') {
    next.payment_status = 'cancelled';
    next.calendar_status = 'cancelled';
    return next;
  }

  if (!next.is_payable) {
    return {
      ...next,
      due_amount: 0,
      paid_amount: 0,
      waived_amount: 0,
      balance_amount: 0,
      payment_status: 'non_payable',
      calendar_status: 'non_payable',
      shortfall_disposition: 'none',
    };
  }

  const balanceAmount = next.due_amount - next.paid_amount - next.waived_amount;
  if (balanceAmount < 0) {
    if (next.waived_amount > next.due_amount) {
      throwBusinessError('ledger_over_waived');
    }
    throwBusinessError('ledger_overpaid');
  }
  next.balance_amount = balanceAmount;

  if (next.shortfall_disposition === 'dispute') {
    next.calendar_status = 'dispute';
    return next;
  }

  if (next.paid_amount > 0 && next.waived_amount > 0 && next.balance_amount === 0) {
    next.payment_status = 'paid';
    next.calendar_status = 'partial_waived';
    return next;
  }

  if (next.due_amount > 0 && next.paid_amount >= next.due_amount && next.balance_amount === 0) {
    next.payment_status = 'paid';
    next.calendar_status = 'paid';
    return next;
  }

  if (next.waived_amount >= next.due_amount && next.balance_amount === 0) {
    next.payment_status = 'waived';
    next.calendar_status = 'waived';
    return next;
  }

  if (next.paid_amount > 0 && next.balance_amount > 0 && next.shortfall_disposition === 'debt') {
    next.payment_status = 'partial';
    next.calendar_status = 'partial_debt';
    return next;
  }

  if (next.paid_amount === 0 && next.balance_amount > 0 && compareBillingDate(next.rent_date, today) > 0) {
    next.payment_status = 'unpaid';
    next.calendar_status = 'future_receivable';
    return next;
  }

  if (next.paid_amount === 0 && next.balance_amount > 0 && compareBillingDate(next.rent_date, today) <= 0) {
    next.payment_status = 'unpaid';
    next.calendar_status = 'unpaid_debt';
    return next;
  }

  return next;
}
