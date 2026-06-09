import * as fs from 'node:fs';
import * as path from 'node:path';

export interface RealCollectionExecuteRequest {
  request_status: string;
  target_version: string;
  package_manager: string;
  database_dialect: string;
  database_safety_label: string;
  is_isolated_database: boolean;
  is_production_like_database: boolean;
  backup_plan_confirmed: boolean;
  backup_artifact_reference: string;
  rollback_plan_confirmed: boolean;
  rollback_command_reference: string;
  iopgps_real_sync_allowed: boolean;
  mock_data_only: boolean;
  collection_scope: string[];
  execute_reason: string;
  operator: string;
  requested_at: string;
  execution_window: string;
  dry_run_first: boolean;
  allow_real_execution: boolean;
}

export interface RealCollectionExecuteRequestValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  request: RealCollectionExecuteRequest | null;
  safety: {
    readsEnvFile: false;
    readsEnvTestFile: false;
    connectsNocobase: false;
    writesDatabase: false;
    createsCollection: false;
    runsMigration: false;
    callsIopgps: false;
  };
}

const TARGET_VERSION = '2.0.61';
const PACKAGE_MANAGER = 'yarn';
const DATABASE_DIALECT = 'postgresql';
const DATABASE_SAFETY_LABEL = 'isolated_test_database';

export const MINIMAL_COLLECTION_SCOPE = [
  'drivers',
  'vehicles',
  'lease_contracts',
  'rent_daily_ledgers',
  'rent_payments',
  'rent_payment_allocations',
  'deposit_records',
  'operation_logs',
] as const;

const BLOCKED_SECRET_KEYS = [
  'APP_KEY',
  'DB_PASSWORD',
  'INIT_ROOT_PASSWORD',
  'IOPGPS_LOGIN_KEY',
  'access_token',
  'login_key',
];

function getArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] ?? null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlaceholderString(value: unknown): boolean {
  return typeof value === 'string' && (value.includes('请填写') || value === 'YYYY-MM-DD');
}

function hasOnlyMinimalCollectionScope(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  const expected = [...MINIMAL_COLLECTION_SCOPE].sort();
  const actual = value.filter((item): item is string => typeof item === 'string').sort();
  return actual.length === expected.length && actual.every((item, index) => item === expected[index]);
}

function collectSecretViolations(value: unknown, pathParts: string[] = []): string[] {
  const violations: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => violations.push(...collectSecretViolations(item, [...pathParts, String(index)])));
    return violations;
  }
  if (!isObject(value)) {
    if (typeof value === 'string') {
      for (const secretKey of BLOCKED_SECRET_KEYS) {
        if (value.includes(secretKey))
          violations.push(`字段 ${pathParts.join('.') || '<root>'} 包含禁止的密钥标识 ${secretKey}。`);
      }
    }
    return violations;
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    const currentPath = [...pathParts, key].join('.');
    if (key === 'password' || key.toLowerCase().endsWith('_password') || key.toLowerCase().includes('password')) {
      violations.push(`字段 ${currentPath} 是禁止的 password 字段。`);
    }
    for (const secretKey of BLOCKED_SECRET_KEYS) {
      if (key === secretKey || key.toLowerCase() === secretKey.toLowerCase()) {
        violations.push(`字段 ${currentPath} 使用了禁止的密钥字段名 ${secretKey}。`);
      }
      if (typeof nestedValue === 'string' && nestedValue.includes(secretKey)) {
        violations.push(`字段 ${currentPath} 包含禁止的密钥标识 ${secretKey}。`);
      }
    }
    violations.push(...collectSecretViolations(nestedValue, [...pathParts, key]));
  }
  return violations;
}

function makeSafety(): RealCollectionExecuteRequestValidationResult['safety'] {
  return {
    readsEnvFile: false,
    readsEnvTestFile: false,
    connectsNocobase: false,
    writesDatabase: false,
    createsCollection: false,
    runsMigration: false,
    callsIopgps: false,
  };
}

export function validateRealCollectionExecuteRequestObject(
  value: unknown,
): RealCollectionExecuteRequestValidationResult {
  const blockers: string[] = [];
  if (!isObject(value)) {
    return {
      valid: false,
      blockers: ['execute request 必须是 JSON object。'],
      warnings: [],
      request: null,
      safety: makeSafety(),
    };
  }

  if (value.request_status !== 'pending_manual_confirmation')
    blockers.push('request_status 初始必须是 pending_manual_confirmation。');
  if (value.target_version !== TARGET_VERSION) blockers.push(`target_version 必须是 ${TARGET_VERSION}。`);
  if (value.package_manager !== PACKAGE_MANAGER) blockers.push('package_manager 必须是 yarn。');
  if (value.database_dialect !== DATABASE_DIALECT) blockers.push('database_dialect 必须是 postgresql。');
  if (value.database_safety_label !== DATABASE_SAFETY_LABEL)
    blockers.push('database_safety_label 必须是 isolated_test_database。');
  if (value.is_isolated_database !== true) blockers.push('is_isolated_database 必须是 true。');
  if (value.is_production_like_database !== false) blockers.push('is_production_like_database 必须是 false。');
  if (value.backup_plan_confirmed !== true) blockers.push('backup_plan_confirmed 必须是 true。');
  if (!isNonEmptyString(value.backup_artifact_reference)) blockers.push('backup_artifact_reference 必须非空。');
  if (isPlaceholderString(value.backup_artifact_reference))
    blockers.push('backup_artifact_reference 必须替换模板占位提示。');
  if (value.rollback_plan_confirmed !== true) blockers.push('rollback_plan_confirmed 必须是 true。');
  if (!isNonEmptyString(value.rollback_command_reference)) blockers.push('rollback_command_reference 必须非空。');
  if (isPlaceholderString(value.rollback_command_reference))
    blockers.push('rollback_command_reference 必须替换模板占位提示。');
  if (value.iopgps_real_sync_allowed !== false) blockers.push('iopgps_real_sync_allowed 必须是 false。');
  if (value.mock_data_only !== true) blockers.push('mock_data_only 必须是 true。');
  if (!hasOnlyMinimalCollectionScope(value.collection_scope))
    blockers.push('collection_scope 只能包含最小 8 个 Collection。');
  if (!isNonEmptyString(value.execute_reason)) blockers.push('execute_reason 必须非空。');
  if (isPlaceholderString(value.execute_reason)) blockers.push('execute_reason 必须替换模板占位提示。');
  if (!isNonEmptyString(value.operator)) blockers.push('operator 必须非空。');
  if (isPlaceholderString(value.operator)) blockers.push('operator 必须替换模板占位提示。');
  if (!isNonEmptyString(value.requested_at)) blockers.push('requested_at 必须非空。');
  if (isPlaceholderString(value.requested_at)) blockers.push('requested_at 必须替换模板占位提示。');
  if (!isNonEmptyString(value.execution_window)) blockers.push('execution_window 必须非空。');
  if (isPlaceholderString(value.execution_window)) blockers.push('execution_window 必须替换模板占位提示。');
  if (value.allow_real_execution !== false)
    blockers.push('allow_real_execution 本阶段必须是 false；真实 execute 必须另起 PR。');
  blockers.push(...collectSecretViolations(value));

  return {
    valid: blockers.length === 0,
    blockers,
    warnings: ['校验脚本不读取 .env/.env.test，不连接 NocoBase，不写数据库。'],
    request: blockers.length === 0 ? (value as unknown as RealCollectionExecuteRequest) : null,
    safety: makeSafety(),
  };
}

export function validateRealCollectionExecuteRequestFile(
  filePath: string,
): RealCollectionExecuteRequestValidationResult {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      valid: false,
      blockers: [`execute request 文件不存在：${filePath}`],
      warnings: [],
      request: null,
      safety: makeSafety(),
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as unknown;
    return validateRealCollectionExecuteRequestObject(parsed);
  } catch (error) {
    return {
      valid: false,
      blockers: [`execute request JSON 解析失败：${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
      request: null,
      safety: makeSafety(),
    };
  }
}

export function summarizeRealCollectionExecuteRequestValidation(
  result: RealCollectionExecuteRequestValidationResult,
): string {
  return [
    'car-rental 真实 Collection execute request 校验摘要',
    `校验是否通过：${result.valid}`,
    `阻塞项数量：${result.blockers.length}`,
    ...result.blockers.map((blocker) => `- 阻塞：${blocker}`),
    ...result.warnings.map((warning) => `- 警告：${warning}`),
  ].join('\n');
}

function main(): void {
  const filePath = getArgValue(process.argv.slice(2), '--file');
  if (!filePath) {
    // eslint-disable-next-line no-console
    console.error('请通过 --file 指定 test-data/generated/real-collection-execute-request.filled.json。');
    process.exitCode = 1;
    return;
  }
  const result = validateRealCollectionExecuteRequestFile(filePath);
  // eslint-disable-next-line no-console
  console.log(summarizeRealCollectionExecuteRequestValidation(result));
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) {
  main();
}
