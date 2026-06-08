/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID } from './commonTypes';
import type { RentDailyLedger } from './ledgerTypes';

export type RentPaymentStatus = 'draft' | 'confirmed' | 'reversed' | 'cancelled';
export type RentPaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'card' | 'other';
export type RentPaymentAllocationStatus = 'active' | 'reversed' | 'cancelled';
export type PaymentAllocationStatus = RentPaymentAllocationStatus;

export interface RentPaymentAllocationInput {
  ledger_id: ID;
  allocated_amount: number;
}

export interface PaymentAllocationInput {
  ledgerId?: ID;
  ledger_id?: ID;
  allocatedAmount?: number;
  allocated_amount?: number;
}

export interface CreateRentPaymentInput {
  driver_id: ID;
  contract_id: ID;
  vehicle_id: ID;
  payment_date: string;
  paid_at: string;
  amount: number;
  method?: RentPaymentMethod;
  /** 付款截图仅保存引用，本轮不处理真实上传。 */
  screenshot_file?: unknown;
  received_by: ID;
  allocations: RentPaymentAllocationInput[];
  remark?: string;
}

export interface RentPaymentInput {
  driverId?: ID;
  contractId?: ID;
  vehicleId?: ID;
  driver_id?: ID;
  contract_id?: ID;
  vehicle_id?: ID;
  payment_date?: string;
  paidAt?: string;
  paid_at?: string;
  amount: number;
  method?: RentPaymentMethod | string;
  screenshotFile?: unknown;
  screenshot_file?: unknown;
  received_by?: ID;
  allocations: PaymentAllocationInput[];
  confirmNow?: boolean;
  remark?: string;
}

export interface RentPayment {
  payment_id: ID;
  payment_no: string;
  driver_id: ID;
  contract_id: ID;
  vehicle_id: ID;
  payment_date: string;
  paid_at: string;
  amount: number;
  method?: RentPaymentMethod | string;
  /** 付款截图仅为文件引用，不在纯函数中处理真实上传。 */
  screenshot_file?: unknown;
  received_by: ID;
  status: RentPaymentStatus;
  remark?: string;
}

export interface RentPaymentAllocation {
  allocation_id: ID;
  payment_id: ID;
  ledger_id: ID;
  contract_id: ID;
  driver_id: ID;
  rent_date: string;
  allocated_amount: number;
  status: RentPaymentAllocationStatus;
  reversed_at?: string;
  reversed_reason?: string;
}

export interface PaymentAllocationResult {
  payment: RentPayment;
  allocations: RentPaymentAllocation[];
  ledgers: RentDailyLedger[];
}

export interface ReverseRentPaymentInput {
  payment_id: ID;
  reason: string;
  reversed_by: ID;
  reversed_at: string;
}
