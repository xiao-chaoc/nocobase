/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  GpsLocationSnapshot,
  IopgpsRawDeviceStatus,
  IopgpsSyncResult,
  VehicleGpsStatusPatch,
} from '../types/iopgpsTypes';
import { throwIopgpsError } from './errors';

function toNumber(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

/** 构建 GPS 定位快照；lat/lng 缺失时抛出明确业务错误，调用方可转换为错误日志。 */
export function buildGpsLocationSnapshot(
  rawLocation: IopgpsRawDeviceStatus,
  context: {
    vehicle_id?: string | number;
    device_id?: string | number;
    now?: string | Date;
    position_type?: string;
  } = {},
): GpsLocationSnapshot {
  if (!rawLocation?.imei) throwIopgpsError('iopgps_imei_required');
  const lat = toNumber(rawLocation.lat);
  const lng = toNumber(rawLocation.lng);
  if (lat === undefined || lng === undefined) throwIopgpsError('iopgps_location_invalid');
  return {
    vehicle_id: context.vehicle_id,
    device_id: context.device_id,
    imei: rawLocation.imei,
    lat,
    lng,
    address: rawLocation.address,
    speed: toNumber(rawLocation.speed),
    acc_status: rawLocation.acc_status,
    position_type: context.position_type ?? 'gps',
    gps_time: rawLocation.gps_time,
    raw_response: rawLocation.raw ?? rawLocation,
    created_at: (context.now ? new Date(context.now) : new Date()).toISOString(),
  };
}

export function buildVehicleLocationPatch(
  snapshot: GpsLocationSnapshot,
): Pick<VehicleGpsStatusPatch, 'last_gps_lat' | 'last_gps_lng' | 'last_gps_address' | 'last_gps_time'> {
  return {
    last_gps_lat: snapshot.lat,
    last_gps_lng: snapshot.lng,
    last_gps_address: snapshot.address,
    last_gps_time: snapshot.gps_time,
  };
}

export async function syncIopgpsLocation(): Promise<IopgpsSyncResult> {
  return {
    success: false,
    status: 'skipped',
    message:
      'TODO: 后续调用真实定位接口、保存 gps_location_snapshots 并更新车辆最近位置；失败写错误日志且不影响租金台账和付款逻辑。',
  };
}
