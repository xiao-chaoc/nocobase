/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  NocobaseActionPlan,
  NocobaseAdapterCapability,
  NocobaseAdapterEnvironment,
  NocobaseAdapterOperationResult,
  NocobaseCollectionAdapter,
  NocobaseI18nPlan,
  NocobasePageAdapter,
  NocobasePermissionPlan,
  NocobaseRuntimeAdapter,
  NocobaseSchedulePlan,
  NocobaseSeedDataAdapter,
  NocobaseServicePlan,
  SeedDataImportInput,
  SeedDataImportResult,
  SmokeTestDryRunResult,
  SmokeTestPlan,
} from './types';

/**
 * 真实 NocoBase adapter 接口。
 *
 * 本接口只定义真实接入的边界，当前仓库不实现真实连接、不写数据库、不安装插件。
 * 真实实现必须放在完整 NocoBase 工程内完成，并基于目标 NocoBase 版本已经确认的官方插件 API、
 * 数据库接口、ACL、UI Schema、Scheduler、Workflow、文件存储和日志能力实现。
 *
 * 不允许在当前仓库硬写不确定的 NocoBase API 调用，也不允许通过伪造成功结果绕过 readiness gate。
 */
export interface NocobaseRealAdapter
  extends NocobaseCollectionAdapter,
    NocobaseRuntimeAdapter,
    NocobasePageAdapter,
    NocobaseSeedDataAdapter {
  connect(): NocobaseAdapterOperationResult;
  disconnect(): NocobaseAdapterOperationResult;
  inspectEnvironment(): NocobaseAdapterEnvironment;
  getCapabilities(): NocobaseAdapterCapability[];
  importSeedData(input: SeedDataImportInput): SeedDataImportResult;
  runSmokeTests(smokeTests: SmokeTestPlan[]): SmokeTestDryRunResult | NocobaseAdapterOperationResult;
  backup(operation: string): NocobaseAdapterOperationResult;
  rollback(operation: string): NocobaseAdapterOperationResult;

  /**
   * 以下方法来自已有 adapter 计划接口，真实实现必须在完整 NocoBase 工程内替换 dry-run/mock 行为。
   */
  registerServices(services: NocobaseServicePlan[]): ReturnType<NocobaseRuntimeAdapter['registerServices']>;
  registerPermissions(permissions: NocobasePermissionPlan[]): ReturnType<NocobaseRuntimeAdapter['registerPermissions']>;
  registerI18n(i18n: NocobaseI18nPlan[]): ReturnType<NocobaseRuntimeAdapter['registerI18n']>;
  registerSchedules(schedules: NocobaseSchedulePlan[]): ReturnType<NocobaseRuntimeAdapter['registerSchedules']>;
  registerActions(actions: NocobaseActionPlan[]): ReturnType<NocobaseRuntimeAdapter['registerActions']>;
}
