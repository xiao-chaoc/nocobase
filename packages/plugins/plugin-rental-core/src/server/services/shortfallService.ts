/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RentDailyLedger } from '../types/ledgerTypes';
import { throwBusinessError } from './errors';
import { refreshLedgerPaymentStatus } from './ledgerStatusService';

function assertPayableWithBalance(ledger: RentDailyLedger): void {
  if (!ledger.is_payable) {
    throwBusinessError('payment_ledger_not_payable');
  }
  if (ledger.balance_amount <= 0) {
    throwBusinessError('shortfall_disposition_required');
  }
}

/**
 * 将未付或部分付款的剩余金额标记为欠款。
 * TODO: 后续接入 operation_logs，记录 reason。
 */
export function markShortfallAsDebt(ledger: RentDailyLedger, reason: string, today: string): RentDailyLedger {
  void reason;
  assertPayableWithBalance(ledger);
  return refreshLedgerPaymentStatus(
    {
      ...ledger,
      shortfall_disposition: 'debt',
      unpaid_reason: ledger.unpaid_reason === 'none' ? 'waiting_for_payment' : ledger.unpaid_reason,
    },
    today,
  );
}

/**
 * 将未付或部分付款的剩余金额标记为争议。
 * TODO: 后续接入 operation_logs，记录 reason。
 */
export function markShortfallAsDispute(ledger: RentDailyLedger, reason: string, today: string): RentDailyLedger {
  void reason;
  assertPayableWithBalance(ledger);
  return refreshLedgerPaymentStatus(
    {
      ...ledger,
      shortfall_disposition: 'dispute',
      unpaid_reason: 'dispute',
    },
    today,
  );
}

/**
 * 将未付或部分付款的剩余金额标记为待免除审批。
 * TODO: 后续接入 operation_logs，记录 reason。
 */
export function markShortfallAsPendingWaiver(ledger: RentDailyLedger, reason: string, today: string): RentDailyLedger {
  void reason;
  assertPayableWithBalance(ledger);
  return refreshLedgerPaymentStatus(
    {
      ...ledger,
      shortfall_disposition: 'pending_waiver_approval',
      unpaid_reason: 'pending_waiver_approval',
    },
    today,
  );
}

/** markShortfallDisposition：兼容旧服务名的分派入口。 */
export function markShortfallDisposition(
  ledger: RentDailyLedger,
  disposition: 'debt' | 'pending_waiver_approval' | 'dispute',
  reason: string,
  today: string,
): RentDailyLedger {
  if (disposition === 'debt') return markShortfallAsDebt(ledger, reason, today);
  if (disposition === 'pending_waiver_approval') return markShortfallAsPendingWaiver(ledger, reason, today);
  if (disposition === 'dispute') return markShortfallAsDispute(ledger, reason, today);
  throwBusinessError('shortfall_disposition_required');
}
