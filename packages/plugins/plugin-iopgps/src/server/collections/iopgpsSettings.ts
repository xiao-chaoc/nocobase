/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：iopgps_settings（IOPGPS 配置表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const iopgpsSettingsCollectionDraft = {
  name: 'iopgps_settings',
  title: 'IOPGPS 配置表',
  fields: [
    'settings_id',
    'base_url',
    'appid',
    'login_key_encrypted',
    'access_token',
    'token_expires_at',
    'sync_enabled',
    'location_sync_interval_minutes',
    'mileage_sync_interval_hours',
    'offline_threshold_minutes',
    'status',
    'remark',
  ],
  indexes: ['status', 'sync_enabled'],
  uniqueConstraints: [['settings_id']],
  sensitiveFields: ['login_key_encrypted', 'access_token'],
  relations: [],
  notes: [
    'login_key_encrypted、access_token 为敏感字段，真实值不能写死或提交。',
    '排障字段不得保存未脱敏密钥。',
    'IOPGPS 配置和同步失败不能影响租金台账和付款逻辑，GPS 数据不参与租金计算。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
