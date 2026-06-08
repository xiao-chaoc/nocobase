/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type IopgpsErrorCode =
  | 'iopgps_settings_invalid'
  | 'iopgps_token_missing'
  | 'iopgps_token_expired'
  | 'iopgps_imei_required'
  | 'iopgps_location_invalid'
  | 'iopgps_mileage_date_required'
  | 'iopgps_mileage_invalid'
  | 'iopgps_action_invalid'
  | 'iopgps_error_message_required';

export const iopgpsErrorMessages: Record<IopgpsErrorCode, string> = {
  iopgps_settings_invalid: 'IOPGPS 配置无效。',
  iopgps_token_missing: 'IOPGPS access_token 缺失。',
  iopgps_token_expired: 'IOPGPS access_token 已过期。',
  iopgps_imei_required: 'IOPGPS 设备 IMEI 必填。',
  iopgps_location_invalid: 'IOPGPS 定位数据无效。',
  iopgps_mileage_date_required: 'IOPGPS 每日里程日期必填。',
  iopgps_mileage_invalid: 'IOPGPS 每日里程或运行时长无效。',
  iopgps_action_invalid: 'IOPGPS 操作动作无效。',
  iopgps_error_message_required: 'IOPGPS 错误日志必须包含错误信息。',
};

export class IopgpsBusinessError extends Error {
  code: IopgpsErrorCode;
  constructor(code: IopgpsErrorCode, message = iopgpsErrorMessages[code]) {
    super(message);
    this.name = 'IopgpsBusinessError';
    this.code = code;
  }
}

export function throwIopgpsError(code: IopgpsErrorCode): never {
  throw new IopgpsBusinessError(code);
}
