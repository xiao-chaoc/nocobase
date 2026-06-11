import * as fs from 'node:fs';
import * as path from 'node:path';
import { MINIMAL_COLLECTION_SCOPE } from './validate-real-collection-execute-request';

const DEFAULT_REQUEST_PATH = 'test-data/generated/real-collection-execute-request.filled.json';
const DEFAULT_PREFLIGHT_PATH = 'test-data/generated/real-collection-execute-preflight.generated.json';
const DEFAULT_BACKUP_PATH = 'backups-test/car-rental/pre-real-collection-register-20260610-235309.dump';
const DEFAULT_MODE = 'dry-run';

interface ExecuteOptions {
  requestPath: string;
  preflightPath: string;
  backupPath: string;
  execute: boolean;
  confirmRealCollectionExecute: boolean;
  runtimeAllowRealExecution: boolean;
}

interface ExecuteRequestForGate {
  allow_real_execution?: unknown;
  database_dialect?: unknown;
  is_isolated_database?: unknown;
  is_production_like_database?: unknown;
  iopgps_real_sync_allowed?: unknown;
  mock_data_only?: unknown;
  collection_scope?: unknown;
  backup_artifact_reference?: unknown;
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
  mode: 'dry-run';
  writesDatabase: false;
  createsCollection: false;
  runsMigration: false;
  readsEnvFile: false;
  requestPath: string;
  preflightPath: string;
  backupPath: string;
  collectionScope: readonly string[];
  nextStep: string;
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
    blockers.push('使用 --execute 时必须同时提供 --runtime-allow-real-execution，本地运行时授权文件或参数不得提交。');
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
  if (request.allow_real_execution === false && options.execute && !options.runtimeAllowRealExecution) {
    blockers.push('request 中 allow_real_execution=false 时，必须提供运行时授权参数。');
  }
  if (request.database_dialect !== 'postgresql') blockers.push('database_dialect 必须是 postgresql。');
  if (request.is_isolated_database !== true) blockers.push('is_isolated_database 必须是 true。');
  if (request.is_production_like_database !== false) blockers.push('is_production_like_database 必须是 false。');
  if (request.iopgps_real_sync_allowed !== false) blockers.push('iopgps_real_sync_allowed 必须是 false。');
  if (request.mock_data_only !== true) blockers.push('mock_data_only 必须是 true。');
  if (!hasOnlyMinimalCollectionScope(request.collection_scope)) {
    blockers.push('collection_scope 只能包含最小 8 个 Collection。');
  }
  if (request.backup_artifact_reference !== undefined && request.backup_artifact_reference !== options.backupPath) {
    blockers.push('request 中的 backup_artifact_reference 必须与 --backup 一致。');
  }

  return { request, preflight, blockers };
}

function buildDryRunPlan(options: ExecuteOptions): DryRunPlan {
  return {
    mode: DEFAULT_MODE,
    writesDatabase: false,
    createsCollection: false,
    runsMigration: false,
    readsEnvFile: false,
    requestPath: options.requestPath,
    preflightPath: options.preflightPath,
    backupPath: options.backupPath,
    collectionScope: MINIMAL_COLLECTION_SCOPE,
    nextStep:
      '本轮只输出 dry-run plan；真实隔离测试 execute 必须由 run-isolated 脚本提供 --execute、--confirm-real-collection-execute 和 --runtime-allow-real-execution。',
  };
}

export async function registerCollectionsForReal(): Promise<never> {
  throw new Error(
    'pending_real_api_verification: 真实 NocoBase Collection 注册 API 尚未在本脚本中验证，禁止伪造成功。',
  );
}

export async function runControlledRealCollectionRegistration(args: string[]): Promise<DryRunPlan | never> {
  const options = parseArgs(args);
  const gateResult = validateExecutionGates(options);
  if (gateResult.blockers.length > 0) {
    throw new Error(`execute 门禁失败：\n${gateResult.blockers.map((blocker) => `- ${blocker}`).join('\n')}`);
  }

  if (!options.execute) {
    return buildDryRunPlan(options);
  }

  return registerCollectionsForReal();
}

async function main(): Promise<void> {
  try {
    const plan = await runControlledRealCollectionRegistration(process.argv.slice(2));
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(plan, null, 2));
    // eslint-disable-next-line no-console
    console.log('dry-run 完成：未写数据库、未创建 Collection、未执行 migration、未读取 .env、未输出 secret。');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
