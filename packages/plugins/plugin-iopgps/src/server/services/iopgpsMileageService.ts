/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { GpsDailyMileage, ID, IopgpsRawDeviceStatus, IopgpsSyncResult } from '../types/iopgpsTypes';
import { throwIopgpsError } from './errors';

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function buildMileageSyncKey(deviceId: ID, mileageDate: string): string {
  return `${String(deviceId)}:${mileageDate}`;
}

/** 构建 GPS 每日里程对象；后续保存需依赖 unique(device_id, mileage_date) 幂等约束。 */
export function buildGpsDailyMileage(
  rawMileage: IopgpsRawDeviceStatus & {
    mileage_date?: string;
    start_time?: string;
    end_time?: string;
    mileage_km?: number | string;
    runtime_seconds?: number | string;
    error_message?: string;
  },
  context: { vehicle_id?: ID; device_id: ID; contract_id?: ID; driver_id?: ID },
): GpsDailyMileage {
  if (!rawMileage?.imei) throwIopgpsError('iopgps_imei_required');
  if (!rawMileage.mileage_date) throwIopgpsError('iopgps_mileage_date_required');
  const mileageKm = toNumber(rawMileage.mileage_km);
  const runtimeSeconds = toNumber(rawMileage.runtime_seconds);
  if (mileageKm < 0 || runtimeSeconds < 0) throwIopgpsError('iopgps_mileage_invalid');
  return {
    vehicle_id: context.vehicle_id,
    device_id: context.device_id,
    imei: rawMileage.imei,
    mileage_date: rawMileage.mileage_date,
    start_time: rawMileage.start_time,
    end_time: rawMileage.end_time,
    mileage_km: mileageKm,
    runtime_seconds: runtimeSeconds,
    contract_id: context.contract_id,
    driver_id: context.driver_id,
    raw_response: rawMileage.raw ?? rawMileage,
    sync_status: rawMileage.error_message ? 'failed' : 'success',
    error_message: rawMileage.error_message,
  };
}

export async function syncIopgpsDailyMileage(): Promise<IopgpsSyncResult> {
  return {
    success: false,
    status: 'skipped',
    message:
      'TODO: 后续调用真实每日里程接口并按 device_id + mileage_date 幂等保存；GPS 里程只用于运营核查，不参与租金计算。',
  };
}
