/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RentDailyLedger, UnpaidReason } from '../types/ledgerTypes';
import { throwBusinessError } from './errors';

const allowedUnpaidReasons = new Set<UnpaidReason>([
  'none',
  'waiting_for_payment',
  'driver_promised_to_pay',
  'dispute',
  'internal_review',
  'pending_waiver_approval',
  'other',
]);

/** 校验未付原因枚举。 */
export function validateUnpaidReason(unpaidReason: string): asserts unpaidReason is UnpaidReason {
  if (!allowedUnpaidReasons.has(unpaidReason as UnpaidReason)) {
    throwBusinessError('unpaid_reason_invalid');
  }
}

/**
 * 给未付或未结清日期标记未付原因。
 * TODO: 后续接入真实权限系统，仅授权财务、经理或运营角色可修改，并写入 operation_logs。
 */
export function markUnpaidReason(
  ledger: RentDailyLedger,
  unpaidReason: UnpaidReason,
  remark?: string,
): RentDailyLedger {
  validateUnpaidReason(unpaidReason);
  if (!ledger.is_payable) {
    return { ...ledger, unpaid_reason: 'none', remark: remark ?? ledger.remark };
  }
  if (ledger.balance_amount > 0 && unpaidReason === 'none') {
    throwBusinessError('unpaid_reason_required');
  }

  const next: RentDailyLedger = {
    ...ledger,
    unpaid_reason: unpaidReason,
    remark: remark ?? ledger.remark,
  };
  if (unpaidReason === 'dispute') {
    next.shortfall_disposition = 'dispute';
  }
  if (unpaidReason === 'pending_waiver_approval') {
    next.shortfall_disposition = 'pending_waiver_approval';
  }
  return next;
}
