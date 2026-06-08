/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { IopgpsSettings, IopgpsSyncResult, IopgpsTokenState } from '../types/iopgpsTypes';
import { throwIopgpsError } from './errors';

function toTime(value?: string): number {
  return value ? Date.parse(value) : Number.NaN;
}

function assertSettings(settings: IopgpsSettings): void {
  if (!settings || !settings.base_url) {
    throwIopgpsError('iopgps_settings_invalid');
  }
}

/** 判断当前 access_token 是否过期；空 token 或空过期时间均视为过期。 */
export function isTokenExpired(settings: IopgpsSettings, now: string | Date = new Date()): boolean {
  assertSettings(settings);
  if (!settings.access_token || !settings.token_expires_at) return true;
  const nowMs = typeof now === 'string' ? Date.parse(now) : now.getTime();
  const expiresMs = toTime(settings.token_expires_at);
  if (!Number.isFinite(nowMs) || !Number.isFinite(expiresMs)) return true;
  return nowMs >= expiresMs;
}

/** 判断是否需要提前刷新 token；本函数不发送任何真实请求。 */
export function shouldRefreshToken(
  settings: IopgpsSettings,
  now: string | Date = new Date(),
  refreshBeforeMinutes = 10,
): boolean {
  if (isTokenExpired(settings, now)) return true;
  const nowMs = typeof now === 'string' ? Date.parse(now) : now.getTime();
  const expiresMs = toTime(settings.token_expires_at);
  return expiresMs - nowMs <= refreshBeforeMinutes * 60 * 1000;
}

/** 构建 token 状态；不暴露 login_key_encrypted，不向日志打印真实 token。 */
export function buildTokenState(settings: IopgpsSettings, now: string | Date = new Date()): IopgpsTokenState {
  const isExpired = isTokenExpired(settings, now);
  return {
    access_token: settings.access_token,
    token_expires_at: settings.token_expires_at,
    is_expired: isExpired,
    should_refresh: shouldRefreshToken(settings, now),
  };
}

/**
 * 预留真实 token 获取入口。
 * 本轮不实现 HTTP 请求；后续应从 iopgps_settings 或环境变量读取配置，失败时写错误日志，且不得影响租金台账和付款逻辑。
 */
export async function getIopgpsAccessToken(settings: IopgpsSettings): Promise<IopgpsSyncResult> {
  assertSettings(settings);
  return {
    success: false,
    status: 'skipped',
    message: 'TODO: 本轮不调用真实 IOPGPS token 接口；后续接入 HTTP 客户端并写入错误日志。',
  };
}
