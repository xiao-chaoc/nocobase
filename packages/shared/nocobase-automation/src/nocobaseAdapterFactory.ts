/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createNocobaseAdapterError } from './adapterErrors';
import { inspectNocobaseEnvironment } from './nocobaseEnvironmentInspector';
import type { NocobaseRealAdapter } from './nocobaseRealAdapter';
import { UnconfiguredNocobaseRealAdapter } from './unconfiguredRealAdapter';
import type { NocobaseAdapterEnvironment, NocobaseRealAdapterConfig } from './types';

export interface NocobaseAdapterModeDetectionResult {
  mode: 'dry_run' | 'real' | 'disabled';
  environment: NocobaseAdapterEnvironment;
  warnings: string[];
  errors: string[];
}

export const detectNocobaseAdapterMode = (
  config: NocobaseRealAdapterConfig = {},
): NocobaseAdapterModeDetectionResult => {
  const mode = config.mode ?? 'disabled';
  const environment = inspectNocobaseEnvironment({ ...config, mode });

  if (mode === 'dry_run') {
    return {
      mode: 'dry_run',
      environment,
      warnings: ['已识别 dry-run 模式：只允许返回能力说明和计划校验结果，不执行真实写入。', ...environment.warnings],
      errors: [],
    };
  }

  if (mode === 'disabled') {
    return {
      mode: 'disabled',
      environment,
      warnings: environment.warnings,
      errors: environment.errors,
    };
  }

  return {
    mode: 'real',
    environment,
    warnings: environment.warnings,
    errors: environment.errors,
  };
};

export const createNocobaseAutomationAdapter = (config: NocobaseRealAdapterConfig = {}): NocobaseRealAdapter => {
  const detection = detectNocobaseAdapterMode(config);

  if (detection.mode === 'dry_run') {
    return new UnconfiguredNocobaseRealAdapter({ ...config, mode: 'dry_run' });
  }

  if (detection.mode === 'disabled') {
    return new UnconfiguredNocobaseRealAdapter({ ...config, mode: 'disabled' });
  }

  const lacksCriticalCapabilities =
    !detection.environment.hasNocobaseApp ||
    !detection.environment.hasDatabaseConnection ||
    !detection.environment.hasPluginManager ||
    !detection.environment.hasAcl ||
    !detection.environment.hasUiSchema;

  if (lacksCriticalCapabilities) {
    return new UnconfiguredNocobaseRealAdapter({ ...config, mode: 'real' });
  }

  return new UnconfiguredNocobaseRealAdapter({ ...config, mode: 'real' });
};

export const assertRealAdapterReady = (adapter: NocobaseRealAdapter): void => {
  const environment = adapter.inspectEnvironment();
  const capabilities = adapter.getCapabilities();
  const requiredCapabilities = capabilities.filter((capability) => capability.requiresRealNocobase);
  const unsupportedCapabilities = requiredCapabilities.filter((capability) => !capability.supported);

  if (environment.mode !== 'real') {
    throw createNocobaseAdapterError('nocobase_real_mode_not_available', [`当前模式：${environment.mode}`]);
  }

  if (environment.status !== 'ready' || environment.errors.length > 0 || unsupportedCapabilities.length > 0) {
    throw createNocobaseAdapterError('nocobase_adapter_not_configured', [
      `当前状态：${environment.status}`,
      `缺失或不支持能力：${unsupportedCapabilities.map((capability) => capability.name).join('、') || '未知'}`,
      ...environment.errors,
    ]);
  }
};
