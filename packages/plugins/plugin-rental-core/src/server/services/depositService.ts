/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CreateDepositRecordInput,
  DeductDepositInput,
  DepositMethod,
  DepositOperationResult,
  DepositRecord,
  RefundDepositInput,
  WaiveDepositInput,
} from '../types/depositTypes';
import { throwBusinessError } from './errors';
import { recordOperationLog } from './operationLogService';

function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function buildTemporaryDepositNo(input: CreateDepositRecordInput): string {
  return `DEP-TEMP-${String(input.contract_id)}-${String(input.driver_id)}-${String(input.received_by)}-${Date.now()}`;
}

function validateRequiredAmount(requiredAmount: number): void {
  if (requiredAmount < 0 || !Number.isFinite(requiredAmount)) {
    throwBusinessError('deposit_required_amount_invalid');
  }
}

function validateReceivedAmount(receivedAmount: number): void {
  if (receivedAmount < 0 || !Number.isFinite(receivedAmount)) {
    throwBusinessError('deposit_received_amount_invalid');
  }
}

function validateOperationAmount(amount: number): void {
  if (amount <= 0 || !Number.isFinite(amount)) {
    throwBusinessError('deposit_amount_invalid');
  }
}

function assertReason(reason: string): void {
  if (isBlank(reason)) {
    throwBusinessError('deposit_reason_required');
  }
}

function normalizeDeposit(deposit: DepositRecord): DepositRecord {
  const waivedAmount = deposit.waived_amount ?? 0;
  const availableAmount = deposit.available_amount ?? getDepositAvailableAmount(deposit);
  return {
    ...deposit,
    deducted_amount: deposit.deducted_amount ?? 0,
    refunded_amount: deposit.refunded_amount ?? 0,
    waived_amount: waivedAmount,
    available_amount: availableAmount,
  };
}

/**
 * 计算当前可用押金。
 * 结果只用于押金管理，不计入每日租金收入，也不混入租金 total_paid_amount。
 */
export function getDepositAvailableAmount(deposit: DepositRecord): number {
  const availableAmount = roundMoney(deposit.received_amount - deposit.deducted_amount - deposit.refunded_amount);
  if (availableAmount < 0) {
    throwBusinessError('deposit_available_amount_invalid');
  }
  return availableAmount;
}

/** 根据金额刷新押金状态；waived/cancelled 是终态，本轮不自动覆盖。 */
export function refreshDepositStatus(deposit: DepositRecord): DepositRecord {
  const next = normalizeDeposit(deposit);

  if (next.status === 'waived' || next.status === 'cancelled') {
    return next;
  }
  if (next.deducted_amount > next.received_amount) {
    throwBusinessError('deposit_available_amount_invalid');
  }
  if (next.refunded_amount > next.received_amount - next.deducted_amount) {
    throwBusinessError('deposit_available_amount_invalid');
  }

  next.available_amount = getDepositAvailableAmount(next);

  if (next.received_amount === 0) {
    next.status = 'pending';
  } else if (next.refunded_amount > 0 && next.available_amount === 0) {
    next.status = 'refunded';
  } else if (next.refunded_amount > 0 && next.available_amount > 0) {
    next.status = 'partially_refunded';
  } else if (next.deducted_amount > 0 && next.available_amount === 0) {
    next.status = 'deducted';
  } else if (next.deducted_amount > 0 && next.available_amount > 0) {
    next.status = 'partially_deducted';
  } else if (next.received_amount > 0) {
    next.status = 'held';
  }

  return next;
}

/**
 * 创建押金记录的纯函数。
 * 押金截图只保存引用；押金不会生成 rent_payments，也不会计入租金 total_paid_amount。
 */
export function createDepositRecord(input: CreateDepositRecordInput): DepositOperationResult {
  validateRequiredAmount(input.required_amount);
  validateReceivedAmount(input.received_amount);
  if (input.received_amount > input.required_amount) {
    throwBusinessError('deposit_received_exceeds_required');
  }

  const deposit: DepositRecord = refreshDepositStatus({
    deposit_id: buildTemporaryDepositNo(input),
    deposit_no: buildTemporaryDepositNo(input),
    contract_id: input.contract_id,
    driver_id: input.driver_id,
    vehicle_id: input.vehicle_id,
    required_amount: input.required_amount,
    received_amount: input.received_amount,
    deducted_amount: 0,
    refunded_amount: 0,
    waived_amount: 0,
    available_amount: input.received_amount,
    method: input.method,
    screenshot_file: input.screenshot_file,
    received_at: input.received_at,
    status: input.received_amount > 0 && input.received_amount < input.required_amount ? 'collected' : 'pending',
    remark: input.remark,
  });
  // 业务约定：部分收取先标记为 collected，表示已发生收取；可用押金仍等于 received_amount。
  if (input.received_amount > 0 && input.received_amount < input.required_amount) {
    deposit.status = 'collected';
  }

  const operationLog = recordOperationLog({
    operator_id: input.received_by,
    action: input.received_amount > 0 ? 'deposit_collected' : 'deposit_created',
    target_collection: 'deposit_records',
    target_id: deposit.deposit_id,
    after_value: deposit,
    reason: input.remark || '创建押金记录',
    remark: 'TODO: 后续接入 NocoBase 时需与 deposit_records 写入放在同一服务端事务。',
  });

  return { deposit, operation_log: operationLog };
}

/** 从押金中抵扣欠款、损伤、违章、维修或其他费用；不直接修改租金台账。 */
export function deductDeposit(deposit: DepositRecord, input: DeductDepositInput): DepositOperationResult {
  const before = refreshDepositStatus(deposit);
  validateOperationAmount(input.amount);
  assertReason(input.reason);
  if (input.amount > before.available_amount) {
    throwBusinessError('deposit_deduct_amount_exceeds_available');
  }

  const after = refreshDepositStatus({
    ...before,
    deducted_amount: roundMoney(before.deducted_amount + input.amount),
    remark: before.remark,
  });

  const operationLog = recordOperationLog({
    operator_id: input.deducted_by,
    action: 'deposit_deducted',
    target_collection: 'deposit_records',
    target_id: input.deposit_id,
    before_value: before,
    after_value: after,
    reason: input.reason,
    remark: `抵扣目标：${input.target_type}${
      input.target_id ? `/${String(input.target_id)}` : ''
    }。TODO: 若用于租金欠款，后续应通过专门业务流程处理，不能伪造成普通租金付款。`,
  });

  return { deposit: after, operation_log: operationLog };
}

/** 退还押金的纯函数；退款凭据 proof_file 仅为敏感文件引用。 */
export function refundDeposit(deposit: DepositRecord, input: RefundDepositInput): DepositOperationResult {
  const before = refreshDepositStatus(deposit);
  validateOperationAmount(input.amount);
  assertReason(input.reason);
  if (input.amount > before.available_amount) {
    throwBusinessError('deposit_refund_amount_exceeds_available');
  }

  const after = refreshDepositStatus({
    ...before,
    refunded_amount: roundMoney(before.refunded_amount + input.amount),
    method: input.method ?? before.method,
  });

  const operationLog = recordOperationLog({
    operator_id: input.refunded_by,
    action: 'deposit_refunded',
    target_collection: 'deposit_records',
    target_id: input.deposit_id,
    before_value: before,
    after_value: { ...after, proof_file: input.proof_file, refunded_at: input.refunded_at },
    reason: input.reason,
    remark: '退款凭据为敏感字段，日志中应脱敏；本轮不处理真实文件上传。',
  });

  return { deposit: after, operation_log: operationLog };
}

/**
 * 免除押金义务的纯函数。
 * 本轮选择记录 waived_amount，不把押金免除计入租金免除；若 waived_amount 覆盖全部 required_amount 且未收款，则状态置为 waived。
 */
export function waiveDeposit(deposit: DepositRecord, input: WaiveDepositInput): DepositOperationResult {
  const before = refreshDepositStatus(deposit);
  validateOperationAmount(input.amount);
  assertReason(input.reason);
  if (isBlank(input.approved_by)) {
    throwBusinessError('deposit_approved_by_required');
  }
  if (input.amount > before.required_amount - before.waived_amount) {
    throwBusinessError('deposit_amount_invalid');
  }

  let after: DepositRecord = {
    ...before,
    waived_amount: roundMoney(before.waived_amount + input.amount),
  };
  if (after.received_amount === 0 && after.waived_amount >= after.required_amount) {
    after = { ...after, available_amount: 0, status: 'waived' };
  } else {
    after = refreshDepositStatus(after);
  }

  const operationLog = recordOperationLog({
    operator_id: input.approved_by,
    action: 'deposit_waived',
    target_collection: 'deposit_records',
    target_id: input.deposit_id,
    before_value: before,
    after_value: { ...after, approved_at: input.approved_at },
    reason: input.reason,
    remark: 'TODO: 后续接入真实权限系统时，仅经理或管理员可审批押金免除。',
  });

  return { deposit: after, operation_log: operationLog };
}
