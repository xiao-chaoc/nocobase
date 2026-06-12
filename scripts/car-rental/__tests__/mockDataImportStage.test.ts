import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';

const rootDir = path.resolve(__dirname, '../../..');
const planPath = 'docs/car-rental-mock-data-import-plan.md';
const specPath = 'docs/car-rental-safe-mock-fixture-spec.md';
const dryRunScriptPath = 'scripts/car-rental/run-isolated-mock-data-import-test.sh';
const dryRunReportPath = 'docs/car-rental-mock-data-import-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-mock-data-import-modification-items.md';
const productionGuardPath = 'scripts/car-rental/validate-mock-data-production-guard.ts';
const generatedReportPath = 'test-data/generated/car-rental-mock-data-import-dry-run.generated.json';
const fixtureDir = 'test-data/mock/car-rental';
const fixtureFiles = [
  'drivers.mock.json',
  'vehicles.mock.json',
  'lease-contracts.mock.json',
  'rent-daily-ledgers.mock.json',
  'rent-payments.mock.json',
  'rent-payment-allocations.mock.json',
  'deposit-records.mock.json',
  'operation-logs.mock.json',
  'contract-documents.mock.json',
  'gps-status.mock.json',
  'mock-manifest.json',
];

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(repoPath(relativePath));
}

describe('Mock data import Codex-only stage', () => {
  it('mock import plan 文档存在', () => {
    expect(exists(planPath)).toBe(true);
  });

  it('safe mock fixture spec 文档存在', () => {
    expect(exists(specPath)).toBe(true);
  });

  it('mock dry-run 脚本存在', () => {
    expect(exists(dryRunScriptPath)).toBe(true);
  });

  it('mock dry-run report 文档存在', () => {
    expect(exists(dryRunReportPath)).toBe(true);
  });

  it('mock modification items 文档存在', () => {
    expect(exists(modificationItemsPath)).toBe(true);
  });

  it('validate production guard 脚本存在', () => {
    expect(exists(productionGuardPath)).toBe(true);
  });

  it('mock fixture manifest 存在', () => {
    expect(exists(path.join(fixtureDir, 'mock-manifest.json'))).toBe(true);
  });

  for (const fileName of fixtureFiles) {
    it(`${fileName} fixture 文件存在`, () => {
      expect(exists(path.join(fixtureDir, fileName))).toBe(true);
    });

    it(`${fileName} 包含 mock_data_only`, () => {
      const fixture = JSON.parse(readRepoFile(path.join(fixtureDir, fileName)));
      expect(fixture.mock_data_only).toBe(true);
    });

    it(`${fileName} 包含 not_for_production`, () => {
      const fixture = JSON.parse(readRepoFile(path.join(fixtureDir, fileName)));
      expect(fixture.not_for_production).toBe(true);
    });
  }

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

  it('dry-run 脚本不导入数据库', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('does not import data');
    expect(script).not.toContain('db:import');
    expect(script).not.toContain('nocobase upgrade');
  });

  it('dry-run 脚本不启用 IOPGPS', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('does not enable real IOPGPS sync');
    expect(script).not.toContain('IOPGPS_SYNC_ENABLED=true');
  });

  it('dry-run 脚本生成 JSON report', () => {
    expect(readRepoFile(dryRunScriptPath)).toContain(generatedReportPath);
  });

  for (const item of [
    'long-term contract',
    'time-bound contract',
    'payment allocation',
    'deposit not counted as rent income',
    'current arrears excludes future receivables',
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

  it('文档说明 mock 数据不能进入生产', () => {
    expect(
      `${readRepoFile(planPath)}\n${readRepoFile(dryRunReportPath)}\n${readRepoFile(modificationItemsPath)}`,
    ).toContain('mock 数据不能进入生产');
  });

  it('production guard 校验通过', () => {
    childProcess.execFileSync('bash', [repoPath(dryRunScriptPath)], { cwd: rootDir, stdio: 'pipe' });
    childProcess.execFileSync('node', ['--experimental-strip-types', repoPath(productionGuardPath)], {
      cwd: rootDir,
      stdio: 'pipe',
    });
    expect(exists(generatedReportPath)).toBe(true);
  });
});
