import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');
const runnerPath = 'scripts/car-rental/run-isolated-collection-registration-test.sh';
const docPath = 'docs/car-rental-isolated-collection-registration-test.md';
const validatorPath = 'scripts/car-rental/validate-isolated-collection-test-runner.ts';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function expectRepoFile(relativePath: string): void {
  expect(fs.existsSync(path.join(rootDir, relativePath))).toBe(true);
}

describe('isolatedCollectionTestRunner', () => {
  it('run-isolated 脚本存在', () => {
    expectRepoFile(runnerPath);
  });

  it('文档存在', () => {
    expectRepoFile(docPath);
  });

  it('validate runner 脚本存在', () => {
    expectRepoFile(validatorPath);
  });

  it('run-isolated 默认 prepare-only', () => {
    expect(readRepoFile(runnerPath)).toContain('MODE="prepare-only"');
  });

  it('run-isolated 支持 --execute', () => {
    expect(readRepoFile(runnerPath)).toContain('--execute');
  });

  it('run-isolated 支持 --confirm-real-collection-execute', () => {
    expect(readRepoFile(runnerPath)).toContain('--confirm-real-collection-execute');
  });

  it('run-isolated 支持 --skip-compose-up', () => {
    expect(readRepoFile(runnerPath)).toContain('--skip-compose-up');
  });

  it('run-isolated 支持 --keep-db-running', () => {
    expect(readRepoFile(runnerPath)).toContain('--keep-db-running');
  });

  it('run-isolated 支持 --stop-db-after', () => {
    expect(readRepoFile(runnerPath)).toContain('--stop-db-after');
  });

  it('run-isolated 检查 .env.car-rental-collection-test', () => {
    expect(readRepoFile(runnerPath)).toContain('.env.car-rental-collection-test');
  });

  it('run-isolated 检查 DB_DIALECT', () => {
    expect(readRepoFile(runnerPath)).toContain('DB_DIALECT');
  });

  it('run-isolated 检查测试库名', () => {
    const runner = readRepoFile(runnerPath);
    expect(runner).toContain('DB_DATABASE');
    expect(runner).toContain('collection_test');
  });

  it('run-isolated 检查 isolated_test_database', () => {
    expect(readRepoFile(runnerPath)).toContain('isolated_test_database');
  });

  it('run-isolated 检查 IOPGPS false', () => {
    const runner = readRepoFile(runnerPath);
    expect(runner).toContain('IOPGPS_SYNC_ENABLED');
    expect(runner).toContain('false');
  });

  it('run-isolated 检查 mock data only', () => {
    expect(readRepoFile(runnerPath)).toContain('CAR_RENTAL_MOCK_DATA_ONLY');
  });

  it('run-isolated 调用 backup 脚本', () => {
    expect(readRepoFile(runnerPath)).toContain('backup-collection-test-db.sh');
  });

  it('run-isolated 调用 request generation', () => {
    expect(readRepoFile(runnerPath)).toContain('generate-real-collection-execute-request-from-test-db.ts');
  });

  it('run-isolated 调用 validate request', () => {
    expect(readRepoFile(runnerPath)).toContain('validate-real-collection-execute-request.ts');
  });

  it('run-isolated 调用 apply dry-run', () => {
    expect(readRepoFile(runnerPath)).toContain('apply-real-collection-execute-request.ts');
  });

  it('run-isolated 调用 preflight', () => {
    expect(readRepoFile(runnerPath)).toContain('preflight-real-collection-execute.ts');
  });

  it('run-isolated 调用 execute 脚本', () => {
    expect(readRepoFile(runnerPath)).toContain('execute-real-collection-registration.ts');
  });

  it('run-isolated 调用 post-validate', () => {
    expect(readRepoFile(runnerPath)).toContain('post-validate-real-collection-registration.ts');
  });

  it('run-isolated 不输出 DB_PASSWORD', () => {
    expect(readRepoFile(runnerPath)).not.toContain('DB_PASSWORD');
  });

  it('run-isolated 不输出 APP_KEY', () => {
    expect(readRepoFile(runnerPath)).not.toContain('APP_KEY');
  });

  it('run-isolated 不输出 IOPGPS_LOGIN_KEY', () => {
    expect(readRepoFile(runnerPath)).not.toContain('IOPGPS_LOGIN_KEY');
  });

  it('文档说明 Docker 隔离不等于数据库安全', () => {
    expect(readRepoFile(docPath)).toContain('Docker 隔离不等于数据库安全');
  });

  it('文档说明不 production_ready', () => {
    expect(readRepoFile(docPath)).toContain('不标记 `production_ready`');
  });
});
