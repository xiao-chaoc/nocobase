import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');
const planPath = 'docs/car-rental-permission-sensitive-field-test-plan.md';
const dryRunScriptPath = 'scripts/car-rental/run-isolated-permission-sensitive-field-test.sh';
const dryRunReportPath = 'docs/car-rental-permission-sensitive-field-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-permission-sensitive-field-modification-items.md';
const validateScriptPath = 'scripts/car-rental/validate-permission-sensitive-field-stage.ts';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(rootDir, relativePath));
}

describe('car rental permission sensitive field stage', () => {
  it('permission test plan 文档存在', () => {
    expect(exists(planPath)).toBe(true);
  });

  it('permission dry-run 脚本存在', () => {
    expect(exists(dryRunScriptPath)).toBe(true);
  });

  it('permission dry-run report 文档存在', () => {
    expect(exists(dryRunReportPath)).toBe(true);
  });

  it('permission modification items 文档存在', () => {
    expect(exists(modificationItemsPath)).toBe(true);
  });

  it('validate permission stage 脚本存在', () => {
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
    expect(script).toContain('test-data/generated/car-rental-permission-sensitive-field-dry-run.generated.json');
    expect(script).toContain('fs.writeFileSync(jsonReportPath');
  });

  it('modification items 包含总收入隐藏', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('总收入隐藏规则');
  });

  it('modification items 包含总付款额隐藏', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('总付款额隐藏规则');
  });

  it('modification items 包含未来应收隐藏', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('未来应收隐藏规则');
  });

  it('modification items 包含付款截图访问', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('付款截图访问规则');
  });

  it('modification items 包含合同扫描件访问', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('合同扫描件访问规则');
  });

  it('modification items 包含司机证件访问', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('司机证件访问规则');
  });

  it('modification items 包含 IOPGPS secret 隐藏', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('IOPGPS secret 隐藏规则');
  });

  it('modification items 包含司机不登录', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('司机不登录规则');
  });

  it('modification items 包含 customer portal 禁止', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('customer portal 禁止规则');
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
