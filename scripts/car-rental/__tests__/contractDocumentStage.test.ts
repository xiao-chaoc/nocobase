import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(rootDir, relativePath));
}

describe('contractDocumentStage', () => {
  const planPath = 'docs/car-rental-contract-document-test-plan.md';
  const dryRunScriptPath = 'scripts/car-rental/run-isolated-contract-document-test.sh';
  const reportPath = 'docs/car-rental-contract-document-dry-run-report.md';
  const modificationItemsPath = 'docs/car-rental-contract-document-modification-items.md';
  const validateScriptPath = 'scripts/car-rental/validate-contract-document-stage.ts';

  it('contract document test plan 文档存在', () => {
    expect(exists(planPath)).toBe(true);
  });

  it('contract document dry-run 脚本存在', () => {
    expect(exists(dryRunScriptPath)).toBe(true);
  });

  it('contract document dry-run report 文档存在', () => {
    expect(exists(reportPath)).toBe(true);
  });

  it('contract document modification items 文档存在', () => {
    expect(exists(modificationItemsPath)).toBe(true);
  });

  it('validate contract document stage 脚本存在', () => {
    expect(exists(validateScriptPath)).toBe(true);
  });

  it('dry-run 脚本包含 codex_only', () => {
    expect(read(dryRunScriptPath)).toContain('codex_only');
  });

  it('dry-run 脚本包含 production_ready=false', () => {
    expect(read(dryRunScriptPath)).toContain('PRODUCTION_READY=false');
  });

  it('dry-run 脚本不连接数据库', () => {
    const script = read(dryRunScriptPath);
    expect(script).toContain('DO_NOT_CONNECT_DATABASE=true');
    expect(script).not.toContain('psql ');
    expect(script).not.toContain('sequelize');
  });

  it('dry-run 脚本不导入数据库', () => {
    const script = read(dryRunScriptPath);
    expect(script).toContain('DO_NOT_IMPORT_DATABASE=true');
    expect(script).not.toContain('nocobase upgrade');
    expect(script).not.toContain('db:import');
  });

  it('dry-run 脚本不生成真实合同文件', () => {
    const script = read(dryRunScriptPath);
    expect(script).toContain('DO_NOT_GENERATE_REAL_CONTRACT_FILE=true');
    expect(script).not.toContain('libreoffice');
    expect(script).not.toContain('pandoc');
  });

  it('dry-run 脚本不启用 IOPGPS', () => {
    const script = read(dryRunScriptPath);
    expect(script).toContain('IOPGPS_REAL_SYNC_ENABLED=false');
    expect(script).not.toContain('IOPGPS_REAL_SYNC_ENABLED=true');
  });

  it('dry-run 脚本生成 JSON report', () => {
    expect(read(dryRunScriptPath)).toContain('car-rental-contract-document-dry-run.generated.json');
  });

  const requiredModificationItems = [
    'Chinese contract version',
    'English contract version',
    'French contract version',
    'contract driver binding',
    'contract vehicle binding',
    'deposit clause',
    'natural week rent calculation clause',
    'selected free-rent days clause',
    'offline signing clause',
    'no online payment clause',
    'no driver login clause',
    'signed scan placeholder',
    'no real scan files',
  ];

  it.each(requiredModificationItems)('modification items 包含 %s', (item) => {
    expect(read(modificationItemsPath)).toContain(item);
  });

  it('文档说明当前不要求用户本地运行', () => {
    expect(read(planPath)).toContain('当前不要求用户本地运行');
    expect(read(reportPath)).toContain('当前不要求用户本地运行');
    expect(read(modificationItemsPath)).toContain('当前不要求用户本地运行');
  });

  it('文档说明正式版前才本地执行', () => {
    expect(read(planPath)).toContain('正式版前才本地执行');
    expect(read(reportPath)).toContain('正式版前才本地执行');
    expect(read(modificationItemsPath)).toContain('正式版前才本地执行');
  });

  it('文档说明 mock 数据不能进入生产', () => {
    expect(read(planPath)).toContain('mock 数据不能进入生产');
    expect(read(reportPath)).toContain('mock 数据不能进入生产');
    expect(read(modificationItemsPath)).toContain('mock 数据不能进入生产');
  });
});
