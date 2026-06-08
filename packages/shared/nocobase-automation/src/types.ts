/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RegistrationStepStatus = 'planned' | 'warning' | 'error';

export interface RegistrationStep {
  name: string;
  title: string;
  sourcePlugin?: string;
  status: RegistrationStepStatus;
  dryRunOnly: boolean;
  notes: string[];
}

export interface PluginPlanSummary {
  pluginName: string;
  pluginTitle: string;
  dependencies: string[];
  notes: string[];
}

export type CollectionRelationType = 'belongsTo' | 'hasMany' | 'hasOne' | 'belongsToMany' | 'externalPluginReference';

export interface CollectionRelationPlan {
  sourceCollection: string;
  sourceField: string;
  targetCollection: string;
  relationType: CollectionRelationType;
  foreignKey: string;
  targetKey: string;
  notes: string[];
}

export interface CollectionFieldPlan {
  name: string;
  type: string;
  title: string;
  required: boolean;
  defaultValue?: unknown;
  enumValues: string[];
  relation?: CollectionRelationPlan;
  sensitive: boolean;
  unique: boolean;
  index: boolean;
  notes: string[];
}

export interface CollectionIndexPlan {
  name: string;
  fields: string[];
  unique: boolean;
  notes: string[];
}

export interface NocobaseCollectionPlan {
  name: string;
  title: string;
  fields: string[];
  indexes: string[];
  uniqueConstraints: string[][];
  sensitiveFields: string[];
  relations: unknown[];
  sourcePlugin: string;
  notes: string[];
  fieldPlans?: CollectionFieldPlan[];
  indexPlans?: CollectionIndexPlan[];
  relationPlans?: CollectionRelationPlan[];
}

export interface NocobaseServicePlan {
  name: string;
  sourcePlugin: string;
  handlerName: string;
  permissions: string[];
  transactional: boolean;
  notes: string[];
}

export interface NocobasePermissionPlan {
  role: string;
  collections: string[];
  actions: string[];
  fieldVisibility: Record<string, 'visible' | 'hidden' | 'masked'>;
  sensitiveFields: string[];
  notes: string[];
}

export interface NocobaseActionPlan {
  name: string;
  title: string;
  sourcePlugin: string;
  inputSchema: string[];
  outputSchema: string;
  requiredPermissions: string[];
  serviceName: string;
  notes: string[];
}

export interface NocobaseSchedulePlan {
  name: string;
  title: string;
  sourcePlugin: string;
  cron: string;
  enabledByDefault: boolean;
  serviceName: string;
  notes: string[];
}

export interface NocobaseMenuPlan {
  name: string;
  title: string;
  path: string;
  icon: string;
  order: number;
  parentName: string;
  requiredRoles: string[];
  sourcePlugin: string;
  notes: string[];
}

export type NocobaseBlockType =
  | 'table'
  | 'form'
  | 'details'
  | 'calendar'
  | 'kanban'
  | 'chart'
  | 'markdown'
  | 'tabs'
  | 'relation'
  | 'actionPanel';

export type NocobasePageActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'submit'
  | 'approve'
  | 'reverse'
  | 'generate'
  | 'import'
  | 'export'
  | 'sync'
  | 'custom';

export interface NocobaseFilterPlan {
  name: string;
  title: string;
  collection: string;
  field: string;
  operator: string;
  defaultValue?: unknown;
  requiredRoles: string[];
  sourcePlugin: string;
  notes: string[];
}

export interface NocobasePageActionPlan {
  name: string;
  title: string;
  actionType: NocobasePageActionType;
  serviceName: string;
  collection: string;
  requiredRoles: string[];
  confirmationRequired: boolean;
  danger: boolean;
  sourcePlugin: string;
  notes: string[];
}

export interface NocobaseBlockPlan {
  name: string;
  title: string;
  blockType: NocobaseBlockType;
  collection: string;
  fields: string[];
  filters: string[];
  actions: string[];
  visibleFields: string[];
  hiddenFields: string[];
  requiredRoles: string[];
  sourcePlugin: string;
  notes: string[];
}

export interface NocobasePagePlan {
  name: string;
  title: string;
  menuPath: string;
  sourcePlugin: string;
  collections: string[];
  blocks: string[];
  requiredRoles: string[];
  notes: string[];
  route?: string;
  menuName?: string;
  collection?: string;
  layout?: string;
  filters?: string[];
  actions?: string[];
}

export interface PageInitializationPlan {
  menus: NocobaseMenuPlan[];
  pages: NocobasePagePlan[];
  blocks: NocobaseBlockPlan[];
  filters: NocobaseFilterPlan[];
  actions: NocobasePageActionPlan[];
  warnings: string[];
  notes: string[];
}

export interface PageItemRegistrationResult {
  itemName: string;
  itemType: 'menu' | 'page' | 'block' | 'filter' | 'pageAction';
  sourcePlugin: string;
  success: boolean;
  registered: boolean;
  skipped: boolean;
  warnings: string[];
  errors: string[];
  steps: string[];
}

export interface PageInitializationResult {
  success: boolean;
  menuResults: PageItemRegistrationResult[];
  pageResults: PageItemRegistrationResult[];
  blockResults: PageItemRegistrationResult[];
  filterResults: PageItemRegistrationResult[];
  actionResults: PageItemRegistrationResult[];
  warnings: string[];
  errors: string[];
  summary: {
    menuCount: number;
    pageCount: number;
    blockCount: number;
    filterCount: number;
    pageActionCount: number;
    successCount: number;
    registeredCount: number;
    skippedCount: number;
    errorCount: number;
    warningCount: number;
    dryRunOnly: true;
  };
}

export interface NocobaseI18nPlan {
  namespace: string;
  sourcePlugin: string;
  languages: string[];
  localeFiles: string[];
  notes: string[];
}

export interface SeedDataPlan {
  name: string;
  source: string;
  targetCollections: string[];
  dryRunOnly: boolean;
  notes: string[];
}

export interface SmokeTestPlan {
  name: string;
  title: string;
  target: string;
  assertions: string[];
  blockedBy: string[];
  notes: string[];
}

export interface AutomatedGoLiveRegistrationPlan {
  plugins: PluginPlanSummary[];
  collections: NocobaseCollectionPlan[];
  services: NocobaseServicePlan[];
  permissions: NocobasePermissionPlan[];
  actions: NocobaseActionPlan[];
  schedules: NocobaseSchedulePlan[];
  pages: NocobasePagePlan[];
  i18n: NocobaseI18nPlan[];
  seedData: SeedDataPlan[];
  smokeTests: SmokeTestPlan[];
  warnings: string[];
  notes: string[];
}

export interface DryRunResult {
  success: boolean;
  steps: RegistrationStep[];
  warnings: string[];
  errors: string[];
  summary: {
    pluginCount: number;
    collectionCount: number;
    serviceCount: number;
    permissionCount: number;
    actionCount: number;
    scheduleCount: number;
    pageCount: number;
    smokeTestCount: number;
    dryRunOnly: true;
  };
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface CollectionRegistrationInput {
  collection: NocobaseCollectionPlan;
  dryRun: boolean;
  sourcePlugin: string;
}

export interface CollectionRegistrationResult {
  collectionName: string;
  sourcePlugin: string;
  success: boolean;
  created: boolean;
  skipped: boolean;
  warnings: string[];
  errors: string[];
  steps: string[];
}

export interface CollectionRegistrationBatchResult {
  success: boolean;
  results: CollectionRegistrationResult[];
  warnings: string[];
  errors: string[];
  summary: {
    totalCollections: number;
    successCount: number;
    createdCount: number;
    skippedCount: number;
    errorCount: number;
    warningCount: number;
    criticalUniqueConstraintsPassed: boolean;
    sensitiveFieldsPassed: boolean;
    dryRunOnly: true;
  };
}

/**
 * Collection 自动注册 adapter 接口。
 * 未来真实 NocoBase 工程需要实现这些方法；本轮 mock adapter 不连接真实 NocoBase、不写数据库、不执行 migration。
 */
export interface NocobaseCollectionAdapter {
  checkCollectionExists(collectionName: string): boolean;
  validateCollectionPlan(collectionPlan: NocobaseCollectionPlan): ValidationResult;
  registerCollection(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult;
  registerCollections(collectionPlans: NocobaseCollectionPlan[]): CollectionRegistrationBatchResult;
  ensureIndexes(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult;
  ensureUniqueConstraints(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult;
  ensureRelations(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult;
  markSensitiveFields(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult;
}

export interface ServiceRegistrationInput {
  service: NocobaseServicePlan;
  dryRun: boolean;
  sourcePlugin: string;
}

export interface ServiceRegistrationResult {
  serviceName: string;
  sourcePlugin: string;
  success: boolean;
  registered: boolean;
  skipped: boolean;
  warnings: string[];
  errors: string[];
  steps: string[];
}

export interface ActionRegistrationInput {
  action: NocobaseActionPlan;
  dryRun: boolean;
  sourcePlugin: string;
}

export interface ActionRegistrationResult {
  actionName: string;
  sourcePlugin: string;
  success: boolean;
  registered: boolean;
  skipped: boolean;
  warnings: string[];
  errors: string[];
  steps: string[];
}

export interface PermissionRegistrationInput {
  permission: NocobasePermissionPlan;
  dryRun: boolean;
  sourcePlugin: string;
}

export interface PermissionRegistrationResult {
  role: string;
  sourcePlugin: string;
  success: boolean;
  registered: boolean;
  skipped: boolean;
  warnings: string[];
  errors: string[];
  steps: string[];
}

export interface ScheduleRegistrationInput {
  schedule: NocobaseSchedulePlan;
  dryRun: boolean;
  sourcePlugin: string;
}

export interface ScheduleRegistrationResult {
  scheduleName: string;
  sourcePlugin: string;
  success: boolean;
  registered: boolean;
  skipped: boolean;
  warnings: string[];
  errors: string[];
  steps: string[];
}

export interface I18nRegistrationInput {
  i18n: NocobaseI18nPlan;
  dryRun: boolean;
  sourcePlugin: string;
}

export interface I18nRegistrationResult {
  namespace: string;
  sourcePlugin: string;
  success: boolean;
  registered: boolean;
  skipped: boolean;
  warnings: string[];
  errors: string[];
  steps: string[];
}

export interface RuntimeRegistrationPlan {
  services: NocobaseServicePlan[];
  actions: NocobaseActionPlan[];
  permissions: NocobasePermissionPlan[];
  schedules: NocobaseSchedulePlan[];
  i18n: NocobaseI18nPlan[];
  warnings: string[];
  notes: string[];
}

export interface RuntimeRegistrationBatchResult {
  success: boolean;
  serviceResults: ServiceRegistrationResult[];
  actionResults: ActionRegistrationResult[];
  permissionResults: PermissionRegistrationResult[];
  scheduleResults: ScheduleRegistrationResult[];
  i18nResults: I18nRegistrationResult[];
  warnings: string[];
  errors: string[];
  summary: {
    serviceCount: number;
    actionCount: number;
    permissionRoleCount: number;
    scheduleCount: number;
    i18nNamespaceCount: number;
    successCount: number;
    registeredCount: number;
    skippedCount: number;
    errorCount: number;
    warningCount: number;
    dryRunOnly: true;
  };
}

/**
 * Runtime 自动注册 adapter 接口。
 * 未来真实 NocoBase 工程需要实现这些方法；本轮 mock adapter 不连接真实 NocoBase、不注册真实 API/按钮/ACL/定时任务/i18n。
 */
export interface NocobaseRuntimeAdapter {
  registerServices(services: NocobaseServicePlan[]): ServiceRegistrationResult[];
  registerActions(actions: NocobaseActionPlan[]): ActionRegistrationResult[];
  registerPermissions(permissions: NocobasePermissionPlan[]): PermissionRegistrationResult[];
  registerSchedules(schedules: NocobaseSchedulePlan[]): ScheduleRegistrationResult[];
  registerI18n(i18n: NocobaseI18nPlan[]): I18nRegistrationResult[];
  validateServicePlan(service: NocobaseServicePlan): ValidationResult;
  validateActionPlan(action: NocobaseActionPlan): ValidationResult;
  validatePermissionPlan(permission: NocobasePermissionPlan): ValidationResult;
  validateSchedulePlan(schedule: NocobaseSchedulePlan): ValidationResult;
  validateI18nPlan(i18n: NocobaseI18nPlan): ValidationResult;
}

/**
 * 测试数据导入 dry-run 类型与 adapter 接口。
 * 未来真实 NocoBase 工程需要实现真实导入 adapter；本轮 mock adapter 不连接真实 NocoBase、不写数据库、不上传文件。
 */
export type SeedDataEntityType =
  | 'drivers'
  | 'vehicles'
  | 'gps_devices'
  | 'lease_contracts'
  | 'contract_billing_weeks'
  | 'rent_daily_ledgers'
  | 'rent_payments'
  | 'rent_payment_allocations'
  | 'deposit_records'
  | 'gps_location_snapshots'
  | 'gps_daily_mileages'
  | 'contract_documents'
  | 'operation_logs';

export interface SeedDataDependencyPlan {
  entityType: SeedDataEntityType;
  dependsOn: SeedDataEntityType;
  relationField: string;
  targetKey: string;
  required: boolean;
  notes: string[];
}

export interface SeedDataEntityPlan {
  entityType: SeedDataEntityType;
  sourceFile: string;
  targetCollection: string;
  importOrder: number;
  required: boolean;
  recordsCount: number;
  dependencies: SeedDataDependencyPlan[];
  uniqueKeys: string[][];
  sensitiveFields: string[];
  validationRules: string[];
  notes: string[];
}

export interface SeedDataImportPlan {
  entities: SeedDataEntityPlan[];
  dependencies: SeedDataDependencyPlan[];
  importOrder: SeedDataEntityType[];
  warnings: string[];
  notes: string[];
}

export interface SeedDataImportInput {
  importPlan: SeedDataImportPlan;
  dryRun: boolean;
  sourceDir: string;
  targetEnvironment: string;
  importedBy: string;
  importedAt: string;
}

export interface SeedDataEntityImportResult {
  entityType: SeedDataEntityType;
  sourceFile: string;
  targetCollection: string;
  totalRecords: number;
  validRecords: number;
  skippedRecords: number;
  failedRecords: number;
  warnings: string[];
  errors: string[];
  steps: string[];
}

export interface SeedDataImportResult {
  success: boolean;
  entityResults: SeedDataEntityImportResult[];
  warnings: string[];
  errors: string[];
  summary: {
    entityTypeCount: number;
    totalRecords: number;
    validRecords: number;
    skippedRecords: number;
    failedRecords: number;
    warningCount: number;
    errorCount: number;
    canEnterSmokeTest: boolean;
    dryRunOnly: true;
  };
}

export interface NocobaseSeedDataAdapter {
  loadSeedData(input: SeedDataImportInput): Record<SeedDataEntityType, unknown[]>;
  validateSeedData(input: SeedDataImportInput, dataByEntity: Record<SeedDataEntityType, unknown[]>): ValidationResult;
  importEntity(entityPlan: SeedDataEntityPlan, records: unknown[]): SeedDataEntityImportResult;
  importEntities(input: SeedDataImportInput, dataByEntity: Record<SeedDataEntityType, unknown[]>): SeedDataImportResult;
  checkDependencies(plan: SeedDataImportPlan, dataByEntity: Record<SeedDataEntityType, unknown[]>): ValidationResult;
  checkUniqueKeys(plan: SeedDataImportPlan, dataByEntity: Record<SeedDataEntityType, unknown[]>): ValidationResult;
  rollbackImport(result: SeedDataImportResult): SeedDataImportResult;
  summarizeImportResult(result: SeedDataImportResult): string;
}

export type RealSeedDataImportMode = 'plan_only' | 'validate_only' | 'dry_run' | 'real';

export interface RealSeedDataFileFieldDraft {
  fieldName: string;
  entityType: string;
  placeholderStrategy: string;
  requiresFileStorage: boolean;
  sensitive: boolean;
  unsupportedReason?: string;
  notes: string[];
}

export interface RealSeedDataRelationDraft {
  entityType: string;
  relationField: string;
  targetEntityType: string;
  targetCollection: string;
  targetKey: string;
  required: boolean;
  validationNotes: string[];
}

export interface RealSeedDataEntitySchemaDraft {
  entityType: string;
  sourceFile: string;
  targetCollection: string;
  importOrder: number;
  dependencies: SeedDataDependencyPlan[];
  uniqueKeys: string[][];
  sensitiveFields: string[];
  recordCount: number;
  fileFields: RealSeedDataFileFieldDraft[];
  relationFields: RealSeedDataRelationDraft[];
  importNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealSeedDataImportContext {
  mode: RealSeedDataImportMode;
  adapterEnvironment: NocobaseAdapterEnvironment;
  allowRealExecution: boolean;
  requireBackup: boolean;
  requireRollbackPlan: boolean;
  requireTransaction: boolean;
  sourceDir: string;
  operator?: string;
  notes: string[];
}

export interface RealSeedDataImportStep {
  step: string;
  title: string;
  entityType: string;
  targetCollection: string;
  mode: RealSeedDataImportMode;
  plannedAction: string;
  canExecute: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealSeedDataImportSafetyCheck {
  name: string;
  passed: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealSeedDataImportPlan {
  mode: RealSeedDataImportMode;
  entities: RealSeedDataEntitySchemaDraft[];
  steps: RealSeedDataImportStep[];
  safetyChecks: RealSeedDataImportSafetyCheck[];
  transactionPlan: string[];
  rollbackPlan: string[];
  postImportValidationPlan: string[];
  warnings: string[];
  errors: string[];
  notes: string[];
}

export interface RealSeedDataImportReport {
  success: boolean;
  mode: RealSeedDataImportMode;
  executed: boolean;
  entitiesPlanned: number;
  recordsPlanned: number;
  importsExecutable: number;
  importsBlocked: number;
  warnings: string[];
  errors: string[];
  steps: RealSeedDataImportStep[];
  nextActions: string[];
}

export interface NocobaseRealSeedDataImportAdapter {
  buildRealSeedDataImportPlan(
    importPlan: SeedDataImportPlan,
    context: RealSeedDataImportContext,
  ): RealSeedDataImportPlan;
  validateRealSeedDataImportPlan(plan: RealSeedDataImportPlan): RealSeedDataImportReport;
  generateRealSeedDataImportSteps(plan: RealSeedDataImportPlan): RealSeedDataImportStep[];
  generateTransactionPlan(plan: RealSeedDataImportPlan): string[];
  generateRollbackPlan(plan: RealSeedDataImportPlan): string[];
  generatePostImportValidationPlan(plan: RealSeedDataImportPlan): string[];
}

/**
 * 页面初始化 adapter 接口。
 * 未来真实 NocoBase 工程需要实现这些方法；本轮 mock adapter 不连接真实 NocoBase、不创建真实 UI、不注册真实按钮。
 */
export interface NocobasePageAdapter {
  registerMenus(menus: NocobaseMenuPlan[]): PageItemRegistrationResult[];
  registerPages(pages: NocobasePagePlan[]): PageItemRegistrationResult[];
  registerBlocks(blocks: NocobaseBlockPlan[]): PageItemRegistrationResult[];
  registerFilters(filters: NocobaseFilterPlan[]): PageItemRegistrationResult[];
  registerPageActions(actions: NocobasePageActionPlan[]): PageItemRegistrationResult[];
  validateMenuPlan(menu: NocobaseMenuPlan): ValidationResult;
  validatePagePlan(page: NocobasePagePlan): ValidationResult;
  validateBlockPlan(block: NocobaseBlockPlan): ValidationResult;
  validateFilterPlan(filter: NocobaseFilterPlan): ValidationResult;
  validatePageActionPlan(action: NocobasePageActionPlan): ValidationResult;
}

/**
 * 自动化 Smoke Test dry-run 编排类型。
 * 本轮只编排本地脚本与 mock dry-run，不连接真实 NocoBase、不写数据库、不调用 IOPGPS。
 */
export type SmokeTestStepName =
  | 'repository_scan'
  | 'generate_registration_plan'
  | 'validate_registration_plan'
  | 'dry_run_register_collections'
  | 'validate_collection_registration'
  | 'dry_run_register_runtime'
  | 'validate_runtime_registration'
  | 'dry_run_initialize_pages'
  | 'validate_page_initialization'
  | 'seed_test_data'
  | 'validate_test_data'
  | 'dry_run_import_test_data'
  | 'validate_seed_data_import'
  | 'preflight_nas_test'
  | 'generate_smoke_report';

export type SmokeTestStepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'warning';

export interface SmokeTestPlanStep {
  name: SmokeTestStepName;
  title: string;
  command: string;
  artifacts: string[];
  blocking: boolean;
  notes: string[];
}

export interface SmokeTestStepResult {
  name: SmokeTestStepName;
  status: SmokeTestStepStatus;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  command: string;
  output_summary: string;
  warnings: string[];
  errors: string[];
  artifacts: string[];
}

export interface SmokeTestDryRunResult {
  success: boolean;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  steps: SmokeTestStepResult[];
  warnings: string[];
  errors: string[];
  summary: {
    total_steps: number;
    passed_steps: number;
    failed_steps: number;
    warning_steps: number;
    skipped_steps: number;
    blocking_failed_steps: number;
    dryRunOnly: true;
  };
  artifacts: string[];
  next_actions: string[];
}

export interface SmokeTestReport {
  report_no: string;
  generated_at: string;
  environment: string;
  success: boolean;
  passed_steps: number;
  failed_steps: number;
  warning_steps: number;
  skipped_steps: number;
  blockers: string[];
  warnings: string[];
  artifacts: string[];
  next_actions: string[];
  notes: string[];
}

/**
 * 正式上线测试前总预检 readiness 类型。
 * 当前阶段用于评估 dry-run 与基础测试材料是否齐备；不得把本仓库误判为 production_ready。
 */
export type GoLiveReadinessGateName =
  | 'repository_scan'
  | 'typecheck'
  | 'unit_tests'
  | 'registration_plan'
  | 'collection_registration_dry_run'
  | 'runtime_registration_dry_run'
  | 'page_initialization_dry_run'
  | 'seed_data_generation'
  | 'seed_data_validation'
  | 'seed_data_import_dry_run'
  | 'smoke_test_dry_run'
  | 'nas_test_files'
  | 'security_boundary'
  | 'forbidden_business_patterns'
  | 'plugin_installation_readiness'
  | 'real_nocobase_adapter_readiness'
  | 'production_readiness';

export type GoLiveReadinessGateStatus = 'passed' | 'failed' | 'warning' | 'skipped' | 'not_applicable';

export type ReadinessLevel =
  | 'dry_run_only'
  | 'nas_base_environment_ready'
  | 'plugin_integration_test_ready'
  | 'uat_ready'
  | 'production_not_ready'
  | 'production_ready';

export interface GoLiveReadinessGateResult {
  name: GoLiveReadinessGateName;
  status: GoLiveReadinessGateStatus;
  title: string;
  description: string;
  evidence: string[];
  blockers: string[];
  warnings: string[];
  next_actions: string[];
  required_for_nas_test: boolean;
  required_for_plugin_integration_test: boolean;
  required_for_production: boolean;
}

export interface GoLiveReadinessReport {
  report_no: string;
  generated_at: string;
  repository: string;
  branch: string;
  success: boolean;
  readiness_level: ReadinessLevel;
  gates: GoLiveReadinessGateResult[];
  blockers: string[];
  warnings: string[];
  allowed_next_stage: string[];
  forbidden_next_stage: string[];
  next_actions: string[];
  evidence_files: string[];
  notes: string[];
}

/**
 * 未来真实接入 NocoBase 时由真实 adapter 实现。
 * 本轮只定义接口；dry-run 不会调用真实 NocoBase、不会写数据库、不会创建 UI、不会调用 IOPGPS。
 */
export interface NocobaseAutomationAdapter {
  /** 输入 Collection 计划；未来接入 NocoBase Collection/migration；当前 dry-run 不真实执行。 */
  registerCollections(collections: NocobaseCollectionPlan[]): Promise<DryRunResult>;
  /** 输入服务计划；未来接入 NocoBase 服务/动作；当前 dry-run 不真实执行。 */
  registerServices(services: NocobaseServicePlan[]): Promise<DryRunResult>;
  /** 输入权限计划；未来接入服务端 ACL；当前 dry-run 不真实执行。 */
  registerPermissions(permissions: NocobasePermissionPlan[]): Promise<DryRunResult>;
  /** 输入 i18n 计划；未来接入 NocoBase i18n；当前 dry-run 不真实执行。 */
  registerI18n(i18n: NocobaseI18nPlan[]): Promise<DryRunResult>;
  /** 输入定时任务计划；未来接入 scheduler/workflow；当前 dry-run 不真实执行。 */
  registerSchedules(schedules: NocobaseSchedulePlan[]): Promise<DryRunResult>;
  /** 输入动作计划；未来接入按钮/API/action；当前 dry-run 不真实执行。 */
  registerActions(actions: NocobaseActionPlan[]): Promise<DryRunResult>;
  /** 输入页面计划；未来接入页面/菜单/区块初始化；当前 dry-run 不真实执行。 */
  registerPages(pages: NocobasePagePlan[]): Promise<DryRunResult>;
  /** 输入 mock 数据计划；未来接入测试数据导入；当前 dry-run 不真实执行。 */
  importSeedData(seedData: SeedDataPlan[]): Promise<DryRunResult>;
  /** 输入 smoke test 计划；未来执行自动化测试；当前 dry-run 不真实执行。 */
  runSmokeTests(smokeTests: SmokeTestPlan[]): Promise<DryRunResult>;
  /** 输入操作日志；未来写入 NocoBase 操作日志；当前 dry-run 不真实执行。 */
  writeOperationLog(entry: { action: string; target: string; notes: string[] }): Promise<DryRunResult>;
}

/**
 * 真实 NocoBase adapter 模式。
 * 本轮只定义模式边界，不读取 .env，不连接真实 NocoBase。
 */
export type NocobaseAdapterMode = 'dry_run' | 'real' | 'disabled';

export type NocobaseAdapterStatus = 'unavailable' | 'configured' | 'connected' | 'ready' | 'failed';

export type NocobaseAdapterCapabilityName =
  | 'register_collections'
  | 'register_services'
  | 'register_permissions'
  | 'register_i18n'
  | 'register_schedules'
  | 'register_actions'
  | 'register_pages'
  | 'import_seed_data'
  | 'run_smoke_tests'
  | 'rollback'
  | 'backup'
  | 'inspect_schema';

export interface NocobaseAdapterCapability {
  name: NocobaseAdapterCapabilityName;
  supported: boolean;
  mode: NocobaseAdapterMode;
  requiresRealNocobase: boolean;
  notes: string[];
}

export interface NocobaseAdapterEnvironment {
  mode: NocobaseAdapterMode;
  status: NocobaseAdapterStatus;
  hasNocobaseApp: boolean;
  hasDatabaseConnection: boolean;
  hasLogger: boolean;
  hasFileStorage: boolean;
  hasPluginManager: boolean;
  hasAcl: boolean;
  hasUiSchema: boolean;
  hasScheduler: boolean;
  hasWorkflow: boolean;
  warnings: string[];
  errors: string[];
}

export interface NocobaseRealAdapterConfig<
  TApp = unknown,
  TDb = unknown,
  TLogger = unknown,
  TStorage = unknown,
  TPluginManager = unknown,
  TAcl = unknown,
  TUiSchema = unknown,
  TScheduler = unknown,
  TWorkflow = unknown,
> {
  mode?: NocobaseAdapterMode;
  app?: TApp;
  db?: TDb;
  logger?: TLogger;
  storage?: TStorage;
  pluginManager?: TPluginManager;
  acl?: TAcl;
  uiSchema?: TUiSchema;
  scheduler?: TScheduler;
  workflow?: TWorkflow;
  options?: Record<string, unknown>;
}

export interface NocobaseAdapterOperationResult {
  success: boolean;
  mode: NocobaseAdapterMode;
  operation: string;
  warnings: string[];
  errors: string[];
  steps: string[];
  artifacts: Record<string, unknown>;
}

export type RealCollectionRegistrationMode = 'plan_only' | 'validate_only' | 'dry_run' | 'real';

export interface RealCollectionRelationSchemaDraft {
  sourceCollection: string;
  sourceField: string;
  targetCollection: string;
  relationType: CollectionRelationType;
  foreignKey: string;
  targetKey: string;
  notes: string[];
  warnings: string[];
}

export interface RealCollectionIndexSchemaDraft {
  name: string;
  fields: string[];
  unique: boolean;
  notes: string[];
  warnings: string[];
}

export interface RealCollectionFieldSchemaDraft {
  name: string;
  type: string;
  title: string;
  required: boolean;
  defaultValue?: unknown;
  enumValues: string[];
  relation?: RealCollectionRelationSchemaDraft;
  sensitive: boolean;
  unique: boolean;
  index: boolean;
  nocobaseFieldType?: string;
  unsupportedReason?: string;
  notes: string[];
}

export interface RealCollectionSchemaDraft {
  name: string;
  title: string;
  fields: RealCollectionFieldSchemaDraft[];
  indexes: RealCollectionIndexSchemaDraft[];
  uniqueConstraints: string[][];
  relations: RealCollectionRelationSchemaDraft[];
  sensitiveFields: string[];
  sourcePlugin: string;
  nocobaseSchemaNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealCollectionRegistrationContext {
  mode: RealCollectionRegistrationMode;
  adapterEnvironment: NocobaseAdapterEnvironment;
  allowRealExecution: boolean;
  requireBackup: boolean;
  requireRollbackPlan: boolean;
  sourcePlugin?: string;
  operator?: string;
  notes: string[];
}

export interface RealCollectionRegistrationStep {
  step: string;
  title: string;
  collectionName?: string;
  mode: RealCollectionRegistrationMode;
  plannedAction: string;
  canExecute: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealCollectionRegistrationSafetyCheck {
  name: string;
  passed: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealCollectionRegistrationPlan {
  mode: RealCollectionRegistrationMode;
  collections: RealCollectionSchemaDraft[];
  steps: RealCollectionRegistrationStep[];
  safetyChecks: RealCollectionRegistrationSafetyCheck[];
  rollbackPlan: string[];
  postRegistrationValidationPlan?: string[];
  warnings: string[];
  errors: string[];
  notes: string[];
}

export interface RealCollectionRegistrationReport {
  success: boolean;
  mode: RealCollectionRegistrationMode;
  executed: boolean;
  collectionsPlanned: number;
  collectionsExecutable: number;
  collectionsBlocked: number;
  warnings: string[];
  errors: string[];
  steps: RealCollectionRegistrationStep[];
  nextActions: string[];
}

export type RealPageRegistrationMode = 'plan_only' | 'validate_only' | 'dry_run' | 'real';

export interface RealMenuSchemaDraft {
  name: string;
  title: string;
  path: string;
  icon: string;
  order: number;
  parentName: string;
  requiredRoles: string[];
  sourcePlugin: string;
  uiSchemaNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealPageSchemaDraft {
  name: string;
  title: string;
  route: string;
  menuName: string;
  menuPath: string;
  collection: string;
  collections: string[];
  blocks: string[];
  filters: string[];
  actions: string[];
  requiredRoles: string[];
  layout: string;
  sourcePlugin: string;
  uiSchemaNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealBlockSchemaDraft {
  name: string;
  title: string;
  blockType: NocobaseBlockType;
  collection: string;
  fields: string[];
  filters: string[];
  actions: string[];
  visibleFields: string[];
  hiddenFields: string[];
  requiredRoles: string[];
  sourcePlugin: string;
  uiSchemaNotes: string[];
  sensitiveFieldWarnings: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealFilterSchemaDraft {
  name: string;
  title: string;
  collection: string;
  field: string;
  operator: string;
  defaultValue?: unknown;
  requiredRoles: string[];
  sourcePlugin: string;
  uiSchemaNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealPageActionSchemaDraft {
  name: string;
  title: string;
  actionType: NocobasePageActionType;
  serviceName: string;
  collection: string;
  requiredRoles: string[];
  confirmationRequired: boolean;
  danger: boolean;
  sourcePlugin: string;
  uiSchemaNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealPageRegistrationContext {
  mode: RealPageRegistrationMode;
  adapterEnvironment: NocobaseAdapterEnvironment;
  allowRealExecution: boolean;
  requireBackup: boolean;
  requireRollbackPlan: boolean;
  sourcePlugin?: string;
  operator?: string;
  notes: string[];
}

export interface RealPageRegistrationStep {
  step: string;
  title: string;
  itemName: string;
  itemType: 'menu' | 'page' | 'block' | 'filter' | 'pageAction' | 'safety' | 'rollback' | 'validation';
  sourcePlugin: string;
  mode: RealPageRegistrationMode;
  plannedAction: string;
  canExecute: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealPageRegistrationSafetyCheck {
  name: string;
  passed: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealPageRegistrationPlan {
  mode: RealPageRegistrationMode;
  menus: RealMenuSchemaDraft[];
  pages: RealPageSchemaDraft[];
  blocks: RealBlockSchemaDraft[];
  filters: RealFilterSchemaDraft[];
  actions: RealPageActionSchemaDraft[];
  steps: RealPageRegistrationStep[];
  safetyChecks: RealPageRegistrationSafetyCheck[];
  rollbackPlan: string[];
  postRegistrationValidationPlan?: string[];
  warnings: string[];
  errors: string[];
  notes: string[];
}

export interface RealPageRegistrationReport {
  success: boolean;
  mode: RealPageRegistrationMode;
  executed: boolean;
  menusPlanned: number;
  pagesPlanned: number;
  blocksPlanned: number;
  filtersPlanned: number;
  actionsPlanned: number;
  pageItemsExecutable: number;
  pageItemsBlocked: number;
  warnings: string[];
  errors: string[];
  steps: RealPageRegistrationStep[];
  nextActions: string[];
}

export type RealRuntimeRegistrationMode = 'plan_only' | 'validate_only' | 'dry_run' | 'real';

export interface RealServiceSchemaDraft {
  name: string;
  sourcePlugin: string;
  handlerName: string;
  permissions: string[];
  transactional: boolean;
  nocobaseServiceNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealActionSchemaDraft {
  name: string;
  title: string;
  sourcePlugin: string;
  serviceName: string;
  requiredPermissions: string[];
  inputSchema: string[];
  outputSchema: string;
  confirmationRequired: boolean;
  danger: boolean;
  nocobaseActionNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealPermissionSchemaDraft {
  role: string;
  sourcePlugin: string;
  collections: string[];
  actions: string[];
  fieldVisibility: Record<string, 'visible' | 'hidden' | 'masked'>;
  sensitiveFields: string[];
  aclNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealScheduleSchemaDraft {
  name: string;
  title: string;
  sourcePlugin: string;
  cron: string;
  enabledByDefault: boolean;
  serviceName: string;
  schedulerNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealI18nSchemaDraft {
  namespace: string;
  sourcePlugin: string;
  languages: string[];
  localeFiles: string[];
  i18nNotes: string[];
  unsupportedFeatures: string[];
  warnings: string[];
}

export interface RealRuntimeRegistrationContext {
  mode: RealRuntimeRegistrationMode;
  adapterEnvironment: NocobaseAdapterEnvironment;
  allowRealExecution: boolean;
  requireBackup: boolean;
  requireRollbackPlan: boolean;
  sourcePlugin?: string;
  operator?: string;
  notes: string[];
}

export interface RealRuntimeRegistrationStep {
  step: string;
  title: string;
  itemName: string;
  itemType: 'service' | 'action' | 'permission' | 'schedule' | 'i18n' | 'safety' | 'rollback' | 'validation';
  sourcePlugin: string;
  mode: RealRuntimeRegistrationMode;
  plannedAction: string;
  canExecute: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealRuntimeRegistrationSafetyCheck {
  name: string;
  passed: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealRuntimeRegistrationPlan {
  mode: RealRuntimeRegistrationMode;
  services: RealServiceSchemaDraft[];
  actions: RealActionSchemaDraft[];
  permissions: RealPermissionSchemaDraft[];
  schedules: RealScheduleSchemaDraft[];
  i18n: RealI18nSchemaDraft[];
  steps: RealRuntimeRegistrationStep[];
  safetyChecks: RealRuntimeRegistrationSafetyCheck[];
  rollbackPlan: string[];
  postRegistrationValidationPlan?: string[];
  warnings: string[];
  errors: string[];
  notes: string[];
}

export interface RealRuntimeRegistrationReport {
  success: boolean;
  mode: RealRuntimeRegistrationMode;
  executed: boolean;
  servicesPlanned: number;
  actionsPlanned: number;
  permissionsPlanned: number;
  schedulesPlanned: number;
  i18nPlanned: number;
  runtimeExecutable: number;
  runtimeBlocked: number;
  warnings: string[];
  errors: string[];
  steps: RealRuntimeRegistrationStep[];
  nextActions: string[];
}

export type RealSmokeTestMode = 'plan_only' | 'validate_only' | 'dry_run' | 'real';

export type RealSmokeTestStage =
  | 'environment_check'
  | 'plugin_installation_check'
  | 'collection_registration_check'
  | 'runtime_registration_check'
  | 'page_registration_check'
  | 'seed_data_import_check'
  | 'core_business_flow_check'
  | 'permission_check'
  | 'contract_document_check'
  | 'gps_mock_check'
  | 'failure_isolation_check'
  | 'rollback_check'
  | 'report_generation';

export interface RealSmokeTestStepDraft {
  name: string;
  title: string;
  stage: RealSmokeTestStage;
  mode: RealSmokeTestMode;
  sourcePlan: string;
  required: boolean;
  canExecute: boolean;
  plannedAction: string;
  expectedResult: string;
  verificationMethod: string;
  rollbackRequired: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealSmokeTestContext {
  mode: RealSmokeTestMode;
  adapterEnvironment: NocobaseAdapterEnvironment;
  allowRealExecution: boolean;
  requireBackup: boolean;
  requireRollbackPlan: boolean;
  requireIsolatedDatabase: boolean;
  requireMockDataOnly: boolean;
  requireIopgpsDisabled: boolean;
  operator?: string;
  notes: string[];
}

export interface RealSmokeTestReportPlanDraft {
  format: string;
  artifacts: string[];
  sections: string[];
  notes: string[];
}

export interface RealSmokeTestPlan {
  mode: RealSmokeTestMode;
  stages: RealSmokeTestStage[];
  steps: RealSmokeTestStepDraft[];
  environmentChecks: RealSmokeTestStepDraft[];
  businessChecks: RealSmokeTestStepDraft[];
  permissionChecks: RealSmokeTestStepDraft[];
  rollbackChecks: RealSmokeTestStepDraft[];
  failureIsolationChecks: RealSmokeTestStepDraft[];
  reportPlan: RealSmokeTestReportPlanDraft;
  warnings: string[];
  errors: string[];
  notes: string[];
}

export interface RealSmokeTestReportDraft {
  success: boolean;
  mode: RealSmokeTestMode;
  executed: boolean;
  stagesPlanned: number;
  stepsPlanned: number;
  stepsExecutable: number;
  stepsBlocked: number;
  warnings: string[];
  errors: string[];
  blockers: string[];
  nextActions: string[];
}

export interface RealSmokeTestAdapterOperationResult {
  success: boolean;
  mode: RealSmokeTestMode;
  operation: string;
  executed: boolean;
  warnings: string[];
  errors: string[];
  steps: RealSmokeTestStepDraft[];
  artifacts: string[];
  nextActions: string[];
}

export interface RealSmokeTestPlanInput {
  realCollectionPlan?: RealCollectionRegistrationPlan;
  realRuntimePlan?: RealRuntimeRegistrationPlan;
  realPagePlan?: RealPageRegistrationPlan;
  realSeedDataPlan?: RealSeedDataImportPlan;
  context?: Partial<RealSmokeTestContext>;
}

export interface NocobaseRealSmokeTestAdapter {
  buildRealSmokeTestPlan(input: RealSmokeTestPlanInput): RealSmokeTestPlan;
  validateRealSmokeTestPlan(plan: RealSmokeTestPlan): RealSmokeTestReportDraft;
  generateRealSmokeTestSteps(plan: RealSmokeTestPlan): RealSmokeTestStepDraft[];
  generateFailureIsolationPlan(plan: RealSmokeTestPlan): RealSmokeTestStepDraft[];
  generateRollbackVerificationPlan(plan: RealSmokeTestPlan): RealSmokeTestStepDraft[];
  generateRealSmokeTestReportDraft(plan: RealSmokeTestPlan): RealSmokeTestReportDraft;
}

export type RealBackupRollbackMode = 'plan_only' | 'validate_only' | 'dry_run' | 'real';

export type RealBackupTargetType =
  | 'database'
  | 'file_storage'
  | 'plugin_storage'
  | 'collection_schema'
  | 'runtime_registry'
  | 'page_schema'
  | 'seed_data'
  | 'logs'
  | 'environment_config';

export type RealRollbackTargetType =
  | 'database_restore'
  | 'file_storage_restore'
  | 'plugin_disable'
  | 'collection_schema_restore'
  | 'runtime_registry_restore'
  | 'page_schema_restore'
  | 'seed_data_cleanup'
  | 'generated_artifacts_cleanup'
  | 'logs_preserve'
  | 'environment_config_restore';

export interface RealBackupStepDraft {
  name: string;
  title: string;
  targetType: RealBackupTargetType;
  mode: RealBackupRollbackMode;
  plannedCommand: string;
  plannedArtifact: string;
  required: boolean;
  canExecute: boolean;
  executed: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealRollbackStepDraft {
  name: string;
  title: string;
  targetType: RealRollbackTargetType;
  mode: RealBackupRollbackMode;
  triggerCondition: string;
  plannedAction: string;
  required: boolean;
  canExecute: boolean;
  executed: boolean;
  warnings: string[];
  errors: string[];
}

export interface RealBackupPlan {
  mode: RealBackupRollbackMode;
  backupNo: string;
  createdAt: string;
  targets: RealBackupTargetType[];
  steps: RealBackupStepDraft[];
  artifacts: string[];
  safetyChecks: string[];
  warnings: string[];
  errors: string[];
  notes: string[];
}

export interface RealRollbackPlan {
  mode: RealBackupRollbackMode;
  rollbackNo: string;
  createdAt: string;
  triggerConditions: string[];
  targets: RealRollbackTargetType[];
  steps: RealRollbackStepDraft[];
  verificationSteps: string[];
  safetyChecks: string[];
  warnings: string[];
  errors: string[];
  notes: string[];
}

export type RealFailureRecoveryType =
  | 'collection_registration_failed'
  | 'runtime_registration_failed'
  | 'page_registration_failed'
  | 'seed_data_import_failed'
  | 'smoke_test_failed'
  | 'permission_validation_failed'
  | 'gps_sync_unexpected_enabled'
  | 'contract_document_generation_failed'
  | 'overpayment_rule_failed'
  | 'sensitive_data_exposure_detected';

export interface RealFailureRecoveryPlan {
  mode: RealBackupRollbackMode;
  failureType: RealFailureRecoveryType;
  detectionMethod: string;
  isolationSteps: string[];
  rollbackSteps: string[];
  verificationSteps: string[];
  escalationSteps: string[];
  warnings: string[];
  errors: string[];
  notes: string[];
}

export interface RealBackupRollbackContext {
  mode: RealBackupRollbackMode;
  adapterEnvironment: NocobaseAdapterEnvironment;
  allowRealExecution: boolean;
  requireOperatorConfirmation: boolean;
  requireIsolatedDatabase: boolean;
  requireMockDataOnly: boolean;
  requireIopgpsDisabled: boolean;
  backupDirectory: string;
  rollbackDirectory: string;
  operator?: string;
  notes: string[];
}

export interface RealBackupRollbackReport {
  success: boolean;
  mode: RealBackupRollbackMode;
  executed: boolean;
  backupPlan: RealBackupPlan;
  rollbackPlan: RealRollbackPlan;
  failureRecoveryPlans: RealFailureRecoveryPlan[];
  backupsExecutable: number;
  rollbacksExecutable: number;
  warnings: string[];
  errors: string[];
  blockers: string[];
  nextActions: string[];
}

export interface NocobaseRealBackupRollbackAdapter {
  buildRealBackupPlan(context: Partial<RealBackupRollbackContext>): RealBackupPlan;
  buildRealRollbackPlan(context: Partial<RealBackupRollbackContext>): RealRollbackPlan;
  buildFailureRecoveryPlans(context: Partial<RealBackupRollbackContext>): RealFailureRecoveryPlan[];
  validateBackupRollbackPlans(report: RealBackupRollbackReport): RealBackupRollbackReport;
  generateBackupRollbackReport(context: Partial<RealBackupRollbackContext>): RealBackupRollbackReport;
}
