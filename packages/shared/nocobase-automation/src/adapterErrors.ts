/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type NocobaseAdapterErrorCode =
  | 'nocobase_adapter_not_configured'
  | 'nocobase_real_mode_not_available'
  | 'nocobase_app_missing'
  | 'nocobase_db_missing'
  | 'nocobase_acl_missing'
  | 'nocobase_ui_schema_missing'
  | 'nocobase_plugin_manager_missing'
  | 'nocobase_scheduler_missing'
  | 'nocobase_workflow_missing'
  | 'nocobase_real_api_not_implemented'
  | 'nocobase_operation_not_allowed_in_dry_run'
  | 'nocobase_operation_failed';

export interface NocobaseAdapterErrorDefinition {
  code: NocobaseAdapterErrorCode;
  message: string;
}

export const nocobaseAdapterErrorDefinitions: Record<NocobaseAdapterErrorCode, NocobaseAdapterErrorDefinition> = {
  nocobase_adapter_not_configured: {
    code: 'nocobase_adapter_not_configured',
    message: '真实 NocoBase adapter 尚未配置，当前没有可用的真实 NocoBase app，不能执行真实注册。',
  },
  nocobase_real_mode_not_available: {
    code: 'nocobase_real_mode_not_available',
    message: '真实模式当前不可用，需要接入完整 NocoBase 工程后再启用。',
  },
  nocobase_app_missing: {
    code: 'nocobase_app_missing',
    message: '缺少真实 NocoBase app 实例。',
  },
  nocobase_db_missing: {
    code: 'nocobase_db_missing',
    message: '缺少真实 NocoBase 数据库连接或数据库上下文。',
  },
  nocobase_acl_missing: {
    code: 'nocobase_acl_missing',
    message: '缺少真实 NocoBase ACL 权限能力。',
  },
  nocobase_ui_schema_missing: {
    code: 'nocobase_ui_schema_missing',
    message: '缺少真实 NocoBase UI Schema 或页面配置能力。',
  },
  nocobase_plugin_manager_missing: {
    code: 'nocobase_plugin_manager_missing',
    message: '缺少真实 NocoBase 插件管理器能力。',
  },
  nocobase_scheduler_missing: {
    code: 'nocobase_scheduler_missing',
    message: '缺少真实 NocoBase 定时任务能力。',
  },
  nocobase_workflow_missing: {
    code: 'nocobase_workflow_missing',
    message: '缺少真实 NocoBase 工作流能力。',
  },
  nocobase_real_api_not_implemented: {
    code: 'nocobase_real_api_not_implemented',
    message: '真实 NocoBase API 尚未实现，不能伪造或硬写不确定调用。',
  },
  nocobase_operation_not_allowed_in_dry_run: {
    code: 'nocobase_operation_not_allowed_in_dry_run',
    message: '当前处于 dry-run 模式，不允许执行真实 NocoBase 写入操作。',
  },
  nocobase_operation_failed: {
    code: 'nocobase_operation_failed',
    message: 'NocoBase adapter 操作失败，请查看受控错误和步骤日志。',
  },
};

export class NocobaseAdapterError extends Error {
  readonly code: NocobaseAdapterErrorCode;

  readonly details: string[];

  constructor(code: NocobaseAdapterErrorCode, details: string[] = []) {
    const definition = nocobaseAdapterErrorDefinitions[code];
    super([definition.message, ...details].join(' '));
    this.name = 'NocobaseAdapterError';
    this.code = code;
    this.details = details;
  }
}

export const createNocobaseAdapterError = (
  code: NocobaseAdapterErrorCode,
  details: string[] = [],
): NocobaseAdapterError => new NocobaseAdapterError(code, details);
