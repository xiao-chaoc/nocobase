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
import type {
  CreateRentPaymentInput,
  PaymentAllocationInput,
  PaymentAllocationResult,
  RentPayment,
  RentPaymentAllocation,
  RentPaymentAllocationInput,
  RentPaymentInput,
} from '../types/paymentTypes';
import { throwBusinessError } from './errors';
import { refreshLedgerPaymentStatus } from './ledgerStatusService';

function normalizeAllocation(input: PaymentAllocationInput | RentPaymentAllocationInput): RentPaymentAllocationInput {
  const ledger_id = 'ledger_id' in input ? input.ledger_id : input.ledgerId;
  const allocated_amount = 'allocated_amount' in input ? input.allocated_amount : input.allocatedAmount;
  if (ledger_id === undefined || ledger_id === null) {
    throwBusinessError('payment_ledger_not_found');
  }
  if (typeof allocated_amount !== 'number' || !Number.isFinite(allocated_amount) || allocated_amount <= 0) {
    throwBusinessError('payment_allocation_amount_invalid');
  }
  return { ledger_id, allocated_amount };
}

function normalizePaymentInput(input: CreateRentPaymentInput | RentPaymentInput): CreateRentPaymentInput {
  const source = input as CreateRentPaymentInput & RentPaymentInput;
  const driver_id = source.driver_id ?? source.driverId;
  const contract_id = source.contract_id ?? source.contractId;
  const vehicle_id = source.vehicle_id ?? source.vehicleId;
  const paid_at = source.paid_at ?? source.paidAt;
  const payment_date = source.payment_date ?? paid_at;
  const screenshot_file = source.screenshot_file ?? source.screenshotFile;
  const received_by = source.received_by ?? 'unknown_internal_user';

  if (driver_id === undefined || contract_id === undefined || vehicle_id === undefined || !payment_date || !paid_at) {
    throwBusinessError('payment_allocations_required');
  }

  return {
    driver_id,
    contract_id,
    vehicle_id,
    payment_date,
    paid_at,
    amount: input.amount,
    method: input.method as CreateRentPaymentInput['method'],
    screenshot_file,
    received_by,
    allocations: input.allocations.map(normalizeAllocation),
    remark: input.remark,
  };
}

function sumAllocations(allocations: readonly RentPaymentAllocationInput[]): number {
  return allocations.reduce((sum, item) => sum + item.allocated_amount, 0);
}

function findLedger(ledgers: readonly RentDailyLedger[], ledgerId: ID): RentDailyLedger | undefined {
  return ledgers.find((ledger) => String(ledger.ledger_id) === String(ledgerId));
}

/**
 * 创建付款草稿对象。
 * 本轮只返回纯对象，不写数据库；付款截图仅保存引用字段，不处理真实上传。
 */
export function createRentPaymentDraft(input: CreateRentPaymentInput | RentPaymentInput): RentPayment {
  const normalized = normalizePaymentInput(input);
  if (typeof normalized.amount !== 'number' || !Number.isFinite(normalized.amount) || normalized.amount <= 0) {
    throwBusinessError('payment_amount_invalid');
  }
  if (!normalized.allocations.length) {
    throwBusinessError('payment_allocations_required');
  }

  return {
    payment_id: `draft:${normalized.contract_id}:${normalized.paid_at}:${normalized.amount}`,
    payment_no: `DRAFT-${normalized.contract_id}-${normalized.payment_date}-${normalized.amount}`,
    driver_id: normalized.driver_id,
    contract_id: normalized.contract_id,
    vehicle_id: normalized.vehicle_id,
    payment_date: normalized.payment_date,
    paid_at: normalized.paid_at,
    amount: normalized.amount,
    method: normalized.method,
    screenshot_file: normalized.screenshot_file,
    received_by: normalized.received_by,
    status: 'draft',
    remark: normalized.remark,
  };
}

/** 校验单个日期是否超付。 */
export function validateNoOverpayment(
  ledger: RentDailyLedger,
  allocationAmount: number,
): { remaining_collectable_amount: number } {
  if (typeof allocationAmount !== 'number' || !Number.isFinite(allocationAmount) || allocationAmount <= 0) {
    throwBusinessError('payment_allocation_amount_invalid');
  }
  const remainingCollectableAmount = ledger.due_amount - ledger.paid_amount - ledger.waived_amount;
  if (remainingCollectableAmount <= 0 || allocationAmount > remainingCollectableAmount) {
    throwBusinessError('ledger_overpaid');
  }
  return { remaining_collectable_amount: remainingCollectableAmount };
}

/**
 * 校验付款分配是否合法。
 * 不修改 ledger，不允许部分成功；任意日期超付时拒绝整笔付款。
 */
export function validatePaymentAllocations(
  payment: RentPayment,
  ledgers: readonly RentDailyLedger[],
  allocations: readonly (PaymentAllocationInput | RentPaymentAllocationInput)[],
): void {
  if (!allocations.length) {
    throwBusinessError('payment_allocations_required');
  }
  if (!ledgers.length) {
    throwBusinessError('payment_ledger_not_found');
  }

  const normalizedAllocations = allocations.map(normalizeAllocation);
  if (sumAllocations(normalizedAllocations) !== payment.amount) {
    throwBusinessError('payment_allocation_amount_mismatch');
  }

  const amountByLedgerId = new Map<string, number>();
  for (const allocation of normalizedAllocations) {
    amountByLedgerId.set(
      String(allocation.ledger_id),
      (amountByLedgerId.get(String(allocation.ledger_id)) ?? 0) + allocation.allocated_amount,
    );
  }

  for (const [ledgerId, amount] of amountByLedgerId.entries()) {
    const ledger = findLedger(ledgers, ledgerId);
    if (!ledger) {
      throwBusinessError('payment_ledger_not_found');
    }
    if (String(payment.contract_id) !== String(ledger.contract_id)) {
      throwBusinessError('payment_contract_mismatch');
    }
    if (String(payment.driver_id) !== String(ledger.driver_id)) {
      throwBusinessError('payment_driver_mismatch');
    }
    if (String(payment.vehicle_id) !== String(ledger.vehicle_id)) {
      throwBusinessError('payment_vehicle_mismatch');
    }
    if (ledger.status === 'cancelled' || ledger.payment_status === 'cancelled') {
      throwBusinessError('payment_ledger_cancelled');
    }
    if (!ledger.is_payable) {
      throwBusinessError('payment_ledger_not_payable');
    }
    validateNoOverpayment(ledger, amount);
  }
}

/**
 * 确认付款并更新内存中的台账对象。
 * TODO: 后续接入数据库时，付款确认、分配创建和台账更新必须放在同一事务中。
 */
export function confirmRentPayment(
  payment: RentPayment,
  ledgers: readonly RentDailyLedger[],
  allocations: readonly (PaymentAllocationInput | RentPaymentAllocationInput)[],
  today: string,
): PaymentAllocationResult {
  validatePaymentAllocations(payment, ledgers, allocations);
  const normalizedAllocations = allocations.map(normalizeAllocation);
  const updatedLedgers = ledgers.map((ledger) => ({ ...ledger }));
  const allocationResults: RentPaymentAllocation[] = [];

  for (const allocation of normalizedAllocations) {
    const ledger = findLedger(updatedLedgers, allocation.ledger_id);
    if (!ledger) {
      throwBusinessError('payment_ledger_not_found');
    }
    ledger.paid_amount += allocation.allocated_amount;
    const refreshedLedger = refreshLedgerPaymentStatus(ledger, today);
    Object.assign(ledger, refreshedLedger);
    allocationResults.push({
      allocation_id: `${payment.payment_id}:${ledger.ledger_id}`,
      payment_id: payment.payment_id,
      ledger_id: ledger.ledger_id,
      contract_id: ledger.contract_id,
      driver_id: ledger.driver_id,
      rent_date: ledger.rent_date,
      allocated_amount: allocation.allocated_amount,
      status: 'active',
    });
  }

  return {
    payment: { ...payment, status: 'confirmed' },
    allocations: allocationResults,
    ledgers: updatedLedgers,
  };
}

/** 付款分配总入口。失败时抛出明确业务错误，不允许部分成功。 */
export function allocateRentPayment(
  payment: RentPayment,
  ledgers: readonly RentDailyLedger[],
  allocations: readonly (PaymentAllocationInput | RentPaymentAllocationInput)[],
  today: string,
): PaymentAllocationResult {
  validatePaymentAllocations(payment, ledgers, allocations);
  return confirmRentPayment(payment, ledgers, allocations, today);
}

/** createRentPayment：兼容旧服务名的纯函数入口。 */
export function createRentPayment(input: CreateRentPaymentInput | RentPaymentInput): RentPayment {
  return createRentPaymentDraft(input);
}
