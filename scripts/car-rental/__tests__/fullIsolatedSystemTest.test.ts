const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../../..');
const runFullPath = 'scripts/car-rental/run-full-isolated-system-test.sh';
const progressPath = 'docs/car-rental-project-progress-summary.md';
const roadmapPath = 'docs/car-rental-pre-release-full-test-roadmap.md';
const reportTemplatePath = 'docs/car-rental-full-test-report-template.md';
const backlogTemplatePath = 'docs/car-rental-modification-backlog-template.md';
const initSeparationPath = 'docs/car-rental-test-and-production-init-separation.md';
const mockGuardPath = 'docs/car-rental-mock-data-production-guard.md';
const validatorPath = 'scripts/car-rental/validate-full-isolated-test-system.ts';

function repoPath(relativePath: string): string {
  return path.join(rootDir, relativePath);
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function expectRepoFile(relativePath: string): void {
  expect(fs.existsSync(repoPath(relativePath))).toBe(true);
}

describe('fullIsolatedSystemTest', () => {
  it('run-full 脚本存在', () => {
    expectRepoFile(runFullPath);
  });

  it('progress summary 文档存在', () => {
    expectRepoFile(progressPath);
  });

  it('roadmap 文档存在', () => {
    expectRepoFile(roadmapPath);
  });

  it('report template 文档存在', () => {
    expectRepoFile(reportTemplatePath);
  });

  it('backlog template 文档存在', () => {
    expectRepoFile(backlogTemplatePath);
  });

  it('init separation 文档存在', () => {
    expectRepoFile(initSeparationPath);
  });

  it('mock data guard 文档存在', () => {
    expectRepoFile(mockGuardPath);
  });

  it('validate-full-isolated-test-system.ts 存在', () => {
    expectRepoFile(validatorPath);
  });

  it('run-full 调用 collection runner', () => {
    expect(readRepoFile(runFullPath)).toContain('scripts/car-rental/run-isolated-collection-registration-test.sh');
  });

  it('run-full 包含 skipped 阶段', () => {
    const runFull = readRepoFile(runFullPath);
    expect(runFull).toContain('record_skipped');
    expect(runFull).toContain('skipped');
  });

  it('run-full 包含 production_ready=false', () => {
    const runFull = readRepoFile(runFullPath);
    expect(runFull).toContain('PRODUCTION_READY=false');
    expect(runFull).toContain('production_ready');
  });

  it('文档说明 Docker 只有 PostgreSQL 容器是正常的', () => {
    expect(readRepoFile(progressPath)).toContain('只有 PostgreSQL 容器是正常现象');
  });

  it('文档说明测试数据不会自动进入生产', () => {
    expect(readRepoFile(initSeparationPath)).toContain('不会自动带 PostgreSQL 测试数据');
  });

  it('文档说明删除测试容器和目录可最小化测试影响', () => {
    expect(readRepoFile(initSeparationPath)).toContain('删除测试容器、测试目录、测试源码可最小化测试影响');
  });

  it('文档说明生产必须新目录、新 env、新 DB volume、新 storage', () => {
    const doc = readRepoFile(initSeparationPath);
    expect(doc).toContain('新目录');
    expect(doc).toContain('新 `.env`');
    expect(doc).toContain('新 PostgreSQL volume');
    expect(doc).toContain('新 storage');
  });

  it('文档说明生产不得导入 mock 数据', () => {
    expect(readRepoFile(mockGuardPath)).toContain('生产脚本不得导入 mock 数据');
  });

  it('文档说明下一阶段才补 Runtime / 权限 / 页面 / 数据导入', () => {
    const runFull = readRepoFile(runFullPath);
    expect(runFull).toContain('下一阶段补 Runtime / 服务 / 动作注册');
    expect(runFull).toContain('下一阶段补权限和敏感字段');
    expect(runFull).toContain('下一阶段补页面 / 菜单 / 区块初始化');
    expect(runFull).toContain('下一阶段补 mock 数据导入');
  });
});
