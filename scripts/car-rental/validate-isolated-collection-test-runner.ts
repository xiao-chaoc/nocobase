import * as fs from 'node:fs';
import * as path from 'node:path';

const RUNNER_PATH = 'scripts/car-rental/run-isolated-collection-registration-test.sh';
const DOC_PATH = 'docs/car-rental-isolated-collection-registration-test.md';

interface ValidationResult {
  valid: boolean;
  blockers: string[];
  checkedFiles: string[];
  safety: {
    readsEnvFile: false;
    connectsDatabase: false;
    writesDatabase: false;
    createsCollection: false;
    runsMigration: false;
    callsIopgps: false;
  };
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.resolve(relativePath));
}

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

function requireSnippet(blockers: string[], content: string, snippet: string, label: string): void {
  if (!content.includes(snippet)) blockers.push(`${label} 缺少必需内容：${snippet}`);
}

export function validateIsolatedCollectionTestRunner(): ValidationResult {
  const blockers: string[] = [];
  if (!exists(RUNNER_PATH)) blockers.push(`run-isolated script 不存在：${RUNNER_PATH}`);
  if (!exists(DOC_PATH)) blockers.push(`文档不存在：${DOC_PATH}`);

  const runner = exists(RUNNER_PATH) ? read(RUNNER_PATH) : '';
  const doc = exists(DOC_PATH) ? read(DOC_PATH) : '';

  for (const snippet of [
    'docker compose',
    'backup-collection-test-db.sh',
    'validate-real-collection-execute-request.ts',
    'apply-real-collection-execute-request.ts',
    'preflight-real-collection-execute.ts',
    'execute-real-collection-registration.ts',
    'post-validate-real-collection-registration.ts',
    'IOPGPS_SYNC_ENABLED',
    'CAR_RENTAL_MOCK_DATA_ONLY',
    'isolated_test_database',
    '--execute',
    '--confirm-real-collection-execute',
  ]) {
    requireSnippet(blockers, runner, snippet, RUNNER_PATH);
  }

  for (const forbidden of ['DB_PASSWORD', 'APP_KEY', 'IOPGPS_LOGIN_KEY']) {
    if (runner.includes(forbidden)) blockers.push(`${RUNNER_PATH} 不得包含或输出 ${forbidden}。`);
  }

  for (const snippet of [
    'prepare-only',
    'Docker 隔离不等于数据库安全',
    '不提交 `.env.car-rental-collection-test`',
    '不提交 backup dump',
    '不提交 filled request',
  ]) {
    requireSnippet(blockers, doc, snippet, DOC_PATH);
  }

  return {
    valid: blockers.length === 0,
    blockers,
    checkedFiles: [RUNNER_PATH, DOC_PATH].filter(exists),
    safety: {
      readsEnvFile: false,
      connectsDatabase: false,
      writesDatabase: false,
      createsCollection: false,
      runsMigration: false,
      callsIopgps: false,
    },
  };
}

function main(): void {
  const result = validateIsolatedCollectionTestRunner();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) {
  main();
}
