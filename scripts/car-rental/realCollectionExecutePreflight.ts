import * as fs from 'node:fs';
import * as path from 'node:path';

export interface RealCollectionExecutePreflightContext {
  targetVersion: string | null;
  packageManager: string | null;
  databaseDialect: string | null;
  databaseSafetyLabel: 'isolated_test_confirmed' | 'production_like' | 'unconfirmed';
  isPostgreSQL: boolean;
  isIsolatedDatabase: boolean;
  isProductionLikeDatabase: boolean;
  hasBackupPlan: boolean;
  hasRollbackPlan: boolean;
  iopgpsRealSyncAllowed: boolean;
  mockDataOnly: boolean;
  collectionPlanExists: boolean;
  hostEnvironmentReportExists: boolean;
  realCollectionPlanExists: boolean;
  executeExplicitlyAllowed: boolean;
  warnings: string[];
  errors: string[];
  blockers: string[];
  nextActions: string[];
  safety: {
    readsEnvFile: false;
    outputsSecretValues: false;
    connectsDatabase: false;
    writesDatabase: false;
    createsCollection: false;
    runsMigration: false;
    callsIopgps: false;
    allowsRealExecuteThisRound: false;
  };
  manualConfirmationRequired: true;
  executeFlagRequired: true;
}

export interface RealCollectionExecutePreflightValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  blockers: string[];
  nextActions: string[];
  realExecutionAllowedThisRound: false;
}

export interface BuildRealCollectionExecutePreflightOptions {
  rootDir?: string;
  env?: Record<string, string | undefined>;
  overrides?: Partial<RealCollectionExecutePreflightContext>;
}

type JsonObject = Record<string, unknown>;

const TARGET_VERSION = '2.0.61';
const PACKAGE_MANAGER = 'yarn';

const HOST_ENVIRONMENT_REPORT_PATH = 'test-data/generated/real-host-environment-report.generated.json';
const REAL_COLLECTION_PLAN_PATH = 'test-data/generated/real-collection-adapter-plan.generated.json';
const COLLECTION_PLAN_PATH = 'docs/car-rental-real-collection-adapter-plan.md';

function fileExists(rootDir: string, relativePath: string): boolean {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function readJson(rootDir: string, relativePath: string): JsonObject | null {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as JsonObject;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizedPackageManager(value: string | null): string | null {
  if (!value) return null;
  return value.split('@')[0] || value;
}

function booleanFlag(value: string | undefined): boolean {
  return value === 'true' || value === '1' || value === 'yes';
}

function detectPackageManager(rootDir: string, rootPackage: JsonObject | null): string | null {
  const declared = normalizedPackageManager(getString(rootPackage?.packageManager));
  if (declared) return declared;
  if (fileExists(rootDir, 'yarn.lock')) return 'yarn';
  if (fileExists(rootDir, 'pnpm-lock.yaml')) return 'pnpm';
  if (fileExists(rootDir, 'package-lock.json')) return 'npm';
  return null;
}

function detectTargetVersion(
  rootDir: string,
  rootPackage: JsonObject | null,
  hostReport: JsonObject | null,
): string | null {
  return (
    getString(hostReport?.target_version) ??
    getString(hostReport?.targetVersion) ??
    getString(rootPackage?.version) ??
    getString(readJson(rootDir, 'packages/core/app/package.json')?.version) ??
    getString(readJson(rootDir, 'packages/core/server/package.json')?.version) ??
    getString(readJson(rootDir, 'packages/core/database/package.json')?.version)
  );
}

function detectDatabaseSafetyLabel(
  isIsolatedDatabase: boolean,
  isProductionLikeDatabase: boolean,
): RealCollectionExecutePreflightContext['databaseSafetyLabel'] {
  if (isProductionLikeDatabase) return 'production_like';
  if (isIsolatedDatabase) return 'isolated_test_confirmed';
  return 'unconfirmed';
}

export function buildRealCollectionExecutePreflightContext(
  options: BuildRealCollectionExecutePreflightOptions = {},
): RealCollectionExecutePreflightContext {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const env = options.env ?? process.env;
  const rootPackage = readJson(rootDir, 'package.json');
  const hostReport = readJson(rootDir, HOST_ENVIRONMENT_REPORT_PATH);
  const realCollectionPlan = readJson(rootDir, REAL_COLLECTION_PLAN_PATH);
  const databaseDialect = getString(env.DB_DIALECT) ?? getString(env.DATABASE_DIALECT) ?? null;
  const normalizedDialect = databaseDialect?.toLowerCase() ?? null;
  const isPostgreSQL = normalizedDialect === 'postgres' || normalizedDialect === 'postgresql';
  const isIsolatedDatabase = booleanFlag(env.CAR_RENTAL_ISOLATED_DATABASE_CONFIRMED);
  const isProductionLikeDatabase = booleanFlag(env.CAR_RENTAL_PRODUCTION_DATABASE) || env.NODE_ENV === 'production';
  const executeExplicitlyAllowed = booleanFlag(env.CAR_RENTAL_ALLOW_REAL_COLLECTION_EXECUTE);

  const context: RealCollectionExecutePreflightContext = {
    targetVersion: detectTargetVersion(rootDir, rootPackage, hostReport),
    packageManager: detectPackageManager(rootDir, rootPackage),
    databaseDialect: normalizedDialect,
    databaseSafetyLabel: detectDatabaseSafetyLabel(isIsolatedDatabase, isProductionLikeDatabase),
    isPostgreSQL,
    isIsolatedDatabase,
    isProductionLikeDatabase,
    hasBackupPlan: booleanFlag(env.CAR_RENTAL_BACKUP_PLAN_CONFIRMED),
    hasRollbackPlan: booleanFlag(env.CAR_RENTAL_ROLLBACK_PLAN_CONFIRMED),
    iopgpsRealSyncAllowed: booleanFlag(env.IOPGPS_SYNC_ENABLED),
    mockDataOnly: booleanFlag(env.CAR_RENTAL_MOCK_DATA_ONLY),
    collectionPlanExists:
      fileExists(rootDir, COLLECTION_PLAN_PATH) &&
      fileExists(rootDir, 'packages/plugins/plugin-rental-core/src/server/collections'),
    hostEnvironmentReportExists: hostReport !== null,
    realCollectionPlanExists:
      realCollectionPlan !== null &&
      realCollectionPlan.executed === false &&
      realCollectionPlan.writesDatabase === false &&
      realCollectionPlan.createsCollection === false &&
      realCollectionPlan.runsMigration === false,
    executeExplicitlyAllowed,
    warnings: [],
    errors: [],
    blockers: [],
    nextActions: [],
    safety: {
      readsEnvFile: false,
      outputsSecretValues: false,
      connectsDatabase: false,
      writesDatabase: false,
      createsCollection: false,
      runsMigration: false,
      callsIopgps: false,
      allowsRealExecuteThisRound: false,
    },
    manualConfirmationRequired: true,
    executeFlagRequired: true,
  };

  const mergedContext = { ...context, ...options.overrides };
  const validation = validateRealCollectionExecutePreflight(mergedContext);
  return {
    ...mergedContext,
    warnings: validation.warnings,
    errors: validation.errors,
    blockers: validation.blockers,
    nextActions: validation.nextActions,
  };
}

export function validateRealCollectionExecutePreflight(
  context: RealCollectionExecutePreflightContext,
): RealCollectionExecutePreflightValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const blockers: string[] = [];
  const nextActions: string[] = [];

  const addBlocker = (message: string, nextAction: string) => {
    blockers.push(message);
    nextActions.push(nextAction);
  };

  if (context.targetVersion !== TARGET_VERSION) {
    addBlocker(`当前 NocoBase 版本不是 ${TARGET_VERSION}。`, `确认宿主工程版本为 ${TARGET_VERSION} 后再申请 execute。`);
  }
  if (context.packageManager !== PACKAGE_MANAGER) {
    addBlocker('当前包管理器不是 yarn。', '使用 yarn 宿主工程和 yarn 命令运行下一阶段。');
  }
  if (!context.isPostgreSQL) {
    addBlocker(
      '数据库类型未明确为 postgres / postgresql。',
      '在隔离测试库环境中明确 DB_DIALECT=postgres 或 postgresql。',
    );
  }
  if (!context.isIsolatedDatabase) {
    addBlocker('未明确确认当前数据库是隔离测试库。', '设置隔离测试库确认门禁，并由人工确认目标库不是生产库。');
  }
  if (context.isProductionLikeDatabase) {
    addBlocker(
      '当前数据库被标识为生产或类生产库。',
      '切换到隔离 PostgreSQL 测试库，生产库严禁执行真实 Collection 注册。',
    );
  }
  if (!context.hasBackupPlan) {
    addBlocker('未确认数据库备份计划。', '先完成数据库备份计划并记录备份 artifact。');
  }
  if (!context.hasRollbackPlan) {
    addBlocker('未确认回滚计划。', '先验证并记录可执行的回滚命令或回滚流程。');
  }
  if (context.iopgpsRealSyncAllowed) {
    addBlocker('IOPGPS 真实同步未禁用。', '确认 IOPGPS 同步开关保持关闭，下一阶段不得调用真实 IOPGPS。');
  }
  if (!context.mockDataOnly) {
    addBlocker('未确认只允许 mock 数据。', '确认仅使用 mock 数据，不使用真实司机资料、付款截图或合同扫描件。');
  }
  if (!context.collectionPlanExists) {
    addBlocker(
      '未检测到最小 Collection plan 或插件 collections 草案。',
      '先恢复 car-rental 最小 Collection plan 和 plugin-rental-core collections。',
    );
  }
  if (!context.hostEnvironmentReportExists) {
    addBlocker('未检测到真实宿主环境报告。', '先生成并审阅 real host environment report。');
  }
  if (!context.realCollectionPlanExists) {
    addBlocker(
      '未检测到安全的真实 Collection adapter plan。',
      '先生成并审阅 executed=false 的 real collection adapter plan。',
    );
  }

  if (context.executeExplicitlyAllowed) {
    addBlocker(
      '本轮检测到 execute 显式允许门禁，但当前任务禁止真实执行。',
      '另起 PR，并同时提供人工确认清单和 --execute 后才可申请真实 execute。',
    );
  } else {
    warnings.push('execute 显式允许门禁保持关闭；这是本轮预期状态。');
    nextActions.push('如需进入真实 execute，必须另起 PR，并提供人工确认清单、--execute 和执行信息。');
  }

  warnings.push('本轮 preflight 不读取 .env、不连接数据库、不创建 Collection、不执行 migration、不调用 IOPGPS。');

  return {
    valid: blockers.length === 0,
    warnings,
    errors,
    blockers,
    nextActions: Array.from(new Set(nextActions)),
    realExecutionAllowedThisRound: false,
  };
}

export function summarizeRealCollectionExecutePreflight(context: RealCollectionExecutePreflightContext): string {
  const line = (label: string, ok: boolean, detail = '') =>
    `${ok ? '✅' : '❌'} ${label}${detail ? `：${detail}` : ''}`;
  return [
    'car-rental 真实 Collection execute preflight 摘要',
    line('NocoBase 版本 2.0.61', context.targetVersion === TARGET_VERSION, context.targetVersion ?? 'unknown'),
    line('包管理器 yarn', context.packageManager === PACKAGE_MANAGER, context.packageManager ?? 'unknown'),
    line('数据库类型 PostgreSQL', context.isPostgreSQL, context.databaseDialect ?? 'unknown'),
    line('隔离测试库已确认', context.isIsolatedDatabase, context.databaseSafetyLabel),
    line('不是生产/类生产库', !context.isProductionLikeDatabase),
    line('备份计划已确认', context.hasBackupPlan),
    line('回滚计划已确认', context.hasRollbackPlan),
    line('IOPGPS 真实同步已禁用', !context.iopgpsRealSyncAllowed),
    line('只允许 mock 数据', context.mockDataOnly),
    line('最小 Collection plan 存在', context.collectionPlanExists),
    line('真实宿主环境报告存在', context.hostEnvironmentReportExists),
    line('真实 Collection adapter plan 存在且未执行', context.realCollectionPlanExists),
    line('execute 显式允许门禁关闭', !context.executeExplicitlyAllowed),
    `阻塞项数量：${context.blockers.length}`,
    ...context.blockers.map((blocker) => `- 阻塞：${blocker}`),
    ...context.warnings.map((warning) => `- 警告：${warning}`),
    ...context.nextActions.map((action) => `- 下一步：${action}`),
  ].join('\n');
}
