/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RentDailyLedger } from '../types/ledgerTypes';
import type { PaymentAllocationResult, RentPayment, RentPaymentAllocation } from '../types/paymentTypes';
import { throwBusinessError } from './errors';
import { refreshLedgerPaymentStatus } from './ledgerStatusService';

function findLedger(ledgers: readonly RentDailyLedger[], ledgerId: unknown): RentDailyLedger | undefined {
  return ledgers.find((ledger) => String(ledger.ledger_id) === String(ledgerId));
}

/**
 * 冲正已确认付款。
 * 本轮使用纯函数或内存对象实现；TODO: 后续接入数据库事务，付款、分配、台账扣回必须整体提交或整体回滚。
 */
export function reverseRentPayment(
  payment: RentPayment,
  ledgers: readonly RentDailyLedger[],
  allocations: readonly RentPaymentAllocation[],
  reason: string,
  today: string,
): PaymentAllocationResult {
  if (payment.status !== 'confirmed') {
    throwBusinessError('payment_reversal_invalid_status');
  }
  if (!reason) {
    throwBusinessError('payment_reversal_reason_required');
  }

  const updatedLedgers = ledgers.map((ledger) => ({ ...ledger }));
  const reversedAllocations: RentPaymentAllocation[] = allocations.map((allocation) => ({
    ...allocation,
    status: 'reversed',
    reversed_at: today,
    reversed_reason: reason,
  }));

  for (const allocation of allocations) {
    if (allocation.status !== 'active') continue;
    const ledger = findLedger(updatedLedgers, allocation.ledger_id);
    if (!ledger) {
      throwBusinessError('payment_ledger_not_found');
    }
    const nextPaidAmount = ledger.paid_amount - allocation.allocated_amount;
    if (nextPaidAmount < 0) {
      throwBusinessError('payment_reversal_paid_amount_negative');
    }
    ledger.paid_amount = nextPaidAmount;
    Object.assign(ledger, refreshLedgerPaymentStatus(ledger, today));
  }

  return {
    payment: { ...payment, status: 'reversed' },
    allocations: reversedAllocations,
    ledgers: updatedLedgers,
  };
}
