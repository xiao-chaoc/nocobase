/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID, IopgpsAction, IopgpsErrorLog, IopgpsSyncResult } from '../types/iopgpsTypes';
import { throwIopgpsError } from './errors';

export const iopgpsActions: IopgpsAction[] = [
  'get_access_token',
  'sync_device_status',
  'sync_location',
  'sync_daily_mileage',
  'backfill_mileage',
  'normalize_status',
];
const sensitiveFields = new Set([
  'login_key',
  'login_key_encrypted',
  'access_token',
  'token',
  'appid',
  'password',
  'secret',
  'authorization',
]);

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}
function buildErrorNo(action: IopgpsAction, occurredAt: string): string {
  return `IOPGPS-ERR-${action}-${occurredAt.replace(/[-:.TZ]/g, '')}`;
}

export function maskIopgpsSensitiveValue<T = unknown>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => maskIopgpsSensitiveValue(item)) as T;
  if (value && typeof value === 'object') {
    const masked: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      masked[key] = sensitiveFields.has(key.toLowerCase()) ? '[已隐藏]' : maskIopgpsSensitiveValue(nestedValue);
    }
    return masked as T;
  }
  return value;
}

export interface BuildIopgpsErrorLogInput {
  action: IopgpsAction;
  vehicle_id?: ID;
  device_id?: ID;
  imei?: string;
  error_code?: string;
  error_message: string;
  raw_response?: unknown;
  occurred_at?: string;
  handled?: boolean;
  remark?: string;
}

export function buildIopgpsErrorLog(input: BuildIopgpsErrorLogInput): IopgpsErrorLog {
  if (!iopgpsActions.includes(input.action)) throwIopgpsError('iopgps_action_invalid');
  if (isBlank(input.error_message)) throwIopgpsError('iopgps_error_message_required');
  const occurredAt = input.occurred_at ?? new Date().toISOString();
  return {
    error_id: buildErrorNo(input.action, occurredAt),
    error_no: buildErrorNo(input.action, occurredAt),
    action: input.action,
    vehicle_id: input.vehicle_id,
    device_id: input.device_id,
    imei: input.imei,
    error_code: input.error_code,
    error_message: input.error_message,
    raw_response: maskIopgpsSensitiveValue(input.raw_response),
    occurred_at: occurredAt,
    handled: input.handled ?? false,
    remark: input.remark,
  };
}

/** 包装同步任务，保证 IOPGPS 失败只返回 failed 和错误日志，不向租金业务抛异常。 */
export async function safeIopgpsSyncWrapper<T>(
  action: IopgpsAction,
  handler: () => Promise<T> | T,
): Promise<IopgpsSyncResult> {
  try {
    const data = await handler();
    return { success: true, status: 'success', data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      status: 'failed',
      failedCount: 1,
      message,
      error_log: buildIopgpsErrorLog({
        action,
        error_message: message,
        raw_response: error,
        remark: 'IOPGPS 失败不得影响租金台账或付款逻辑。',
      }),
    };
  }
}

export async function recordIopgpsError(input: {
  action: IopgpsAction;
  message: string;
  raw?: unknown;
}): Promise<IopgpsErrorLog> {
  return buildIopgpsErrorLog({ action: input.action, error_message: input.message, raw_response: input.raw });
}
