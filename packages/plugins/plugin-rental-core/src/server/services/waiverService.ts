/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID } from '../types/commonTypes';
import type { RentDailyLedger } from '../types/ledgerTypes';
import { throwBusinessError } from './errors';
import { refreshLedgerPaymentStatus } from './ledgerStatusService';

export type RentWaiverRequestStatus = 'pending' | 'approved' | 'rejected';

export interface RentWaiverRequest {
  adjustment_id: ID;
  ledger_id: ID;
  contract_id: ID;
  driver_id: ID;
  vehicle_id: ID;
  adjustment_type: 'waive';
  amount: number;
  reason: string;
  requested_by: ID;
  status: RentWaiverRequestStatus;
  approved_by?: ID;
  approved_at?: string;
  rejected_by?: ID;
  rejected_reason?: string;
}

export interface RentWaiverResult {
  ledger: RentDailyLedger;
  waiverRequest: RentWaiverRequest;
}

function assertWaivableLedger(ledger: RentDailyLedger): void {
  if (!ledger.is_payable) {
    throwBusinessError('payment_ledger_not_payable');
  }
}

/**
 * 申请免除某个应收日期的全部或部分欠款。
 * 本轮只返回纯对象，不写数据库；TODO: 后续只有授权角色可申请并写入 operation_logs。
 */
export function requestRentWaiver(
  ledger: RentDailyLedger,
  amount: number,
  reason: string,
  requestedBy: ID,
): RentWaiverResult {
  assertWaivableLedger(ledger);
  if (!reason) {
    throwBusinessError('shortfall_disposition_required');
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throwBusinessError('waiver_amount_invalid');
  }
  if (amount > ledger.balance_amount) {
    throwBusinessError('waiver_amount_exceeds_balance');
  }

  return {
    ledger: {
      ...ledger,
      shortfall_disposition: 'pending_waiver_approval',
      unpaid_reason: 'pending_waiver_approval',
    },
    waiverRequest: {
      adjustment_id: `waiver:${ledger.ledger_id}:${amount}:${requestedBy}`,
      ledger_id: ledger.ledger_id,
      contract_id: ledger.contract_id,
      driver_id: ledger.driver_id,
      vehicle_id: ledger.vehicle_id,
      adjustment_type: 'waive',
      amount,
      reason,
      requested_by: requestedBy,
      status: 'pending',
    },
  };
}

/**
 * 审批通过免除申请。
 * TODO: 后续接入权限系统后，仅经理或系统管理员可审批。
 */
export function approveRentWaiver(
  ledger: RentDailyLedger,
  waiverRequest: RentWaiverRequest,
  approvedBy: ID,
  today: string,
): RentWaiverResult {
  if (waiverRequest.status !== 'pending') {
    throwBusinessError('waiver_request_invalid_status');
  }
  if (waiverRequest.amount > ledger.balance_amount) {
    throwBusinessError('waiver_amount_exceeds_balance');
  }

  let nextLedger: RentDailyLedger = {
    ...ledger,
    waived_amount: ledger.waived_amount + waiverRequest.amount,
  };
  const nextBalance = nextLedger.due_amount - nextLedger.paid_amount - nextLedger.waived_amount;
  if (nextBalance === 0) {
    nextLedger.shortfall_disposition = 'waived';
    // 选择将 unpaid_reason 设为 none：审批通过且余额结清后，该日期不再属于未付日期。
    nextLedger.unpaid_reason = 'none';
  }
  nextLedger = refreshLedgerPaymentStatus(nextLedger, today);

  return {
    ledger: nextLedger,
    waiverRequest: {
      ...waiverRequest,
      status: 'approved',
      approved_by: approvedBy,
      approved_at: today,
    },
  };
}

/** 拒绝免除申请，保留原台账欠款或争议状态。 */
export function rejectRentWaiver(
  ledger: RentDailyLedger,
  waiverRequest: RentWaiverRequest,
  rejectedBy: ID,
  reason: string,
): RentWaiverResult {
  if (waiverRequest.status !== 'pending') {
    throwBusinessError('waiver_request_invalid_status');
  }
  if (!reason) {
    throwBusinessError('shortfall_disposition_required');
  }
  return {
    ledger,
    waiverRequest: {
      ...waiverRequest,
      status: 'rejected',
      rejected_by: rejectedBy,
      rejected_reason: reason,
    },
  };
}
