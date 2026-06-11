import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');
const runnerPath = 'scripts/car-rental/run-isolated-collection-registration-test.sh';
const composePath = 'docker-compose.car-rental-collection-test.yml';
const runbookPath = 'docs/car-rental-nas-test-pause-resume-runbook.md';
const isolationPath = 'docs/car-rental-test-vs-production-isolation.md';
const productionPolicyPath = 'docs/car-rental-production-init-policy.md';
const validatorPath = 'scripts/car-rental/validate-nas-isolated-runner.ts';

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function expectRepoFile(relativePath: string): void {
  expect(fs.existsSync(repoPath(relativePath))).toBe(true);
}

describe('nasIsolatedRunnerCompatibility', () => {
  it('NAS pause/resume runbook 存在', () => {
    expectRepoFile(runbookPath);
  });

  it('test vs production isolation 文档存在', () => {
    expectRepoFile(isolationPath);
  });

  it('production init policy 文档存在', () => {
    expectRepoFile(productionPolicyPath);
  });

  it('validate NAS runner 脚本存在', () => {
    expectRepoFile(validatorPath);
  });

  it('docker compose 文件不含顶层 name', () => {
    expect(readRepoFile(composePath)).not.toMatch(/^name\s*:/m);
  });

  it('docker compose 文件含 53240:5432', () => {
    expect(readRepoFile(composePath)).toContain('53240:5432');
  });

  it('run-isolated 支持 docker-compose', () => {
    expect(readRepoFile(runnerPath)).toContain('docker-compose');
  });

  it('run-isolated 支持 docker compose', () => {
    expect(readRepoFile(runnerPath)).toContain('docker compose');
  });

  it('run-isolated 有 shell safety check', () => {
    const runner = readRepoFile(runnerPath);
    expect(runner).toContain('DB_DIALECT');
    expect(runner).toContain('DB_DATABASE');
    expect(runner).toContain('CAR_RENTAL_DATABASE_SAFETY_LABEL');
    expect(runner).toContain('CAR_RENTAL_MOCK_DATA_ONLY');
    expect(runner).toContain('IOPGPS_SYNC_ENABLED');
  });

  it('run-isolated 有 container pg_dump fallback', () => {
    const runner = readRepoFile(runnerPath);
    expect(runner).toContain('docker exec');
    expect(runner).toContain('pg_dump -h 127.0.0.1 -p 5432');
    expect(runner).toContain('docker cp');
  });

  it('run-isolated 有 npm exec ts-node fallback', () => {
    expect(readRepoFile(runnerPath)).toContain('npm exec --package=ts-node --package=typescript -- ts-node');
  });

  it('run-isolated 默认 prepare-only', () => {
    expect(readRepoFile(runnerPath)).toContain('MODE="prepare-only"');
  });

  it('run-isolated execute 需要 confirm', () => {
    const runner = readRepoFile(runnerPath);
    expect(runner).toContain('--execute');
    expect(runner).toContain('--confirm-real-collection-execute');
  });

  it('文档说明 Docker 隔离不等于数据库安全', () => {
    expect(readRepoFile(runbookPath)).toContain('Docker 隔离不等于数据库安全');
  });

  it('文档说明正式生产前删除测试目录可最小化影响', () => {
    expect(readRepoFile(runbookPath)).toContain('删除测试目录后重新 clone');
  });

  it('文档说明生产不能导入 mock 数据', () => {
    expect(readRepoFile(productionPolicyPath)).toContain('生产脚本不得调用 import mock data');
  });

  it('文档说明生产必须使用新目录、新 env、新 DB volume、新 storage', () => {
    const runbook = readRepoFile(runbookPath);
    expect(runbook).toContain('新目录');
    expect(runbook).toContain('新 `.env`');
    expect(runbook).toContain('新 PostgreSQL 数据目录 / volume');
    expect(runbook).toContain('新 storage');
  });

  it('文档说明生产初期 IOPGPS 默认 false', () => {
    expect(readRepoFile(isolationPath)).toContain('IOPGPS_SYNC_ENABLED=false');
  });
});
