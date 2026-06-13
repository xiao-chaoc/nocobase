import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '../../..');
const planPath = 'docs/car-rental-backup-rollback-rehearsal-plan.md';
const dryRunScriptPath = 'scripts/car-rental/run-isolated-backup-rollback-rehearsal-test.sh';
const dryRunReportPath = 'docs/car-rental-backup-rollback-rehearsal-dry-run-report.md';
const modificationItemsPath = 'docs/car-rental-backup-rollback-rehearsal-modification-items.md';
const validateScriptPath = 'scripts/car-rental/validate-backup-rollback-rehearsal-stage.ts';
const generatedReportPath = 'test-data/generated/car-rental-backup-rollback-rehearsal-dry-run.generated.json';

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function exists(relativePath: string): boolean {
  return fs.existsSync(repoPath(relativePath));
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

describe('Backup / rollback rehearsal Codex-only stage', () => {
  it('backup/rollback rehearsal plan 文档存在', () => {
    expect(exists(planPath)).toBe(true);
  });

  it('backup/rollback rehearsal dry-run 脚本存在', () => {
    expect(exists(dryRunScriptPath)).toBe(true);
  });

  it('backup/rollback rehearsal dry-run report 文档存在', () => {
    expect(exists(dryRunReportPath)).toBe(true);
  });

  it('backup/rollback modification items 文档存在', () => {
    expect(exists(modificationItemsPath)).toBe(true);
  });

  it('validate backup/rollback stage 脚本存在', () => {
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

  it('dry-run 脚本不执行 pg_dump', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('does not execute PostgreSQL dump or restore commands');
    expect(script).not.toContain('PGPASSWORD=');
    expect(script).not.toContain(' pg_dump');
  });

  it('dry-run 脚本不执行 pg_restore', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('does not execute PostgreSQL dump or restore commands');
    expect(script).not.toContain(' pg_restore');
  });

  it('dry-run 脚本不删除文件', () => {
    const script = readRepoFile(dryRunScriptPath);
    expect(script).toContain('does not delete files');
    expect(script).not.toContain('rm -rf');
  });

  it('dry-run 脚本生成 JSON report', () => {
    expect(readRepoFile(dryRunScriptPath)).toContain(generatedReportPath);
  });

  for (const item of [
    'backup script exists',
    'restore script exists',
    'backup rejects production database',
    'restore rejects production database',
    'restore requires manual YES',
    'rollback drill document exists',
    'collection registration failure rollback',
    'runtime registration failure rollback',
    'permission initialization failure rollback',
    'page initialization failure rollback',
    'mock data import failure rollback',
    'business smoke failure rollback',
    'contract document failure rollback',
    'GPS mock failure rollback',
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

  it('文档说明当前没有有效本地 dump', () => {
    expect(
      `${readRepoFile(planPath)}\n${readRepoFile(dryRunReportPath)}\n${readRepoFile(modificationItemsPath)}`,
    ).toContain('当前没有有效本地 dump');
  });

  it('文档说明 dump / SQL / filled request 不得提交', () => {
    expect(
      `${readRepoFile(planPath)}\n${readRepoFile(dryRunReportPath)}\n${readRepoFile(modificationItemsPath)}`,
    ).toContain('dump / SQL / filled request 不得提交');
  });
});
