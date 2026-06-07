import * as fs from 'node:fs';
import * as path from 'node:path';

export type CapabilityState = 'present' | 'missing' | 'unknown';

export interface CarRentalPluginPresence {
  plugin_rental_core: boolean;
  plugin_contract_documents: boolean;
  plugin_iopgps: boolean;
}

export interface NocobaseHostEnvironmentResult {
  target_version: string | null;
  expected_version: '2.0.61';
  package_manager: string | null;
  expected_package_manager: 'pnpm';
  database_target: 'PostgreSQL' | 'unknown';
  is_nocobase_host: boolean;
  has_app: boolean;
  has_db: boolean;
  has_logger: boolean;
  has_storage: boolean;
  has_plugin_manager: boolean;
  has_acl: boolean;
  has_ui_schema: boolean;
  has_scheduler: boolean;
  has_workflow: boolean;
  has_i18n: boolean;
  has_collection_manager: boolean;
  has_file_storage: boolean;
  has_template_printing: boolean;
  car_rental_plugins_present: CarRentalPluginPresence;
  shared_automation_present: boolean;
  capability_matrix: Record<string, CapabilityState>;
  evidence: Record<string, string[]>;
  warnings: string[];
  errors: string[];
  blockers: string[];
  next_actions: string[];
  safety: {
    reads_env_file: false;
    connects_database: false;
    calls_iopgps: false;
    writes_business_data: false;
  };
}

export interface DetectionOptions {
  rootDir?: string;
  expectedVersion?: string;
  expectedPackageManager?: string;
  overrides?: Partial<NocobaseHostEnvironmentResult>;
}

type JsonObject = Record<string, unknown>;

const TARGET_VERSION = '2.0.61' as const;
const EXPECTED_PACKAGE_MANAGER = 'pnpm' as const;

function fileExists(rootDir: string, relativePath: string): boolean {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function readJson(rootDir: string, relativePath: string): JsonObject | null {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(raw) as JsonObject;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function packageVersion(rootDir: string, relativePath: string): string | null {
  return getString(readJson(rootDir, relativePath)?.version);
}

function packageManagerName(rootDir: string, rootPackage: JsonObject | null): string | null {
  if (fileExists(rootDir, 'pnpm-lock.yaml')) return 'pnpm';
  const declared = getString(rootPackage?.packageManager);
  if (declared) return declared.split('@')[0] || declared;
  if (fileExists(rootDir, 'yarn.lock')) return 'yarn';
  if (fileExists(rootDir, 'package-lock.json')) return 'npm';
  return null;
}

function anyPathExists(rootDir: string, paths: string[]): boolean {
  return paths.some((relativePath) => fileExists(rootDir, relativePath));
}

function presentWhen(value: boolean): CapabilityState {
  return value ? 'present' : 'missing';
}

function detectTargetVersion(rootDir: string, rootPackage: JsonObject | null): string | null {
  const directVersion = getString(rootPackage?.version);
  if (directVersion) return directVersion;

  const candidatePackageFiles = [
    'packages/core/app/package.json',
    'packages/core/server/package.json',
    'packages/core/database/package.json',
    'packages/plugins/@nocobase/plugin-workflow/package.json',
  ];

  for (const packageFile of candidatePackageFiles) {
    const version = packageVersion(rootDir, packageFile);
    if (version) return version;
  }

  return null;
}

function collectEvidence(rootDir: string): Record<string, string[]> {
  const evidence: Record<string, string[]> = {};
  const setEvidence = (key: string, paths: string[]) => {
    evidence[key] = paths.filter((relativePath) => fileExists(rootDir, relativePath));
  };

  setEvidence('host_base', [
    'package.json',
    'packages/core/app/package.json',
    'packages/core/server/package.json',
    'packages/presets/nocobase/package.json',
  ]);
  setEvidence('app', [
    'packages/core/app/src/index.ts',
    'packages/core/server/src/application.ts',
    'packages/core/server/src/plugin.ts',
  ]);
  setEvidence('db', [
    'packages/core/database/src/database.ts',
    'packages/core/database/src/repository.ts',
    'packages/core/app/src/config/database.ts',
  ]);
  setEvidence('logger', ['packages/core/logger/src/index.ts', 'packages/core/app/src/config/logger.ts']);
  setEvidence('storage', [
    'storage',
    'packages/plugins/@nocobase/plugin-file-manager/src/server/storages',
    'packages/plugins/@nocobase/plugin-file-manager/src/server/collections/storages.ts',
  ]);
  setEvidence('plugin_manager', [
    'packages/core/server/src/plugin-manager.ts',
    'packages/core/app/src/config/plugins.ts',
    'packages/plugins/@nocobase/plugin-manager/src/index.ts',
  ]);
  setEvidence('acl', [
    'packages/core/acl/src/acl.ts',
    'packages/plugins/@nocobase/plugin-acl/src/server/index.ts',
    'examples/app/acl.ts',
  ]);
  setEvidence('ui_schema', [
    'packages/plugins/@nocobase/plugin-ui-schema-storage/src/server/index.ts',
    'packages/core/client/src/schema-component',
    'packages/core/client-v2/src',
  ]);
  setEvidence('scheduler', [
    'packages/plugins/@nocobase/plugin-workflow-delay/src/server',
    'packages/core/database/src/sync-runner.ts',
    'packages/core/database/package.json',
  ]);
  setEvidence('workflow', [
    'packages/plugins/@nocobase/plugin-workflow/src/server/index.ts',
    'packages/plugins/@nocobase/plugin-workflow/src/common/collections/workflows.ts',
  ]);
  setEvidence('i18n', [
    'packages/core/server/src/i18n',
    'packages/plugins/@nocobase/plugin-localization/src/index.ts',
    'examples/app/i18n.ts',
  ]);
  setEvidence('collection_manager', [
    'packages/plugins/@nocobase/plugin-collection-manager/src/server/index.ts',
    'packages/plugins/@nocobase/plugin-data-source-main/src/index.ts',
    'packages/core/database/src/collection.ts',
  ]);
  setEvidence('file_storage', [
    'packages/plugins/@nocobase/plugin-file-manager/src/server/index.ts',
    'packages/plugins/@nocobase/plugin-file-manager/src/server/storages',
  ]);
  setEvidence('template_printing', [
    'packages/plugins/@nocobase/plugin-action-print/src/index.ts',
    'packages/plugins/@nocobase/plugin-block-template/src/index.ts',
    'packages/plugins/@nocobase/plugin-file-template/src/index.ts',
  ]);
  setEvidence('postgres', [
    'packages/core/database/src/dialects/postgres-dialect.ts',
    'packages/core/database/src/__tests__/postgres/schema.test.ts',
  ]);

  return evidence;
}

export function detectNocobaseHostEnvironment(options: DetectionOptions = {}): NocobaseHostEnvironmentResult {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const expectedVersion = options.expectedVersion ?? TARGET_VERSION;
  const expectedPackageManager = options.expectedPackageManager ?? EXPECTED_PACKAGE_MANAGER;
  const rootPackage = readJson(rootDir, 'package.json');
  const rootName = getString(rootPackage?.name);
  const targetVersion = detectTargetVersion(rootDir, rootPackage);
  const packageManager = packageManagerName(rootDir, rootPackage);
  const evidence = collectEvidence(rootDir);

  const isNocobaseHost =
    rootName === 'nocobase' &&
    anyPathExists(rootDir, [
      'packages/core/app/package.json',
      'packages/core/server/package.json',
      'packages/core/database/package.json',
      'packages/presets/nocobase/package.json',
    ]);

  const hasApp = evidence.app.length > 0;
  const hasDb = evidence.db.length > 0;
  const hasLogger = evidence.logger.length > 0;
  const hasStorage = evidence.storage.length > 0;
  const hasPluginManager = evidence.plugin_manager.length > 0;
  const hasAcl = evidence.acl.length > 0;
  const hasUiSchema = evidence.ui_schema.length > 0;
  const hasScheduler = evidence.scheduler.length > 0;
  const hasWorkflow = evidence.workflow.length > 0;
  const hasI18n = evidence.i18n.length > 0;
  const hasCollectionManager = evidence.collection_manager.length > 0;
  const hasFileStorage = evidence.file_storage.length > 0;
  const hasTemplatePrinting = evidence.template_printing.length > 0;
  const databaseTarget: 'PostgreSQL' | 'unknown' = evidence.postgres.length > 0 ? 'PostgreSQL' : 'unknown';

  const carRentalPluginsPresent: CarRentalPluginPresence = {
    plugin_rental_core: fileExists(rootDir, 'packages/plugins/plugin-rental-core'),
    plugin_contract_documents: fileExists(rootDir, 'packages/plugins/plugin-contract-documents'),
    plugin_iopgps: fileExists(rootDir, 'packages/plugins/plugin-iopgps'),
  };
  const sharedAutomationPresent = fileExists(rootDir, 'packages/shared/nocobase-automation');

  const capabilityMatrix: Record<string, CapabilityState> = {
    is_nocobase_host: presentWhen(isNocobaseHost),
    target_version_v2_0_61: presentWhen(targetVersion === expectedVersion),
    package_manager_pnpm: presentWhen(packageManager === expectedPackageManager),
    database_target_postgresql: presentWhen(databaseTarget === 'PostgreSQL'),
    app: presentWhen(hasApp),
    db: presentWhen(hasDb),
    logger: presentWhen(hasLogger),
    storage: presentWhen(hasStorage),
    plugin_manager: presentWhen(hasPluginManager),
    acl: presentWhen(hasAcl),
    ui_schema: presentWhen(hasUiSchema),
    scheduler: presentWhen(hasScheduler),
    workflow: presentWhen(hasWorkflow),
    i18n: presentWhen(hasI18n),
    collection_manager: presentWhen(hasCollectionManager),
    file_storage: presentWhen(hasFileStorage),
    template_printing: presentWhen(hasTemplatePrinting),
    car_rental_plugin_rental_core: presentWhen(carRentalPluginsPresent.plugin_rental_core),
    car_rental_plugin_contract_documents: presentWhen(carRentalPluginsPresent.plugin_contract_documents),
    car_rental_plugin_iopgps: presentWhen(carRentalPluginsPresent.plugin_iopgps),
    shared_automation: presentWhen(sharedAutomationPresent),
  };

  const warnings: string[] = [];
  const errors: string[] = [];
  const blockers: string[] = [];
  const nextActions: string[] = [];

  if (!isNocobaseHost) blockers.push('当前目录未检测为完整 NocoBase 宿主工程。');
  if (targetVersion !== expectedVersion)
    blockers.push(`目标版本不是 v${expectedVersion}，当前检测为 ${targetVersion ?? 'unknown'}。`);
  if (packageManager !== expectedPackageManager)
    blockers.push(`包管理器不是 ${expectedPackageManager}，当前检测为 ${packageManager ?? 'unknown'}。`);
  if (!hasDb) blockers.push('未检测到 db / database 能力。');
  if (!hasCollectionManager) blockers.push('未检测到 collection manager / collection repository 能力。');
  if (!sharedAutomationPresent)
    warnings.push(
      '未检测到 packages/shared/nocobase-automation；本轮仅创建宿主检测脚本，后续应复制 shared automation。',
    );
  if (
    !carRentalPluginsPresent.plugin_rental_core ||
    !carRentalPluginsPresent.plugin_contract_documents ||
    !carRentalPluginsPresent.plugin_iopgps
  ) {
    warnings.push('未检测到完整 car-rental 三个插件；后续真实业务 Adapter 前需要复制插件目录。');
  }
  if (databaseTarget !== 'PostgreSQL') warnings.push('未确认 PostgreSQL 目标能力。');

  if (!sharedAutomationPresent)
    nextActions.push('从 car-rental-nocobase 复制 packages/shared/nocobase-automation 到宿主工程对应路径。');
  if (!carRentalPluginsPresent.plugin_rental_core) nextActions.push('复制 packages/plugins/plugin-rental-core。');
  if (!carRentalPluginsPresent.plugin_contract_documents)
    nextActions.push('复制 packages/plugins/plugin-contract-documents。');
  if (!carRentalPluginsPresent.plugin_iopgps) nextActions.push('复制 packages/plugins/plugin-iopgps。');
  if (packageManager !== expectedPackageManager)
    nextActions.push(
      '确认 v2.0.61 宿主工程实际包管理器；当前仓库声明不是 pnpm，真实 Collection Adapter 前需明确执行命令策略。',
    );
  nextActions.push('保持只读检测策略：不读取 .env 密钥、不连接真实数据库、不调用真实 IOPGPS、不写入业务数据。');

  const result: NocobaseHostEnvironmentResult = {
    target_version: targetVersion,
    expected_version: TARGET_VERSION,
    package_manager: packageManager,
    expected_package_manager: EXPECTED_PACKAGE_MANAGER,
    database_target: databaseTarget,
    is_nocobase_host: isNocobaseHost,
    has_app: hasApp,
    has_db: hasDb,
    has_logger: hasLogger,
    has_storage: hasStorage,
    has_plugin_manager: hasPluginManager,
    has_acl: hasAcl,
    has_ui_schema: hasUiSchema,
    has_scheduler: hasScheduler,
    has_workflow: hasWorkflow,
    has_i18n: hasI18n,
    has_collection_manager: hasCollectionManager,
    has_file_storage: hasFileStorage,
    has_template_printing: hasTemplatePrinting,
    car_rental_plugins_present: carRentalPluginsPresent,
    shared_automation_present: sharedAutomationPresent,
    capability_matrix: capabilityMatrix,
    evidence,
    warnings,
    errors,
    blockers,
    next_actions: nextActions,
    safety: {
      reads_env_file: false,
      connects_database: false,
      calls_iopgps: false,
      writes_business_data: false,
    },
  };

  return { ...result, ...options.overrides };
}

export function summarizeNocobaseHostEnvironment(result: NocobaseHostEnvironmentResult): string {
  const line = (label: string, ok: boolean, detail = '') =>
    `${ok ? '✅' : '❌'} ${label}${detail ? `：${detail}` : ''}`;
  const pluginPresence = result.car_rental_plugins_present;
  const lines = [
    'NocoBase v2.0.61 真实环境检测 Adapter 摘要',
    line('完整 NocoBase 宿主工程', result.is_nocobase_host),
    line('目标版本 v2.0.61', result.target_version === result.expected_version, result.target_version ?? 'unknown'),
    line(
      '包管理器 pnpm',
      result.package_manager === result.expected_package_manager,
      result.package_manager ?? 'unknown',
    ),
    line('数据库目标 PostgreSQL', result.database_target === 'PostgreSQL', result.database_target),
    line('App 能力', result.has_app),
    line('DB / Database 能力', result.has_db),
    line('Logger 能力', result.has_logger),
    line('Storage 能力', result.has_storage),
    line('Plugin Manager 能力', result.has_plugin_manager),
    line('ACL / 权限能力', result.has_acl),
    line('UI Schema / 页面配置能力', result.has_ui_schema),
    line('Scheduler 能力', result.has_scheduler),
    line('Workflow 能力', result.has_workflow),
    line('i18n 能力', result.has_i18n),
    line('Collection Manager / Repository 能力', result.has_collection_manager),
    line('File Storage 能力', result.has_file_storage),
    line('Template Print / 文件生成能力', result.has_template_printing),
    line('plugin-rental-core 已复制', pluginPresence.plugin_rental_core),
    line('plugin-contract-documents 已复制', pluginPresence.plugin_contract_documents),
    line('plugin-iopgps 已复制', pluginPresence.plugin_iopgps),
    line('shared automation 已复制', result.shared_automation_present),
    `阻塞项数量：${result.blockers.length}`,
    ...result.blockers.map((blocker) => `- 阻塞：${blocker}`),
    ...result.warnings.map((warning) => `- 警告：${warning}`),
    ...result.next_actions.map((action) => `- 下一步：${action}`),
  ];
  return lines.join('\n');
}

export function assertCanStartRealCollectionAdapter(result: NocobaseHostEnvironmentResult): void {
  const failures: string[] = [];
  if (!result.is_nocobase_host) failures.push('不是完整 NocoBase 宿主工程。');
  if (result.target_version !== result.expected_version) failures.push(`目标版本不是 v${result.expected_version}。`);
  if (!result.has_db) failures.push('缺少 db / database 能力。');
  if (!result.has_collection_manager) failures.push('缺少 collection manager / collection repository 能力。');
  if (
    !result.car_rental_plugins_present.plugin_rental_core ||
    !result.car_rental_plugins_present.plugin_contract_documents ||
    !result.car_rental_plugins_present.plugin_iopgps
  ) {
    failures.push('car-rental 三个插件尚未完整复制到宿主工程。');
  }
  if (!result.shared_automation_present) failures.push('shared automation 尚未复制到宿主工程。');
  if (
    result.safety.reads_env_file ||
    result.safety.connects_database ||
    result.safety.calls_iopgps ||
    result.safety.writes_business_data
  ) {
    failures.push('检测过程违反安全约束：不得读取 .env 密钥、连接真实库、调用真实 IOPGPS 或写入业务数据。');
  }
  if (failures.length > 0) {
    throw new Error(
      `暂不能进入真实 Collection Adapter 实现：\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
    );
  }
}
