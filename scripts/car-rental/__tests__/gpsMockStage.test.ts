import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');
const planPath = 'docs/car-rental-gps-mock-test-plan.md';
const dryRunScriptPath = 'scripts/car-rental/run-isolated-gps-mock-test.sh';
const dryRunReportPath = 'docs/car-rental-gps-mock-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-gps-mock-modification-items.md';
const validateScriptPath = 'scripts/car-rental/validate-gps-mock-stage.ts';
const generatedReportPath = 'test-data/generated/car-rental-gps-mock-dry-run.generated.json';

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function exists(relativePath: string): boolean {
  return fs.existsSync(repoPath(relativePath));
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

describe('GPS mock Codex-only stage', () => {
  it('GPS mock test plan 文档存在', () => {
    expect(exists(planPath)).toBe(true);
  });

  it('GPS mock dry-run 脚本存在', () => {
    expect(exists(dryRunScriptPath)).toBe(true);
  });

  it('GPS mock dry-run report 文档存在', () => {
    expect(exists(dryRunReportPath)).toBe(true);
  });

  it('GPS mock modification items 文档存在', () => {
    expect(exists(modificationItemsPath)).toBe(true);
  });

  it('validate GPS mock stage 脚本存在', () => {
    expect(exists(validateScriptPath)).toBe(true);
  });

  it('dry-run 脚本包含 codex_only', () => {
    expect(readRepoFile(dryRunScriptPath)).toContain('codex_only');
  });

  it('dry-run 脚本包含 production_ready=false', () => {
    expect(readRepoFile(dryRunScriptPath)).toContain('production_ready=false');
  });

  it('dry-run 脚本不连接数据库', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('does not connect to any database');
    expect(script).not.toContain('psql ');
    expect(script).not.toContain('sequelize');
  });

  it('dry-run 脚本不调用真实 IOPGPS', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('does not call real IOPGPS API endpoints');
    expect(script).not.toContain('curl ');
    expect(script).not.toContain('axios');
    expect(script).not.toContain('fetch(');
  });

  it('dry-run 脚本不导入数据库', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('does not import data into any database');
    expect(script).not.toContain('db:import');
    expect(script).not.toContain('nocobase upgrade');
  });

  it('dry-run 脚本生成 JSON report', () => {
    expect(readRepoFile(dryRunScriptPath)).toContain(generatedReportPath);
  });

  for (const item of [
    'GPS mock device',
    'GPS vehicle binding',
    'GPS online status',
    'GPS offline status',
    'GPS fault status',
    'GPS sync failed status',
    'GPS not used for rent calculation',
    'GPS failure does not affect rent ledger',
    'GPS failure does not affect payment allocation',
    'GPS failure does not affect deposit',
    'GPS failure does not affect contract document',
    'no IOPGPS token',
    'no login_key',
    'no access_token',
  ]) {
    it(`modification items 包含 ${item}`, () => {
      expect(readRepoFile(modificationItemsPath)).toContain(item);
    });
  }

  it('文档说明当前不要求用户本地运行', () => {
    expect(
      `${readRepoFile(planPath)}\n${readRepoFile(dryRunReportPath)}\n${readRepoFile(modificationItemsPath)}`,
    ).toContain('当前不要求用户本地运行');
  });

  it('文档说明正式版前才本地执行', () => {
    expect(
      `${readRepoFile(planPath)}\n${readRepoFile(dryRunReportPath)}\n${readRepoFile(modificationItemsPath)}`,
    ).toContain('正式版前才本地执行');
  });

  it('文档说明 GPS 不参与租金计算', () => {
    expect(
      `${readRepoFile(planPath)}\n${readRepoFile(dryRunReportPath)}\n${readRepoFile(modificationItemsPath)}`,
    ).toContain('GPS 不参与租金计算');
  });

  it('文档说明 mock 数据不能进入生产', () => {
    expect(
      `${readRepoFile(planPath)}\n${readRepoFile(dryRunReportPath)}\n${readRepoFile(modificationItemsPath)}`,
    ).toContain('mock 数据不能进入生产');
  });
});
