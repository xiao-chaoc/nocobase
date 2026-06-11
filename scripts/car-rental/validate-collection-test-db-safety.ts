import * as fs from 'node:fs';
import * as path from 'node:path';

export interface CollectionTestDbSafetyResult {
  valid: boolean;
  checks: string[];
  blockers: string[];
  warnings: string[];
  envFile: string;
  backupDir: string;
  safety: {
    readsEnvFile: true;
    outputsSecretValues: false;
    connectsDatabase: false;
    writesDatabase: false;
    createsCollection: false;
    runsMigration: false;
    callsIopgps: false;
  };
}

export const COLLECTION_TEST_ENV_FILE = '.env.car-rental-collection-test';
export const COLLECTION_TEST_EXAMPLE_ENV_FILE = '.env.car-rental-collection-test.example';
export const COLLECTION_TEST_BACKUP_DIR = 'backups-test/car-rental';

const REQUIRED_SAFETY_LABEL = 'isolated_test_database';
const TEST_DATABASE_MARKER = /(test|car_rental|collection_test)/i;
const PRODUCTION_DATABASE_MARKER = /(prod|production|live)/i;

function makeSafety(): CollectionTestDbSafetyResult['safety'] {
  return {
    readsEnvFile: true,
    outputsSecretValues: false,
    connectsDatabase: false,
    writesDatabase: false,
    createsCollection: false,
    runsMigration: false,
    callsIopgps: false,
  };
}

function stripOptionalQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '').trim();
}

export function parseSimpleEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = stripOptionalQuotes(trimmed.slice(separatorIndex + 1));
    env[key] = value;
  }
  return env;
}

function checkEquals(
  env: Record<string, string>,
  key: string,
  expected: string,
  checks: string[],
  blockers: string[],
): void {
  if (env[key] === expected) {
    checks.push(`✅ ${key}=${expected}`);
  } else {
    blockers.push(`${key} 必须是 ${expected}。`);
  }
}

export function validateCollectionTestDbSafety(rootDir = process.cwd()): CollectionTestDbSafetyResult {
  const envFile = path.join(rootDir, COLLECTION_TEST_ENV_FILE);
  const backupDir = path.join(rootDir, COLLECTION_TEST_BACKUP_DIR);
  const checks: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(envFile)) {
    blockers.push(
      `${COLLECTION_TEST_ENV_FILE} 不存在；请先从 ${COLLECTION_TEST_EXAMPLE_ENV_FILE} 复制并只填写测试占位配置。`,
    );
    return {
      valid: false,
      checks,
      blockers,
      warnings,
      envFile: COLLECTION_TEST_ENV_FILE,
      backupDir: COLLECTION_TEST_BACKUP_DIR,
      safety: makeSafety(),
    };
  }

  const env = parseSimpleEnvFile(envFile);
  const dialect = env.DB_DIALECT?.toLowerCase();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    checks.push('✅ DB_DIALECT 是 postgres/postgresql。');
  } else {
    blockers.push('DB_DIALECT 必须是 postgres 或 postgresql。');
  }

  const database = env.DB_DATABASE ?? '';
  if (TEST_DATABASE_MARKER.test(database)) {
    checks.push('✅ DB_DATABASE 包含 test/car_rental/collection_test 测试标识。');
  } else {
    blockers.push('DB_DATABASE 必须包含 test、car_rental 或 collection_test 测试标识。');
  }
  if (PRODUCTION_DATABASE_MARKER.test(database)) {
    blockers.push('DB_DATABASE 不得包含 prod、production 或 live 生产特征。');
  }

  checkEquals(env, 'CAR_RENTAL_DATABASE_SAFETY_LABEL', REQUIRED_SAFETY_LABEL, checks, blockers);
  checkEquals(env, 'CAR_RENTAL_MOCK_DATA_ONLY', 'true', checks, blockers);
  checkEquals(env, 'IOPGPS_SYNC_ENABLED', 'false', checks, blockers);
  if (env.CAR_RENTAL_COLLECTION_EXECUTE_ENABLED === 'false') {
    checks.push('✅ CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false（env 文件默认安全）。');
  } else if (process.env.CAR_RENTAL_COLLECTION_EXECUTE_ENABLED === 'true') {
    checks.push('✅ CAR_RENTAL_COLLECTION_EXECUTE_ENABLED 由运行时命令显式授权为 true。');
  } else {
    blockers.push('CAR_RENTAL_COLLECTION_EXECUTE_ENABLED 在 env 文件中必须是 false，或由运行时命令显式授权为 true。');
  }

  if (fs.existsSync(backupDir)) {
    checks.push(`✅ ${COLLECTION_TEST_BACKUP_DIR} 已存在。`);
  } else {
    warnings.push(`${COLLECTION_TEST_BACKUP_DIR} 不存在；运行 backup-collection-test-db.sh 时会创建该目录。`);
  }

  warnings.push('本校验脚本不输出数据库密码，不连接数据库，不写数据库，不创建 Collection，不执行 migration。');

  return {
    valid: blockers.length === 0,
    checks,
    blockers,
    warnings,
    envFile: COLLECTION_TEST_ENV_FILE,
    backupDir: COLLECTION_TEST_BACKUP_DIR,
    safety: makeSafety(),
  };
}

function main(): void {
  const result = validateCollectionTestDbSafety();
  for (const check of result.checks) console.log(check);
  for (const warning of result.warnings) console.log(`⚠️ ${warning}`);
  if (result.blockers.length > 0) {
    console.error('隔离 PostgreSQL 测试库安全校验未通过：');
    for (const blocker of result.blockers) console.error(`- ${blocker}`);
    process.exitCode = 1;
    return;
  }
  console.log('隔离 PostgreSQL 测试库安全校验通过；仍未连接数据库、未写库、未创建 Collection。');
}

if (require.main === module) {
  main();
}
