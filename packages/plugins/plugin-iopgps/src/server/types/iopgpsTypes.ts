/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type ID = string | number;

export interface IopgpsSettings {
  base_url: string;
  appid?: string;
  /** 敏感字段：真实 login key 不得写入仓库或日志。 */
  login_key_encrypted?: string;
  /** 敏感字段：真实 access token 不得写入仓库或日志。 */
  access_token?: string;
  token_expires_at?: string;
  sync_enabled: boolean;
  location_sync_interval_minutes: number;
  mileage_sync_interval_hours: number;
  offline_threshold_minutes: number;
  status: 'active' | 'disabled' | 'error';
}

export interface IopgpsTokenState {
  access_token?: string;
  token_expires_at?: string;
  is_expired: boolean;
  should_refresh: boolean;
}

export type GpsDeviceStatus =
  | 'normal'
  | 'moving'
  | 'static'
  | 'offline'
  | 'fault'
  | 'low_power'
  | 'power_cut'
  | 'unknown';
export type IopgpsNormalizedStatus = GpsDeviceStatus;
export type VehicleGpsStatus = 'normal' | 'offline' | 'fault' | 'no_device' | 'api_error' | 'unknown';
export type IopgpsSyncStatus = 'success' | 'failed' | 'partial' | 'skipped';
export type IopgpsAction =
  | 'get_access_token'
  | 'sync_device_status'
  | 'sync_location'
  | 'sync_daily_mileage'
  | 'backfill_mileage'
  | 'normalize_status';

export interface IopgpsRawDeviceStatus {
  imei?: string;
  status?: string | number;
  status_text?: string;
  speed?: number | string;
  lat?: number | string;
  lng?: number | string;
  address?: string;
  gps_time?: string;
  acc_status?: string | boolean;
  power_status?: string;
  battery_level?: number | string;
  raw?: unknown;
  [key: string]: unknown;
}

export interface NormalizedGpsStatusResult {
  imei?: string;
  normalized_status: GpsDeviceStatus;
  vehicle_gps_status: VehicleGpsStatus;
  lat?: number;
  lng?: number;
  address?: string;
  speed?: number;
  gps_time?: string;
  reason: string;
  raw_response?: unknown;
}

export interface GpsLocationSnapshot {
  vehicle_id?: ID;
  device_id?: ID;
  imei: string;
  lat: number;
  lng: number;
  address?: string;
  speed?: number;
  acc_status?: string | boolean;
  position_type?: string;
  gps_time?: string;
  raw_response?: unknown;
  created_at: string;
}

export interface GpsDailyMileage {
  vehicle_id?: ID;
  device_id: ID;
  imei: string;
  mileage_date: string;
  start_time?: string;
  end_time?: string;
  mileage_km: number;
  runtime_seconds: number;
  contract_id?: ID;
  driver_id?: ID;
  raw_response?: unknown;
  sync_status: IopgpsSyncStatus;
  error_message?: string;
}

export interface IopgpsErrorLog {
  error_id: ID;
  error_no: string;
  action: IopgpsAction;
  vehicle_id?: ID;
  device_id?: ID;
  imei?: string;
  error_code?: string;
  error_message: string;
  raw_response?: unknown;
  occurred_at: string;
  handled: boolean;
  remark?: string;
}

export interface IopgpsSyncResult {
  success: boolean;
  status?: IopgpsSyncStatus;
  syncedCount?: number;
  failedCount?: number;
  message?: string;
  error_log?: IopgpsErrorLog;
  data?: unknown;
}

export interface IopgpsDeviceRef {
  deviceId: ID;
  imei: string;
  vehicleId?: ID;
}

export interface GpsDeviceStatusLogDraft {
  device_id?: ID;
  vehicle_id?: ID;
  imei?: string;
  provider_status?: string | number;
  normalized_status: GpsDeviceStatus;
  lat?: number;
  lng?: number;
  gps_time?: string;
  raw_response?: unknown;
  created_at: string;
}

export interface VehicleGpsStatusPatch {
  gps_status: VehicleGpsStatus;
  last_gps_lat?: number;
  last_gps_lng?: number;
  last_gps_address?: string;
  last_gps_time?: string;
}
