import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');
const planPath = 'docs/car-rental-page-menu-block-initialization-plan.md';
const dryRunScriptPath = 'scripts/car-rental/run-isolated-page-menu-block-test.sh';
const dryRunReportPath = 'docs/car-rental-page-menu-block-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-page-menu-block-modification-items.md';
const validateScriptPath = 'scripts/car-rental/validate-page-menu-block-stage.ts';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(rootDir, relativePath));
}

describe('car rental page menu block stage', () => {
  it('page/menu/block plan 文档存在', () => {
    expect(exists(planPath)).toBe(true);
  });

  it('page dry-run 脚本存在', () => {
    expect(exists(dryRunScriptPath)).toBe(true);
  });

  it('page dry-run report 文档存在', () => {
    expect(exists(dryRunReportPath)).toBe(true);
  });

  it('page modification items 文档存在', () => {
    expect(exists(modificationItemsPath)).toBe(true);
  });

  it('validate page stage 脚本存在', () => {
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
    expect(script).toContain('test-data/generated/car-rental-page-menu-block-dry-run.generated.json');
    expect(script).toContain('fs.writeFileSync(jsonReportPath');
  });

  for (const item of [
    '车辆管理页面',
    '司机管理页面',
    '合同管理页面',
    '合同创建页面',
    '付款登记页面',
    '付款按日分配页面',
    '押金管理页面',
    '欠款看板页面',
    '当前欠款日历页面',
    '合同文档生成页面',
    'GPS mock 状态页面',
    'IOPGPS 设置页面',
    'operation logs 页面',
    '敏感字段 UI 隐藏规则',
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
});
