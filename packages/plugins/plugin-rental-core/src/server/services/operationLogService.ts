/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID } from '../types/commonTypes';
import type { OperationAction, OperationLog, RecordOperationLogInput } from '../types/operationLogTypes';
import { throwBusinessError } from './errors';

export const operationActions: OperationAction[] = [
  'driver_created',
  'vehicle_created',
  'contract_created',
  'contract_activated',
  'contract_terminated',
  'ledger_generated',
  'ledger_manual_adjusted',
  'free_day_adjusted',
  'payable_day_adjusted',
  'payment_created',
  'payment_confirmed',
  'payment_reversed',
  'unpaid_reason_changed',
  'shortfall_marked_debt',
  'shortfall_marked_dispute',
  'waiver_requested',
  'waiver_approved',
  'waiver_rejected',
  'deposit_created',
  'deposit_collected',
  'deposit_deducted',
  'deposit_refunded',
  'deposit_waived',
  'gps_sync_failed',
  'contract_document_generated',
  'contract_document_scanned',
  'permission_sensitive_data_filtered',
];

const actionsRequiringReason: OperationAction[] = [
  'ledger_manual_adjusted',
  'free_day_adjusted',
  'payable_day_adjusted',
  'payment_reversed',
  'unpaid_reason_changed',
  'shortfall_marked_debt',
  'shortfall_marked_dispute',
  'waiver_approved',
  'waiver_rejected',
  'deposit_deducted',
  'deposit_refunded',
  'deposit_waived',
];

const sensitiveLogFields = new Set([
  'id_no',
  'id_front_file',
  'id_back_file',
  'license_front_file',
  'license_back_file',
  'screenshot_file',
  'proof_file',
  'signed_scan_file',
  'login_key_encrypted',
  'access_token',
  'payment_method',
  'driver_license_files',
  'driver_id_files',
]);

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function buildTemporaryBusinessNo(prefix: string, targetId: ID, action: OperationAction): string {
  return `${prefix}-${String(action).toUpperCase()}-${String(targetId)}-${Date.now()}`;
}

function assertOperationAction(action: OperationAction): void {
  if (!operationActions.includes(action)) {
    throwBusinessError('operation_action_invalid');
  }
}

function assertOperationInput(input: RecordOperationLogInput): void {
  assertOperationAction(input.action);
  if (isBlank(input.operator_id)) {
    throwBusinessError('operation_operator_required');
  }
  if (isBlank(input.target_collection) || isBlank(input.target_id)) {
    throwBusinessError('operation_target_required');
  }
  if (
    input.before_value === undefined &&
    input.after_value === undefined &&
    isBlank(input.reason) &&
    isBlank(input.remark)
  ) {
    throwBusinessError('operation_log_context_required');
  }
  if (actionsRequiringReason.includes(input.action) && isBlank(input.reason)) {
    throwBusinessError('operation_reason_required');
  }
}

/**
 * 写操作日志前对敏感字段脱敏。
 * 本函数递归处理对象和数组，不记录完整证件号、截图 URL、退款凭据、扫描件、密钥或 token 原文。
 */
export function maskSensitiveLogValue<T = unknown>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveLogValue(item)) as T;
  }
  if (value && typeof value === 'object') {
    const masked: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      masked[key] = sensitiveLogFields.has(key) ? '[已隐藏]' : maskSensitiveLogValue(nestedValue);
    }
    return masked as T;
  }
  return value;
}

/**
 * 记录关键业务操作日志的纯函数。
 * 本轮只返回日志对象，不写数据库；后续接入 NocoBase 时必须在服务端写入 operation_logs Collection。
 */
export function recordOperationLog(input: RecordOperationLogInput): OperationLog {
  assertOperationInput(input);
  return {
    log_id: buildTemporaryBusinessNo('LOGID', input.target_id, input.action),
    log_no: buildTemporaryBusinessNo('LOG', input.target_id, input.action),
    operator_id: input.operator_id,
    action: input.action,
    target_collection: input.target_collection,
    target_id: input.target_id,
    before_value: input.before_value === undefined ? undefined : maskSensitiveLogValue(input.before_value),
    after_value: input.after_value === undefined ? undefined : maskSensitiveLogValue(input.after_value),
    reason: input.reason,
    ip_address: input.ip_address,
    user_agent: input.user_agent,
    created_at: new Date().toISOString(),
    remark: input.remark,
  };
}

/** 根据修改前后数据快速生成已脱敏操作日志对象。 */
export function buildOperationLogForChange(params: RecordOperationLogInput): OperationLog {
  return recordOperationLog(params);
}
