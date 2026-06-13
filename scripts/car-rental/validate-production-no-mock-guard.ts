const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../..');
function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}
function read(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}
function assertCheck(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
function envValue(content: string, key: string): string {
  const line = content.split(/\r?\n/).find((item) => item.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : '';
}

const envPath = '.env.car-rental-production.example';
assertCheck(fs.existsSync(repoPath(envPath)), `${envPath} missing`);
const env = read(envPath);
assertCheck(!/APP_KEY|IOPGPS_LOGIN_KEY|access_token|login_key/i.test(env), 'example contains forbidden secret marker');
assertCheck(
  envValue(env, 'DB_PASSWORD') === 'CHANGE_ME_PRODUCTION_PASSWORD',
  'example DB_PASSWORD must be placeholder',
);
assertCheck(!/test|mock|demo|sample/i.test(envValue(env, 'DB_DATABASE')), 'DB_DATABASE contains forbidden marker');
assertCheck(envValue(env, 'CAR_RENTAL_MOCK_DATA_ONLY') === 'false', 'CAR_RENTAL_MOCK_DATA_ONLY must be false');
assertCheck(envValue(env, 'CAR_RENTAL_IMPORT_MOCK_DATA') === 'false', 'CAR_RENTAL_IMPORT_MOCK_DATA must be false');
assertCheck(envValue(env, 'IOPGPS_SYNC_ENABLED') === 'false', 'IOPGPS_SYNC_ENABLED must be false');
assertCheck(
  envValue(env, 'CAR_RENTAL_PRODUCTION_INIT_ENABLED') === 'false',
  'CAR_RENTAL_PRODUCTION_INIT_ENABLED must be false',
);
assertCheck(
  envValue(env, 'CAR_RENTAL_PRIVACY_DATA_IMPORT_ENABLED') === 'false',
  'CAR_RENTAL_PRIVACY_DATA_IMPORT_ENABLED must be false',
);

for (const file of [
  'docs/car-rental-production-init-guard-plan.md',
  'docs/car-rental-production-deployment-boundary.md',
  'docs/car-rental-test-and-production-init-separation.md',
  'docs/car-rental-mock-data-production-guard.md',
]) {
  assertCheck(fs.existsSync(repoPath(file)), `${file} missing`);
}
const docs = [
  'docs/car-rental-production-init-guard-plan.md',
  'docs/car-rental-production-deployment-boundary.md',
  'docs/car-rental-test-and-production-init-separation.md',
  'docs/car-rental-mock-data-production-guard.md',
]
  .map(read)
  .join('\n');
for (const phrase of [
  '生产不得导入 mock 数据',
  '生产不复用测试 dump',
  '生产不复用 filled request',
  '生产不复用测试 storage',
  '生产不复用测试 PostgreSQL volume',
  'IOPGPS_SYNC_ENABLED=false',
  'production_ready=false',
]) {
  assertCheck(docs.includes(phrase), `docs must include: ${phrase}`);
}

console.log(
  JSON.stringify(
    {
      validated: true,
      guard: 'production_no_mock',
      reads_real_env: false,
      connects_database: false,
      writes_database: false,
    },
    null,
    2,
  ),
);
