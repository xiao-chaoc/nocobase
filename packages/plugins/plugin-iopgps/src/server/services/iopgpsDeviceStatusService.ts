/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  GpsDeviceStatusLogDraft,
  IopgpsRawDeviceStatus,
  IopgpsSyncResult,
  NormalizedGpsStatusResult,
  VehicleGpsStatusPatch,
} from '../types/iopgpsTypes';

export function buildGpsDeviceStatusLog(
  rawStatus: IopgpsRawDeviceStatus,
  normalizedResult: NormalizedGpsStatusResult,
  context: { device_id?: string | number; vehicle_id?: string | number; now?: string | Date } = {},
): GpsDeviceStatusLogDraft {
  return {
    device_id: context.device_id,
    vehicle_id: context.vehicle_id,
    imei: normalizedResult.imei ?? rawStatus.imei,
    provider_status: rawStatus.status ?? rawStatus.status_text,
    normalized_status: normalizedResult.normalized_status,
    lat: normalizedResult.lat,
    lng: normalizedResult.lng,
    gps_time: normalizedResult.gps_time,
    raw_response: rawStatus.raw ?? rawStatus,
    created_at: (context.now ? new Date(context.now) : new Date()).toISOString(),
  };
}

/** 构建 vehicles 表 GPS 状态 patch；只返回字段，不写数据库，不影响租金台账。 */
export function buildVehicleGpsStatusPatch(normalizedResult: NormalizedGpsStatusResult): VehicleGpsStatusPatch {
  return {
    gps_status: normalizedResult.vehicle_gps_status,
    last_gps_lat: normalizedResult.lat,
    last_gps_lng: normalizedResult.lng,
    last_gps_address: normalizedResult.address,
    last_gps_time: normalizedResult.gps_time,
  };
}

export async function syncIopgpsDeviceStatus(): Promise<IopgpsSyncResult> {
  return {
    success: false,
    status: 'skipped',
    message:
      'TODO: 后续获取 token、调用设备状态接口、归一化状态、写入状态日志并更新车辆 gps_status；失败只写错误日志，不影响租金台账和付款逻辑。',
  };
}
