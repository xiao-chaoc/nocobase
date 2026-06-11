import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  depositRecordsCollectionDraft,
  driversCollectionDraft,
  leaseContractsCollectionDraft,
  operationLogsCollectionDraft,
  rentDailyLedgersCollectionDraft,
  rentPaymentAllocationsCollectionDraft,
  rentPaymentsCollectionDraft,
  vehiclesCollectionDraft,
} from '../../packages/plugins/plugin-rental-core/src/server/collections';
import {
  executeRealCollectionRegistration,
  makeRealCollectionSchemaDraftFromPluginDraft,
  type RealCollectionExecutionGateContext,
  type RealCollectionRegistrationResult,
} from './realNocobaseCollectionAdapter';
import { MINIMAL_COLLECTION_SCOPE } from './validate-real-collection-execute-request';

const DEFAULT_REQUEST_PATH = 'test-data/generated/real-collection-execute-request.filled.json';
const DEFAULT_PREFLIGHT_PATH = 'test-data/generated/real-collection-execute-preflight.generated.json';
const DEFAULT_BACKUP_PATH = 'backups-test/car-rental/pre-real-collection-register-20260610-235309.dump';
const DEFAULT_OUTPUT_PATH = 'test-data/generated/real-collection-execute-result.generated.json';
const DEFAULT_MODE = 'dry-run';

interface ExecuteOptions {
  requestPath: string;
  preflightPath: string;
  backupPath: string;
  outputPath: string;
  execute: boolean;
  confirmRealCollectionExecute: boolean;
  runtimeAllowRealExecution: boolean;
}

interface ExecuteRequestForGate {
  allow_real_execution?: unknown;
  target_version?: unknown;
  package_manager?: unknown;
  database_dialect?: unknown;
  database_safety_label?: unknown;
  is_isolated_database?: unknown;
  is_production_like_database?: unknown;
  backup_plan_confirmed?: unknown;
  iopgps_real_sync_allowed?: unknown;
  mock_data_only?: unknown;
  collection_scope?: unknown;
  backup_artifact_reference?: unknown;
  rollback_command_reference?: unknown;
}

interface PreflightForGate {
  context?: {
    blockers?: unknown;
  };
  validation?: {
    blockers?: unknown;
  };
  blockers?: unknown;
}

interface GateResult {
  request: ExecuteRequestForGate;
  preflight: PreflightForGate;
  blockers: string[];
}

interface DryRunPlan {
  generated_at: string;
  mode: 'dry-run';
  writesDatabase: false;
  createsCollection: false;
  runsMigration: false;
  readsEnvFile: false;
  requestPath: string;
  preflightPath: string;
  backupPath: string;
  outputPath: string;
  collectionScope: readonly string[];
  production_ready: false;
  rollback_command_reference: string;
  nextStep: string;
}

interface ExecuteReport {
  generated_at: string;
  mode: 'execute';
  production_ready: false;
  rollback_command_reference: string;
  result: RealCollectionRegistrationResult;
}

function getArgValue(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  return args[index + 1] ?? '';
}

function parseArgs(args: string[]): ExecuteOptions {
  return {
    requestPath: getArgValue(args, '--request', DEFAULT_REQUEST_PATH),
    preflightPath: getArgValue(args, '--preflight', DEFAULT_PREFLIGHT_PATH),
    backupPath: getArgValue(args, '--backup', DEFAULT_BACKUP_PATH),
    outputPath: getArgValue(args, '--output', DEFAULT_OUTPUT_PATH),
    execute: args.includes('--execute'),
    confirmRealCollectionExecute: args.includes('--confirm-real-collection-execute'),
    runtimeAllowRealExecution: args.includes('--runtime-allow-real-execution'),
  };
}

function readJsonObject<T>(filePath: string): T {
  const absolutePath = path.resolve(filePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function ensureFileExists(filePath: string, label: string, blockers: string[]): void {
  if (!filePath || !fs.existsSync(path.resolve(filePath))) {
    blockers.push(`${label} 文件不存在：${filePath || '<empty>'}`);
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function hasOnlyMinimalCollectionScope(value: unknown): boolean {
  const expected = [...MINIMAL_COLLECTION_SCOPE].sort();
  const actual = asStringArray(value).sort();
  return actual.length === expected.length && actual.every((item, index) => item === expected[index]);
}

function collectPreflightBlockers(preflight: PreflightForGate): string[] {
  return [
    ...asStringArray(preflight.blockers),
    ...asStringArray(preflight.context?.blockers),
    ...asStringArray(preflight.validation?.blockers),
  ];
}

function validateExecutionGates(options: ExecuteOptions): GateResult {
  const blockers: string[] = [];
  ensureFileExists(options.requestPath, 'request', blockers);
  ensureFileExists(options.preflightPath, 'preflight', blockers);
  ensureFileExists(options.backupPath, 'backup', blockers);

  if (options.execute && !options.confirmRealCollectionExecute) {
    blockers.push('使用 --execute 时必须同时提供 --confirm-real-collection-execute。');
  }
  if (options.execute && !options.runtimeAllowRealExecution) {
    blockers.push('使用 --execute 时必须同时提供 --runtime-allow-real-execution，本地运行时授权参数不得提交。');
  }

  let request: ExecuteRequestForGate = {};
  let preflight: PreflightForGate = {};

  if (fs.existsSync(path.resolve(options.requestPath))) {
    request = readJsonObject<ExecuteRequestForGate>(options.requestPath);
  }
  if (fs.existsSync(path.resolve(options.preflightPath))) {
    preflight = readJsonObject<PreflightForGate>(options.preflightPath);
    const preflightBlockers = collectPreflightBlockers(preflight);
    if (preflightBlockers.length > 0) {
      blockers.push(`preflight 存在 blockers，禁止 execute：${preflightBlockers.join('；')}`);
    }
  }

  if (request.allow_real_execution !== true && request.allow_real_execution !== false) {
    blockers.push('allow_real_execution 必须是 boolean。');
  }
  if (request.allow_real_execution === true && !options.runtimeAllowRealExecution) {
    blockers.push('不允许单靠 request 文件中的 allow_real_execution=true 执行。');
  }
  if (request.target_version !== '2.0.61') blockers.push('target_version 必须是 2.0.61。');
  if (request.package_manager !== 'yarn') blockers.push('package_manager 必须是 yarn。');
  if (request.database_dialect !== 'postgresql') blockers.push('database_dialect 必须是 postgresql。');
  if (request.database_safety_label !== 'isolated_test_database') {
    blockers.push('database_safety_label 必须是 isolated_test_database。');
  }
  if (request.is_isolated_database !== true) blockers.push('is_isolated_database 必须是 true。');
  if (request.is_production_like_database !== false) blockers.push('is_production_like_database 必须是 false。');
  if (request.backup_plan_confirmed !== true) blockers.push('backup_plan_confirmed 必须是 true。');
  if (request.iopgps_real_sync_allowed !== false) blockers.push('iopgps_real_sync_allowed 必须是 false。');
  if (request.mock_data_only !== true) blockers.push('mock_data_only 必须是 true。');
  if (!hasOnlyMinimalCollectionScope(request.collection_scope)) {
    blockers.push('collection_scope 只能包含最小 8 个 Collection。');
  }
  if (request.backup_artifact_reference !== undefined && request.backup_artifact_reference !== options.backupPath) {
    blockers.push('request 中的 backup_artifact_reference 必须与 --backup 一致。');
  }
  if (options.execute && process.env.CAR_RENTAL_COLLECTION_EXECUTE_ENABLED !== 'true') {
    blockers.push('CAR_RENTAL_COLLECTION_EXECUTE_ENABLED 必须是 true。');
  }

  return { request, preflight, blockers };
}

function rollbackCommand(backupPath: string, request?: ExecuteRequestForGate): string {
  return typeof request?.rollback_command_reference === 'string'
    ? request.rollback_command_reference
    : `scripts/car-rental/restore-collection-test-db.sh ${backupPath}`;
}

function buildDryRunPlan(options: ExecuteOptions, gateResult?: GateResult): DryRunPlan {
  return {
    generated_at: new Date().toISOString(),
    mode: DEFAULT_MODE,
    writesDatabase: false,
    createsCollection: false,
    runsMigration: false,
    readsEnvFile: false,
    requestPath: options.requestPath,
    preflightPath: options.preflightPath,
    backupPath: options.backupPath,
    outputPath: options.outputPath,
    collectionScope: MINIMAL_COLLECTION_SCOPE,
    production_ready: false,
    rollback_command_reference: rollbackCommand(options.backupPath, gateResult?.request),
    nextStep:
      'dry-run 完成；真实隔离测试 execute 必须由 run-isolated 脚本提供 --execute、--confirm-real-collection-execute 和 --runtime-allow-real-execution。',
  };
}

function writeJsonReport(filePath: string, payload: unknown): void {
  const absoluteOutputPath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function minimalCollectionPlans() {
  return [
    driversCollectionDraft,
    vehiclesCollectionDraft,
    leaseContractsCollectionDraft,
    rentDailyLedgersCollectionDraft,
    rentPaymentsCollectionDraft,
    rentPaymentAllocationsCollectionDraft,
    depositRecordsCollectionDraft,
    operationLogsCollectionDraft,
  ].map((draft) => makeRealCollectionSchemaDraftFromPluginDraft(draft));
}

export async function runControlledRealCollectionRegistration(args: string[]): Promise<DryRunPlan | ExecuteReport> {
  const options = parseArgs(args);
  if (!options.execute) {
    const plan = buildDryRunPlan(options);
    writeJsonReport(options.outputPath, plan);
    return plan;
  }

  const gateResult = validateExecutionGates(options);
  if (gateResult.blockers.length > 0) {
    throw new Error(`execute 门禁失败：\n${gateResult.blockers.map((blocker) => `- ${blocker}`).join('\n')}`);
  }

  const context: RealCollectionExecutionGateContext = {
    mode: 'real',
    allowRealExecution: true,
    backupConfirmed: true,
    isolatedDatabase: true,
    iopgpsDisabled: true,
    mockDataOnly: true,
    targetVersion: '2.0.61',
    packageManager: 'yarn',
    databaseDialect: 'postgresql',
    databaseSafetyLabel: 'isolated_test_database',
    isProductionLikeDatabase: false,
    backupArtifactPath: options.backupPath,
    preflightBlockers: collectPreflightBlockers(gateResult.preflight),
    executeFlag: options.execute,
    confirmRealCollectionExecute: options.confirmRealCollectionExecute,
    runtimeAllowRealExecution: options.runtimeAllowRealExecution,
    envExecuteEnabled: process.env.CAR_RENTAL_COLLECTION_EXECUTE_ENABLED === 'true',
  };
  const result = await executeRealCollectionRegistration(minimalCollectionPlans(), context);
  const report: ExecuteReport = {
    generated_at: new Date().toISOString(),
    mode: 'execute',
    production_ready: false,
    rollback_command_reference: rollbackCommand(options.backupPath, gateResult.request),
    result,
  };
  writeJsonReport(options.outputPath, report);
  if (result.failed.length > 0) {
    throw new Error(`真实 Collection 注册存在失败项：${result.failed.map((item) => item.collectionName).join(', ')}`);
  }
  return report;
}

async function main(): Promise<void> {
  try {
    const report = await runControlledRealCollectionRegistration(process.argv.slice(2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
