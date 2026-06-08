/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：operation_logs（操作日志表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const operationLogsCollectionDraft = {
  name: 'operation_logs',
  title: '操作日志表',
  fields: [
    'log_id',
    'log_no',
    'operator_id',
    'action',
    'target_collection',
    'target_id',
    'before_value',
    'after_value',
    'reason',
    'ip_address',
    'user_agent',
    'created_at',
    'remark',
  ],
  indexes: ['operator_id', 'action', 'target_collection', 'target_id', 'created_at'],
  uniqueConstraints: [['log_no']],
  sensitiveFields: ['before_value', 'after_value', 'ip_address', 'user_agent'],
  relations: [],
  notes: [
    'before_value 和 after_value 写入前必须脱敏，不记录完整证件号、付款截图 URL、密钥或 token。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
