import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');
const planPath = 'docs/car-rental-production-init-guard-plan.md';
const boundaryPath = 'docs/car-rental-production-deployment-boundary.md';
const dryRunScriptPath = 'scripts/car-rental/run-production-init-guard-dry-run.sh';
const noMockGuardPath = 'scripts/car-rental/validate-production-no-mock-guard.ts';
const dryRunReportPath = 'docs/car-rental-production-init-guard-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-production-init-guard-modification-items.md';
const envExamplePath = '.env.car-rental-production.example';
const generatedReportPath = 'test-data/generated/car-rental-production-init-guard-dry-run.generated.json';

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}
function exists(relativePath: string): boolean {
  return fs.existsSync(repoPath(relativePath));
}
function readRepoFile(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}
function envValue(content: string, key: string): string {
  const line = content.split(/\r?\n/).find((item) => item.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : '';
}

describe('Production init guard Codex-only stage', () => {
  it('production init guard plan 文档存在', () => expect(exists(planPath)).toBe(true));
  it('production deployment boundary 文档存在', () => expect(exists(boundaryPath)).toBe(true));
  it('production init guard dry-run 脚本存在', () => expect(exists(dryRunScriptPath)).toBe(true));
  it('production no mock guard 脚本存在', () => expect(exists(noMockGuardPath)).toBe(true));
  it('production init guard dry-run report 文档存在', () => expect(exists(dryRunReportPath)).toBe(true));
  it('production init guard modification items 文档存在', () => expect(exists(modificationItemsPath)).toBe(true));
  it('production env example 存在', () => expect(exists(envExamplePath)).toBe(true));

  it('production env example 不包含 APP_KEY', () => expect(readRepoFile(envExamplePath)).not.toContain('APP_KEY'));
  it('production env example 不包含 IOPGPS_LOGIN_KEY', () =>
    expect(readRepoFile(envExamplePath)).not.toContain('IOPGPS_LOGIN_KEY'));
  it('production env example DB_DATABASE 不包含 test/mock/demo/sample', () => {
    expect(envValue(readRepoFile(envExamplePath), 'DB_DATABASE')).not.toMatch(/test|mock|demo|sample/i);
  });
  it('production env example CAR_RENTAL_MOCK_DATA_ONLY=false', () => {
    expect(envValue(readRepoFile(envExamplePath), 'CAR_RENTAL_MOCK_DATA_ONLY')).toBe('false');
  });
  it('production env example CAR_RENTAL_IMPORT_MOCK_DATA=false', () => {
    expect(envValue(readRepoFile(envExamplePath), 'CAR_RENTAL_IMPORT_MOCK_DATA')).toBe('false');
  });
  it('production env example IOPGPS_SYNC_ENABLED=false', () => {
    expect(envValue(readRepoFile(envExamplePath), 'IOPGPS_SYNC_ENABLED')).toBe('false');
  });

  it('dry-run 脚本包含 codex_only', () => expect(readRepoFile(dryRunScriptPath)).toContain('codex_only'));
  it('dry-run 脚本包含 production_ready=false', () =>
    expect(readRepoFile(dryRunScriptPath)).toContain('production_ready=false'));
  it('dry-run 脚本不连接数据库', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('does not connect to any database');
    expect(script).not.toContain('psql ');
    expect(script).not.toContain('sequelize');
  });
  it('dry-run 脚本不初始化生产库', () =>
    expect(readRepoFile(dryRunScriptPath)).toContain('does not initialize production database'));
  it('dry-run 脚本不导入 mock 数据', () =>
    expect(readRepoFile(dryRunScriptPath)).toContain('does not import mock data'));
  it('dry-run 脚本生成 JSON report', () => expect(readRepoFile(dryRunScriptPath)).toContain(generatedReportPath));

  for (const item of [
    'production does not import mock data',
    'production does not reuse test storage',
    'production does not reuse test PostgreSQL volume',
    'production_ready remains false',
  ]) {
    it(`modification items 包含 ${item}`, () => expect(readRepoFile(modificationItemsPath)).toContain(item));
  }

  it('文档说明当前不要求用户本地运行', () => {
    expect(`${readRepoFile(planPath)}\n${readRepoFile(dryRunReportPath)}`).toContain('当前不要求用户本地运行');
  });
  it('文档说明正式版前才本地执行', () => {
    expect(`${readRepoFile(planPath)}\n${readRepoFile(dryRunReportPath)}`).toContain('正式版前才本地执行');
  });
  it('文档说明生产不导入 mock 数据', () => {
    expect(`${readRepoFile(planPath)}\n${readRepoFile(boundaryPath)}\n${readRepoFile(dryRunReportPath)}`).toContain(
      '生产不得导入 mock 数据',
    );
  });
  it('文档说明 production_ready=false', () => {
    expect(`${readRepoFile(planPath)}\n${readRepoFile(boundaryPath)}\n${readRepoFile(dryRunReportPath)}`).toContain(
      'production_ready=false',
    );
  });
});
