/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocobaseAdapterEnvironment, NocobaseRealAdapterConfig } from './types';

const hasValue = (value: unknown): boolean => value !== undefined && value !== null;

export const inspectNocobaseEnvironment = (config: NocobaseRealAdapterConfig = {}): NocobaseAdapterEnvironment => {
  const mode = config.mode ?? 'disabled';
  const environment: NocobaseAdapterEnvironment = {
    mode,
    status: 'unavailable',
    hasNocobaseApp: hasValue(config.app),
    hasDatabaseConnection: hasValue(config.db),
    hasLogger: hasValue(config.logger),
    hasFileStorage: hasValue(config.storage),
    hasPluginManager: hasValue(config.pluginManager),
    hasAcl: hasValue(config.acl),
    hasUiSchema: hasValue(config.uiSchema),
    hasScheduler: hasValue(config.scheduler),
    hasWorkflow: hasValue(config.workflow),
    warnings: [],
    errors: [],
  };

  if (mode === 'dry_run') {
    environment.status = 'configured';
    environment.warnings.push('当前为 dry-run 模式，只能验证计划与能力边界，不允许执行真实 NocoBase 写入。');
  }

  if (mode === 'disabled') {
    environment.errors.push('adapter 当前处于 disabled 模式，没有真实 NocoBase app，不能执行真实注册。');
  }

  if (!environment.hasNocobaseApp) {
    environment.errors.push('缺少真实 NocoBase app 实例。');
  }
  if (!environment.hasDatabaseConnection) {
    environment.errors.push('缺少真实 NocoBase 数据库连接或数据库上下文。');
  }
  if (!environment.hasLogger) {
    environment.warnings.push('缺少 logger，上线前需要接入真实日志与审计追踪。');
  }
  if (!environment.hasFileStorage) {
    environment.warnings.push('缺少 file storage，付款截图和合同文件上传能力不能验证。');
  }
  if (!environment.hasPluginManager) {
    environment.errors.push('缺少 pluginManager，不能执行真实插件能力注册。');
  }
  if (!environment.hasAcl) {
    environment.errors.push('缺少 ACL，不能执行真实权限和敏感字段控制注册。');
  }
  if (!environment.hasUiSchema) {
    environment.errors.push('缺少 UI Schema，不能执行真实页面、菜单和区块初始化。');
  }
  if (!environment.hasScheduler) {
    environment.warnings.push('缺少 scheduler，定时任务注册只能停留在计划层。');
  }
  if (!environment.hasWorkflow) {
    environment.warnings.push('缺少 workflow，审批、免除、争议等流程只能停留在计划层。');
  }

  if (environment.errors.length > 0) {
    environment.status = 'unavailable';
    return environment;
  }

  environment.status = mode === 'real' ? 'configured' : environment.status;
  return environment;
};

export const summarizeNocobaseEnvironment = (environment: NocobaseAdapterEnvironment): string => {
  const missingCapabilities = [
    !environment.hasNocobaseApp ? 'app' : undefined,
    !environment.hasDatabaseConnection ? 'db' : undefined,
    !environment.hasFileStorage ? 'file storage' : undefined,
    !environment.hasPluginManager ? 'pluginManager' : undefined,
    !environment.hasAcl ? 'ACL' : undefined,
    !environment.hasUiSchema ? 'UI Schema' : undefined,
    !environment.hasScheduler ? 'scheduler' : undefined,
    !environment.hasWorkflow ? 'workflow' : undefined,
  ].filter((value): value is string => Boolean(value));

  const executableCapabilities = [
    environment.hasNocobaseApp && environment.hasDatabaseConnection ? '可进行真实连接前置检查' : undefined,
    environment.hasNocobaseApp && environment.hasDatabaseConnection && environment.hasPluginManager
      ? '可准备插件注册上下文检查'
      : undefined,
    environment.hasAcl ? '可准备权限注册检查' : undefined,
    environment.hasUiSchema ? '可准备页面初始化检查' : undefined,
  ].filter((value): value is string => Boolean(value));

  const canRegisterCollections =
    environment.mode === 'real' &&
    environment.hasNocobaseApp &&
    environment.hasDatabaseConnection &&
    environment.hasPluginManager;
  const canRegisterPermissions = canRegisterCollections && environment.hasAcl;
  const canRegisterPages = canRegisterCollections && environment.hasUiSchema;
  const canImportSeedData = canRegisterCollections && environment.hasFileStorage;

  return [
    `当前模式：${environment.mode}`,
    `当前状态：${environment.status}`,
    `缺失能力：${missingCapabilities.length > 0 ? missingCapabilities.join('、') : '无'}`,
    `可执行能力：${executableCapabilities.length > 0 ? executableCapabilities.join('、') : '无真实执行能力'}`,
    `是否可以真实注册 Collections：${canRegisterCollections ? '可以，但仍需目标 NocoBase 工程验证' : '不可以'}`,
    `是否可以真实注册权限：${canRegisterPermissions ? '可以，但仍需目标 NocoBase 工程验证' : '不可以'}`,
    `是否可以真实创建页面：${canRegisterPages ? '可以，但仍需目标 NocoBase 工程验证' : '不可以'}`,
    `是否可以真实导入数据：${canImportSeedData ? '可以，但只能使用隔离测试数据' : '不可以'}`,
    `下一步需要接入：${
      missingCapabilities.length > 0 ? missingCapabilities.join('、') : '目标版本官方 API 验证、备份回滚和隔离测试环境'
    }`,
    `警告：${environment.warnings.length > 0 ? environment.warnings.join('；') : '无'}`,
    `错误：${environment.errors.length > 0 ? environment.errors.join('；') : '无'}`,
  ].join('\n');
};
