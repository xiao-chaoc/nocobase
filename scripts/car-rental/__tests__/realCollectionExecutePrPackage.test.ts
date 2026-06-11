import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function expectRepoFile(relativePath: string): void {
  expect(fs.existsSync(path.join(rootDir, relativePath))).toBe(true);
}

describe('realCollectionExecutePrPackage', () => {
  const executeScriptPath = 'scripts/car-rental/execute-real-collection-registration.ts';
  const postValidateScriptPath = 'scripts/car-rental/post-validate-real-collection-registration.ts';
  const packageDocPath = 'docs/car-rental-real-collection-execute-pr-package.md';

  it('execute PR package 文档存在', () => {
    expectRepoFile(packageDocPath);
  });

  it('execute PR review checklist 存在', () => {
    expectRepoFile('docs/car-rental-real-collection-execute-pr-review-checklist.md');
  });

  it('rollback drill 文档存在', () => {
    expectRepoFile('docs/car-rental-real-collection-execute-rollback-drill.md');
  });

  it('execute 脚本存在', () => {
    expectRepoFile(executeScriptPath);
  });

  it('post-validate 脚本存在', () => {
    expectRepoFile(postValidateScriptPath);
  });

  it('validate execute PR package 脚本存在', () => {
    expectRepoFile('scripts/car-rental/validate-real-collection-execute-pr-package.ts');
  });

  it('execute 脚本默认 dry-run', () => {
    const script = readRepoFile(executeScriptPath);
    expect(script).toContain("const DEFAULT_MODE = 'dry-run'");
    expect(script).toContain('writesDatabase: false');
    expect(script).toContain('createsCollection: false');
    expect(script).toContain('runsMigration: false');
  });

  it('execute 脚本需要 --execute', () => {
    expect(readRepoFile(executeScriptPath)).toContain('--execute');
  });

  it('execute 脚本需要 --confirm-real-collection-execute', () => {
    expect(readRepoFile(executeScriptPath)).toContain('--confirm-real-collection-execute');
  });

  it('execute 脚本检查 request', () => {
    const script = readRepoFile(executeScriptPath);
    expect(script).toContain('--request');
    expect(script).toContain('request 文件不存在');
  });

  it('execute 脚本检查 preflight', () => {
    const script = readRepoFile(executeScriptPath);
    expect(script).toContain('--preflight');
    expect(script).toContain('preflight 文件不存在');
  });

  it('execute 脚本检查 backup', () => {
    const script = readRepoFile(executeScriptPath);
    expect(script).toContain('--backup');
    expect(script).toContain('backup 文件不存在');
  });

  it('execute 脚本拒绝 preflight blockers', () => {
    const script = readRepoFile(executeScriptPath);
    expect(script).toContain('collectPreflightBlockers');
    expect(script).toContain('preflight 存在 blockers');
  });

  it('execute 脚本拒绝非 postgresql', () => {
    expect(readRepoFile(executeScriptPath)).toContain('database_dialect 必须是 postgresql');
  });

  it('execute 脚本拒绝非隔离库', () => {
    expect(readRepoFile(executeScriptPath)).toContain('is_isolated_database 必须是 true');
  });

  it('execute 脚本拒绝 IOPGPS true', () => {
    expect(readRepoFile(executeScriptPath)).toContain('iopgps_real_sync_allowed 必须是 false');
  });

  it('execute 脚本拒绝 mockDataOnly false', () => {
    expect(readRepoFile(executeScriptPath)).toContain('mock_data_only 必须是 true');
  });

  it('execute 脚本不输出 DB_PASSWORD', () => {
    expect(readRepoFile(executeScriptPath)).not.toContain('DB_PASSWORD');
  });

  it('execute 脚本不输出 APP_KEY', () => {
    expect(readRepoFile(executeScriptPath)).not.toContain('APP_KEY');
  });

  it('execute 脚本不输出 IOPGPS_LOGIN_KEY', () => {
    expect(readRepoFile(executeScriptPath)).not.toContain('IOPGPS_LOGIN_KEY');
  });

  it('post-validate 脚本不伪造成功', () => {
    const script = readRepoFile(postValidateScriptPath);
    expect(script).toContain('pending_real_api_verification');
    expect(script).not.toContain("overallStatus: 'success'");
    expect(script).not.toContain("status: 'passed'");
  });

  it('package 文档包含新 backup 文件名 235309.dump', () => {
    expect(readRepoFile(packageDocPath)).toContain('pre-real-collection-register-20260610-235309.dump');
  });

  it('package 文档说明本 PR 不执行真实建表', () => {
    const doc = readRepoFile(packageDocPath);
    expect(doc).toContain('本轮只生成 execute 包');
    expect(doc).toContain('不执行真实 Collection 创建');
  });
});
