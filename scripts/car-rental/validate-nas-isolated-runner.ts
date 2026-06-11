import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');
const runnerPath = 'scripts/car-rental/run-isolated-collection-registration-test.sh';
const composePath = 'docker-compose.car-rental-collection-test.yml';
const runbookPath = 'docs/car-rental-nas-test-pause-resume-runbook.md';
const isolationPath = 'docs/car-rental-test-vs-production-isolation.md';
const productionPolicyPath = 'docs/car-rental-production-init-policy.md';

interface CheckResult {
  id: string;
  passed: boolean;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  production_ready: false;
  checkedFiles: string[];
  checks: CheckResult[];
  blockers: string[];
}

function resolveRepo(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function exists(relativePath: string): boolean {
  return fs.existsSync(resolveRepo(relativePath));
}

function read(relativePath: string): string {
  return fs.readFileSync(resolveRepo(relativePath), 'utf8');
}

function hasTopLevelName(compose: string): boolean {
  return /^name\s*:/m.test(compose);
}

function addCheck(checks: CheckResult[], id: string, passed: boolean, message: string): void {
  checks.push({ id, passed, message });
}

export function validateNasIsolatedRunner(): ValidationResult {
  const checks: CheckResult[] = [];
  const runnerExists = exists(runnerPath);
  const composeExists = exists(composePath);
  const runner = runnerExists ? read(runnerPath) : '';
  const compose = composeExists ? read(composePath) : '';

  addCheck(checks, 'runner.exists', runnerExists, `${runnerPath} exists`);
  addCheck(
    checks,
    'runner.compose.v2-and-v1',
    runner.includes('docker compose') && runner.includes('docker-compose'),
    'run-isolated supports docker compose and docker-compose',
  );
  addCheck(
    checks,
    'runner.env-file',
    runner.includes('.env.car-rental-collection-test') &&
      runner.includes('cp .env.car-rental-collection-test.example .env.car-rental-collection-test'),
    'run-isolated checks .env.car-rental-collection-test and prints copy command',
  );
  addCheck(
    checks,
    'runner.shell-safety',
    [
      'DB_DIALECT',
      'DB_DATABASE',
      'CAR_RENTAL_DATABASE_SAFETY_LABEL',
      'CAR_RENTAL_MOCK_DATA_ONLY',
      'IOPGPS_SYNC_ENABLED',
    ].every((snippet) => runner.includes(snippet)),
    'run-isolated has shell safety check',
  );
  addCheck(
    checks,
    'runner.container-pg-dump',
    runner.includes('docker exec') && runner.includes('pg_dump -h 127.0.0.1 -p 5432') && runner.includes('docker cp'),
    'run-isolated uses container pg_dump fallback',
  );
  addCheck(
    checks,
    'runner.npm-exec-ts-node',
    runner.includes('npm exec --package=ts-node --package=typescript -- ts-node'),
    'run-isolated supports npm exec ts-node fallback',
  );
  addCheck(
    checks,
    'runner.prepare-only',
    runner.includes('MODE="prepare-only"'),
    'run-isolated defaults to prepare-only',
  );
  addCheck(checks, 'runner.execute-flag', runner.includes('--execute'), 'execute mode requires --execute');
  addCheck(
    checks,
    'runner.execute-confirm',
    runner.includes('--confirm-real-collection-execute'),
    'execute mode requires --confirm-real-collection-execute',
  );
  addCheck(
    checks,
    'runner.no-db-secret-output',
    !runner.includes('DB_PASSWORD'),
    'run-isolated does not output DB_PASSWORD',
  );
  addCheck(checks, 'runner.no-app-key-output', !runner.includes('APP_KEY'), 'run-isolated does not output APP_KEY');
  addCheck(
    checks,
    'runner.no-iopgps-key-output',
    !runner.includes('IOPGPS_LOGIN_KEY'),
    'run-isolated does not output IOPGPS_LOGIN_KEY',
  );
  addCheck(
    checks,
    'compose.no-top-level-name',
    composeExists && !hasTopLevelName(compose),
    'compose has no top-level name',
  );
  addCheck(checks, 'compose.port', compose.includes('53240:5432'), 'compose maps 53240:5432');
  addCheck(checks, 'docs.runbook', exists(runbookPath), `${runbookPath} exists`);
  addCheck(checks, 'docs.isolation', exists(isolationPath), `${isolationPath} exists`);
  addCheck(checks, 'docs.production-policy', exists(productionPolicyPath), `${productionPolicyPath} exists`);

  const blockers = checks.filter((check) => !check.passed).map((check) => `${check.id}: ${check.message}`);

  return {
    valid: blockers.length === 0,
    production_ready: false,
    checkedFiles: [runnerPath, composePath, runbookPath, isolationPath, productionPolicyPath].filter(exists),
    checks,
    blockers,
  };
}

function main(): void {
  const result = validateNasIsolatedRunner();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) {
  main();
}
