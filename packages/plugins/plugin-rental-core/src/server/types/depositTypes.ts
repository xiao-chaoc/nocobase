/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID } from './commonTypes';
import type { OperationLog } from './operationLogTypes';

export type DepositStatus =
  | 'pending'
  | 'collected'
  | 'held'
  | 'deducted'
  | 'partially_deducted'
  | 'refund_pending'
  | 'partially_refunded'
  | 'refunded'
  | 'waived'
  | 'cancelled';

export type DepositMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'card' | 'other';
export type DepositDeductTargetType = 'rent_debt' | 'damage' | 'violation' | 'repair' | 'other';

export interface DepositRecord {
  deposit_id: ID;
  deposit_no: string;
  contract_id: ID;
  driver_id: ID;
  vehicle_id: ID;
  /** 押金应收金额为敏感财务字段，不能默认向普通运营角色暴露，也不能计入租金收入。 */
  required_amount: number;
  /** 押金实收金额为敏感财务字段，不能混入 rent_payments 或租金 total_paid_amount。 */
  received_amount: number;
  /** 押金扣减金额为敏感财务字段，抵扣欠款时也不能伪造成普通租金付款。 */
  deducted_amount: number;
  /** 押金退还金额为敏感财务字段。 */
  refunded_amount: number;
  /** 押金免除金额为敏感财务字段，仅表示押金义务免除，不表示租金免除。 */
  waived_amount: number;
  /** 当前可用押金 = received_amount - deducted_amount - refunded_amount。 */
  available_amount: number;
  /** 押金付款方式为敏感字段。 */
  method?: DepositMethod;
  /** 押金付款截图仅保存文件引用，不处理真实上传，不能提交真实截图。 */
  screenshot_file?: unknown;
  received_at?: string;
  status: DepositStatus;
  remark?: string;
}

export interface CreateDepositRecordInput {
  contract_id: ID;
  driver_id: ID;
  vehicle_id: ID;
  required_amount: number;
  received_amount: number;
  method?: DepositMethod;
  /** 仅文件引用，本轮不处理真实上传。 */
  screenshot_file?: unknown;
  received_at?: string;
  received_by: ID;
  remark?: string;
}

export interface DeductDepositInput {
  deposit_id: ID;
  amount: number;
  reason: string;
  deducted_by: ID;
  deducted_at: string;
  target_type: DepositDeductTargetType;
  target_id?: ID;
}

export interface RefundDepositInput {
  deposit_id: ID;
  amount: number;
  method?: DepositMethod;
  /** 退款凭据仅为文件引用，本轮不处理真实上传。 */
  proof_file?: unknown;
  refunded_by: ID;
  refunded_at: string;
  reason: string;
}

export interface WaiveDepositInput {
  deposit_id: ID;
  amount: number;
  reason: string;
  approved_by: ID;
  approved_at: string;
}

export interface DepositOperationResult {
  deposit: DepositRecord;
  /** 纯函数预生成的操作日志对象；后续接入 NocoBase 时应在同一服务端事务中写入 operation_logs。 */
  operation_log: OperationLog;
}

/** 兼容早期骨架的驼峰输入，后续新实现请优先使用 CreateDepositRecordInput。 */
export interface DepositRecordInput {
  contractId: ID;
  driverId: ID;
  vehicleId: ID;
  requiredAmount: number;
  receivedAmount?: number;
  method?: DepositMethod | string;
  receivedAt?: string;
  screenshotFile?: unknown;
  remark?: string;
}
