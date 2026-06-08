/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  GpsDeviceStatus,
  IopgpsRawDeviceStatus,
  NormalizedGpsStatusResult,
  VehicleGpsStatus,
} from '../types/iopgpsTypes';

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function textOf(rawStatus: IopgpsRawDeviceStatus): string {
  return [rawStatus.status, rawStatus.status_text, rawStatus.power_status, rawStatus.acc_status, rawStatus.raw]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');
}

export function mapNormalizedStatusToVehicleGpsStatus(normalizedStatus: GpsDeviceStatus): VehicleGpsStatus {
  if (normalizedStatus === 'moving' || normalizedStatus === 'static' || normalizedStatus === 'normal') return 'normal';
  if (normalizedStatus === 'offline') return 'offline';
  if (normalizedStatus === 'fault' || normalizedStatus === 'low_power' || normalizedStatus === 'power_cut')
    return 'fault';
  return 'unknown';
}

/** 将 IOPGPS 原始状态归一化为内部状态；仅用于运营监控，不参与租金计算。 */
export function normalizeIopgpsStatus(
  rawStatus?: IopgpsRawDeviceStatus | null,
  options: { offlineThresholdMinutes?: number; now?: string | Date } = {},
): NormalizedGpsStatusResult {
  if (!rawStatus) {
    return {
      normalized_status: 'unknown',
      vehicle_gps_status: 'api_error',
      reason: '原始状态为空',
      raw_response: rawStatus,
    };
  }
  const imei = rawStatus.imei;
  if (!imei) {
    return {
      normalized_status: 'unknown',
      vehicle_gps_status: 'api_error',
      reason: '缺少 IMEI',
      raw_response: rawStatus,
    };
  }

  const nowMs = options.now
    ? typeof options.now === 'string'
      ? Date.parse(options.now)
      : options.now.getTime()
    : Date.now();
  const gpsMs = rawStatus.gps_time ? Date.parse(rawStatus.gps_time) : Number.NaN;
  const offlineThresholdMinutes = options.offlineThresholdMinutes ?? 30;
  const base = {
    imei,
    lat: toNumber(rawStatus.lat),
    lng: toNumber(rawStatus.lng),
    address: rawStatus.address,
    speed: toNumber(rawStatus.speed),
    gps_time: rawStatus.gps_time,
    raw_response: rawStatus.raw ?? rawStatus,
  };

  let normalized: GpsDeviceStatus = 'unknown';
  let reason = '无法判断状态';
  const text = textOf(rawStatus);
  if (Number.isFinite(nowMs) && Number.isFinite(gpsMs) && nowMs - gpsMs > offlineThresholdMinutes * 60 * 1000) {
    normalized = 'offline';
    reason = 'GPS 时间超过离线阈值';
  } else if (/断电|power_cut|power cut|cut|拆除|poweroff/.test(text)) {
    normalized = 'power_cut';
    reason = '原始状态包含断电或拆除含义';
  } else if (/低电|low_power|low battery|low_battery/.test(text)) {
    normalized = 'low_power';
    reason = '原始状态包含低电含义';
  } else if (/fault|error|故障/.test(text)) {
    normalized = 'fault';
    reason = '原始状态包含故障含义';
  } else if ((base.speed ?? 0) > 0) {
    normalized = 'moving';
    reason = '速度大于 0';
  } else if ((base.speed ?? 0) === 0 && /online|正常|static|stop|停车|静止|acc/.test(text)) {
    normalized = 'static';
    reason = '设备在线且速度为 0';
  }

  return {
    ...base,
    normalized_status: normalized,
    vehicle_gps_status: mapNormalizedStatusToVehicleGpsStatus(normalized),
    reason,
  };
}
