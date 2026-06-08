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
import type {
  ActionRegistrationResult,
  CollectionRegistrationBatchResult,
  CollectionRegistrationResult,
  I18nRegistrationResult,
  NocobaseActionPlan,
  NocobaseAdapterCapability,
  NocobaseAdapterCapabilityName,
  NocobaseAdapterEnvironment,
  NocobaseAdapterMode,
  NocobaseAdapterOperationResult,
  NocobaseBlockPlan,
  NocobaseCollectionPlan,
  NocobaseFilterPlan,
  NocobaseI18nPlan,
  NocobaseMenuPlan,
  NocobasePageActionPlan,
  NocobasePagePlan,
  NocobasePermissionPlan,
  NocobaseRealAdapterConfig,
  NocobaseSchedulePlan,
  NocobaseServicePlan,
  PageItemRegistrationResult,
  PermissionRegistrationResult,
  ScheduleRegistrationResult,
  SeedDataEntityImportResult,
  SeedDataEntityPlan,
  SeedDataEntityType,
  SeedDataImportInput,
  SeedDataImportPlan,
  SeedDataImportResult,
  ServiceRegistrationResult,
  SmokeTestPlan,
  ValidationResult,
} from './types';

const capabilityNames: NocobaseAdapterCapabilityName[] = [
  'register_collections',
  'register_services',
  'register_permissions',
  'register_i18n',
  'register_schedules',
  'register_actions',
  'register_pages',
  'import_seed_data',
  'run_smoke_tests',
  'rollback',
  'backup',
  'inspect_schema',
];

const unavailableMessages = [
  '当前没有真实 NocoBase app。',
  '当前不能执行真实注册。',
  '需要接入完整 NocoBase 工程后替换未配置 adapter。',
];

export class UnconfiguredNocobaseRealAdapter implements NocobaseRealAdapter {
  readonly mode: NocobaseAdapterMode;

  readonly config: NocobaseRealAdapterConfig;

  connected = false;

  constructor(config: NocobaseRealAdapterConfig = {}) {
    this.config = config;
    this.mode = config.mode ?? 'disabled';
  }

  connect(): NocobaseAdapterOperationResult {
    return this.operationFailure('connect', ['未配置 adapter 不会连接数据库，也不会连接真实 NocoBase。']);
  }

  disconnect(): NocobaseAdapterOperationResult {
    this.connected = false;
    return this.operationFailure('disconnect', ['未配置 adapter 没有真实连接可断开。']);
  }

  inspectEnvironment(): NocobaseAdapterEnvironment {
    const inspected = inspectNocobaseEnvironment({ ...this.config, mode: this.mode });
    return {
      ...inspected,
      hasNocobaseApp: false,
      hasDatabaseConnection: false,
      hasAcl: false,
      hasUiSchema: false,
      status: 'unavailable',
      warnings: [...inspected.warnings, '当前使用未配置真实 adapter，只能返回受控失败结果。'],
      errors: Array.from(new Set([...inspected.errors, ...unavailableMessages])),
    };
  }

  getCapabilities(): NocobaseAdapterCapability[] {
    return capabilityNames.map((name) => ({
      name,
      supported: false,
      mode: this.mode,
      requiresRealNocobase: name !== 'inspect_schema',
      notes: [...unavailableMessages, `能力 ${name} 当前不可用。`],
    }));
  }

  checkCollectionExists(): boolean {
    return false;
  }

  validateCollectionPlan(): ValidationResult {
    return this.validationFailure();
  }

  registerCollection(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    return this.collectionResult(collectionPlan.name, collectionPlan.sourcePlugin, 'registerCollection');
  }

  registerCollections(collectionPlans: NocobaseCollectionPlan[]): CollectionRegistrationBatchResult {
    const results = collectionPlans.map((plan) =>
      this.collectionResult(plan.name, plan.sourcePlugin, 'registerCollections'),
    );
    const errors = results.flatMap((result) => result.errors);
    const warnings = results.flatMap((result) => result.warnings);
    return {
      success: false,
      results,
      warnings: warnings.length > 0 ? warnings : unavailableMessages,
      errors: errors.length > 0 ? errors : unavailableMessages,
      summary: {
        totalCollections: collectionPlans.length,
        successCount: 0,
        createdCount: 0,
        skippedCount: collectionPlans.length,
        errorCount: Math.max(errors.length, 1),
        warningCount: Math.max(warnings.length, unavailableMessages.length),
        criticalUniqueConstraintsPassed: false,
        sensitiveFieldsPassed: false,
        dryRunOnly: true,
      },
    };
  }

  ensureIndexes(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    return this.collectionResult(collectionPlan.name, collectionPlan.sourcePlugin, 'ensureIndexes');
  }

  ensureUniqueConstraints(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    return this.collectionResult(collectionPlan.name, collectionPlan.sourcePlugin, 'ensureUniqueConstraints');
  }

  ensureRelations(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    return this.collectionResult(collectionPlan.name, collectionPlan.sourcePlugin, 'ensureRelations');
  }

  markSensitiveFields(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    return this.collectionResult(collectionPlan.name, collectionPlan.sourcePlugin, 'markSensitiveFields');
  }

  registerServices(services: NocobaseServicePlan[]): ServiceRegistrationResult[] {
    return services.map((service) =>
      this.runtimeResult('serviceName', service.name, service.sourcePlugin, 'registerServices'),
    );
  }

  registerActions(actions: NocobaseActionPlan[]): ActionRegistrationResult[] {
    return actions.map((action) =>
      this.runtimeResult('actionName', action.name, action.sourcePlugin, 'registerActions'),
    );
  }

  registerPermissions(permissions: NocobasePermissionPlan[]): PermissionRegistrationResult[] {
    return permissions.map((permission) =>
      this.runtimeResult('role', permission.role, permission.role, 'registerPermissions'),
    );
  }

  registerSchedules(schedules: NocobaseSchedulePlan[]): ScheduleRegistrationResult[] {
    return schedules.map((schedule) =>
      this.runtimeResult('scheduleName', schedule.name, schedule.sourcePlugin, 'registerSchedules'),
    );
  }

  registerI18n(i18n: NocobaseI18nPlan[]): I18nRegistrationResult[] {
    return i18n.map((item) => this.runtimeResult('namespace', item.namespace, item.sourcePlugin, 'registerI18n'));
  }

  validateServicePlan(): ValidationResult {
    return this.validationFailure();
  }

  validateActionPlan(): ValidationResult {
    return this.validationFailure();
  }

  validatePermissionPlan(): ValidationResult {
    return this.validationFailure();
  }

  validateSchedulePlan(): ValidationResult {
    return this.validationFailure();
  }

  validateI18nPlan(): ValidationResult {
    return this.validationFailure();
  }

  registerMenus(menus: NocobaseMenuPlan[]): PageItemRegistrationResult[] {
    return menus.map((menu) => this.pageResult(menu.name, 'menu', menu.sourcePlugin, 'registerMenus'));
  }

  registerPages(pages: NocobasePagePlan[]): PageItemRegistrationResult[] {
    return pages.map((page) => this.pageResult(page.name, 'page', page.sourcePlugin, 'registerPages'));
  }

  registerBlocks(blocks: NocobaseBlockPlan[]): PageItemRegistrationResult[] {
    return blocks.map((block) => this.pageResult(block.name, 'block', block.sourcePlugin, 'registerBlocks'));
  }

  registerFilters(filters: NocobaseFilterPlan[]): PageItemRegistrationResult[] {
    return filters.map((filter) => this.pageResult(filter.name, 'filter', filter.sourcePlugin, 'registerFilters'));
  }

  registerPageActions(actions: NocobasePageActionPlan[]): PageItemRegistrationResult[] {
    return actions.map((action) =>
      this.pageResult(action.name, 'pageAction', action.sourcePlugin, 'registerPageActions'),
    );
  }

  validateMenuPlan(): ValidationResult {
    return this.validationFailure();
  }

  validatePagePlan(): ValidationResult {
    return this.validationFailure();
  }

  validateBlockPlan(): ValidationResult {
    return this.validationFailure();
  }

  validateFilterPlan(): ValidationResult {
    return this.validationFailure();
  }

  validatePageActionPlan(): ValidationResult {
    return this.validationFailure();
  }

  loadSeedData(input: SeedDataImportInput): Record<SeedDataEntityType, unknown[]> {
    const result = {} as Record<SeedDataEntityType, unknown[]>;
    input.importPlan.entities.forEach((entity) => {
      result[entity.entityType] = [];
    });
    return result;
  }

  validateSeedData(): ValidationResult {
    return this.validationFailure();
  }

  importEntity(entityPlan: SeedDataEntityPlan): SeedDataEntityImportResult {
    return {
      entityType: entityPlan.entityType,
      sourceFile: entityPlan.sourceFile,
      targetCollection: entityPlan.targetCollection,
      totalRecords: 0,
      validRecords: 0,
      skippedRecords: 0,
      failedRecords: 0,
      warnings: unavailableMessages,
      errors: unavailableMessages,
      steps: ['未配置真实 adapter 不读取文件、不写数据库、不调用外部 API。'],
    };
  }

  importEntities(input: SeedDataImportInput): SeedDataImportResult {
    return this.importSeedData(input);
  }

  importSeedData(input: SeedDataImportInput): SeedDataImportResult {
    const entityResults = input.importPlan.entities.map((entity) => this.importEntity(entity));
    return {
      success: false,
      entityResults,
      warnings: unavailableMessages,
      errors: unavailableMessages,
      summary: {
        entityTypeCount: input.importPlan.entities.length,
        totalRecords: 0,
        validRecords: 0,
        skippedRecords: input.importPlan.entities.length,
        failedRecords: input.importPlan.entities.length,
        warningCount: unavailableMessages.length,
        errorCount: unavailableMessages.length,
        canEnterSmokeTest: false,
        dryRunOnly: true,
      },
    };
  }

  checkDependencies(): ValidationResult {
    return this.validationFailure();
  }

  checkUniqueKeys(): ValidationResult {
    return this.validationFailure();
  }

  rollbackImport(result: SeedDataImportResult): SeedDataImportResult {
    return {
      ...result,
      success: false,
      warnings: [...result.warnings, ...unavailableMessages],
      errors: [...result.errors, '未配置 adapter 无法执行真实导入回滚。'],
      summary: {
        ...result.summary,
        canEnterSmokeTest: false,
        dryRunOnly: true,
      },
    };
  }

  summarizeImportResult(result: SeedDataImportResult): string {
    return [
      `导入成功：${result.success ? '是' : '否'}`,
      `实体数量：${result.summary.entityTypeCount}`,
      '当前没有真实 NocoBase app，测试数据导入不能执行。',
    ].join('\n');
  }

  runSmokeTests(smokeTests: SmokeTestPlan[]): NocobaseAdapterOperationResult {
    return this.operationFailure('runSmokeTests', [`计划数量：${smokeTests.length}`]);
  }

  backup(operation: string): NocobaseAdapterOperationResult {
    return this.operationFailure('backup', [`请求操作：${operation}`]);
  }

  rollback(operation: string): NocobaseAdapterOperationResult {
    return this.operationFailure('rollback', [`请求操作：${operation}`]);
  }

  assertNotConfigured(): never {
    throw createNocobaseAdapterError('nocobase_adapter_not_configured', unavailableMessages);
  }

  private operationFailure(operation: string, steps: string[] = []): NocobaseAdapterOperationResult {
    return {
      success: false,
      mode: this.mode,
      operation,
      warnings: unavailableMessages,
      errors: ['真实 NocoBase API 尚未实现。', ...unavailableMessages],
      steps: [...steps, '未尝试连接数据库。', '未写文件。', '未调用外部 API。', '未伪造成功。'],
      artifacts: {},
    };
  }

  private validationFailure(): ValidationResult {
    return {
      passed: false,
      errors: unavailableMessages,
      warnings: ['未配置真实 adapter 只能返回受控失败校验结果。'],
    };
  }

  private collectionResult(
    collectionName: string,
    sourcePlugin: string,
    operation: string,
  ): CollectionRegistrationResult {
    return {
      collectionName,
      sourcePlugin,
      success: false,
      created: false,
      skipped: true,
      warnings: unavailableMessages,
      errors: [`${operation} 失败：真实 NocoBase API 尚未实现。`, ...unavailableMessages],
      steps: ['未连接真实 NocoBase。', '未创建 Collection。', '未写数据库。'],
    };
  }

  private runtimeResult<T extends string>(
    key: T,
    name: string,
    sourcePlugin: string,
    operation: string,
  ): Record<T, string> & {
    sourcePlugin: string;
    success: false;
    registered: false;
    skipped: true;
    warnings: string[];
    errors: string[];
    steps: string[];
  } {
    return {
      [key]: name,
      sourcePlugin,
      success: false,
      registered: false,
      skipped: true,
      warnings: unavailableMessages,
      errors: [`${operation} 失败：当前不能执行真实注册。`, ...unavailableMessages],
      steps: ['未连接真实 NocoBase。', '未注册真实 runtime 能力。'],
    } as Record<T, string> & {
      sourcePlugin: string;
      success: false;
      registered: false;
      skipped: true;
      warnings: string[];
      errors: string[];
      steps: string[];
    };
  }

  private pageResult(
    itemName: string,
    itemType: PageItemRegistrationResult['itemType'],
    sourcePlugin: string,
    operation: string,
  ): PageItemRegistrationResult {
    return {
      itemName,
      itemType,
      sourcePlugin,
      success: false,
      registered: false,
      skipped: true,
      warnings: unavailableMessages,
      errors: [`${operation} 失败：当前不能执行真实页面注册。`, ...unavailableMessages],
      steps: ['未连接真实 NocoBase。', '未写入 UI Schema。', '未创建真实页面。'],
    };
  }
}

export const createUnconfiguredNocobaseRealAdapter = (
  config: NocobaseRealAdapterConfig = {},
): UnconfiguredNocobaseRealAdapter => new UnconfiguredNocobaseRealAdapter(config);
