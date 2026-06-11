import fs from 'node:fs';
import path from 'node:path';

describe('car rental runtime registration stage', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const planPath = 'docs/car-rental-runtime-registration-plan.md';
  const dryRunScriptPath = 'scripts/car-rental/run-isolated-runtime-registration-test.sh';
  const dryRunReportPath = 'docs/car-rental-runtime-registration-dry-run-report.md';
  const modificationItemsPath = 'docs/car-rental-runtime-modification-items.md';
  const validateScriptPath = 'scripts/car-rental/validate-runtime-registration-stage.ts';

  function readRepoFile(relativePath: string): string {
    return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
  }

  function exists(relativePath: string): boolean {
    return fs.existsSync(path.join(rootDir, relativePath));
  }

  it('runtime registration plan 文档存在', () => {
    expect(exists(planPath)).toBe(true);
  });

  it('runtime dry-run 脚本存在', () => {
    expect(exists(dryRunScriptPath)).toBe(true);
  });

  it('runtime dry-run report 文档存在', () => {
    expect(exists(dryRunReportPath)).toBe(true);
  });

  it('runtime modification items 文档存在', () => {
    expect(exists(modificationItemsPath)).toBe(true);
  });

  it('validate runtime stage 脚本存在', () => {
    expect(exists(validateScriptPath)).toBe(true);
  });

  it('dry-run 脚本包含 codex_only', () => {
    expect(readRepoFile(dryRunScriptPath)).toContain('codex_only');
  });

  it('dry-run 脚本包含 production_ready=false', () => {
    expect(readRepoFile(dryRunScriptPath)).toContain('production_ready: false');
  });

  it('dry-run 脚本不连接数据库', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('no database connection');
    expect(script).not.toContain('sequelize.authenticate');
    expect(script).not.toContain('createConnection');
  });

  it('dry-run 脚本不启用 IOPGPS', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('IOPGPS real sync stays disabled');
    expect(script).not.toContain('IOPGPS_SYNC_ENABLED=true');
  });

  it('dry-run 脚本生成 JSON report', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('test-data/generated/car-rental-runtime-registration-dry-run.generated.json');
    expect(script).toContain('fs.writeFileSync(jsonReportPath');
  });

  it('modification items 包含合同创建', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('合同创建 runtime');
  });

  it('modification items 包含租金台账生成', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('租金台账生成 runtime');
  });

  it('modification items 包含付款分配', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('付款分配 runtime');
  });

  it('modification items 包含押金处理', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('押金处理 runtime');
  });

  it('modification items 包含欠款计算', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('欠款计算 runtime');
  });

  it('modification items 包含合同文档生成', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('合同文档生成 runtime');
  });

  it('modification items 包含 GPS mock sync', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('GPS mock sync runtime');
  });

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
});
