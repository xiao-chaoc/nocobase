const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../../..');
const workflowPath = 'docs/car-rental-codex-only-workflow.md';
const pausedPath = 'docs/car-rental-local-nas-test-paused.md';
const modificationItemsPath = 'docs/car-rental-codex-only-modification-items.md';
const generatorPath = 'scripts/car-rental/generate-codex-only-project-status-report.ts';
const validatorPath = 'scripts/car-rental/validate-codex-only-workflow.ts';
const roadmapPath = 'docs/car-rental-pre-release-full-test-roadmap.md';

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function expectRepoFile(relativePath: string): void {
  expect(fs.existsSync(repoPath(relativePath))).toBe(true);
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

describe('Codex-only car-rental workflow', () => {
  it('Codex-only workflow 文档存在', () => {
    expectRepoFile(workflowPath);
  });

  it('local NAS paused 文档存在', () => {
    expectRepoFile(pausedPath);
  });

  it('Codex-only modification items 文档存在', () => {
    expectRepoFile(modificationItemsPath);
  });

  it('status report 生成脚本存在', () => {
    expectRepoFile(generatorPath);
  });

  it('validate-codex-only-workflow 脚本存在', () => {
    expectRepoFile(validatorPath);
  });

  it('文档包含 local NAS paused', () => {
    expect(readRepoFile(workflowPath)).toContain('local NAS paused');
  });

  it('文档包含 Docker containers deleted by user', () => {
    expect(readRepoFile(workflowPath)).toContain('Docker containers deleted by user');
  });

  it('文档包含 current local test not required', () => {
    expect(readRepoFile(workflowPath)).toContain('current local test not required');
  });

  it('文档包含 pre-release local execution', () => {
    expect(readRepoFile(roadmapPath)).toContain('pre-release local execution');
  });

  it('文档包含 production_ready=false', () => {
    expect(readRepoFile(workflowPath)).toContain('production_ready=false');
  });

  it('文档包含 mock data cannot enter production', () => {
    expect(readRepoFile(workflowPath)).toContain('mock data cannot enter production');
  });

  it('文档包含 run-full retained for future pre-release execution', () => {
    expect(readRepoFile(workflowPath)).toContain('run-full retained for future pre-release execution');
  });

  it('modification items 包含 Runtime', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('Runtime');
  });

  it('modification items 包含 Permission', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('Permission');
  });

  it('modification items 包含 Page', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('Page');
  });

  it('modification items 包含 mock data import', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('mock data import');
  });

  it('modification items 包含 business smoke test', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('business smoke test');
  });

  it('modification items 包含 production init guard', () => {
    expect(readRepoFile(modificationItemsPath)).toContain('production init guard');
  });
});
