import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { applyRealCollectionExecuteRequest } from '../apply-real-collection-execute-request';
import { buildRealCollectionExecuteRequestTemplate } from '../generate-real-collection-execute-request-template';
import { buildRealCollectionExecutePreflightContext } from '../realCollectionExecutePreflight';
import {
  validateRealCollectionExecuteRequestObject,
  type RealCollectionExecuteRequest,
} from '../validate-real-collection-execute-request';

const rootDir = process.cwd();

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function makeRequest(overrides: Partial<RealCollectionExecuteRequest> = {}): RealCollectionExecuteRequest {
  return {
    ...buildRealCollectionExecuteRequestTemplate(),
    execute_reason: '在隔离测试库验证最小 Collection 注册流程。',
    operator: 'codex-operator',
    requested_at: '2026-06-09',
    execution_window: '2026-06-09 10:00-11:00 UTC',
    backup_artifact_reference: 'test-backup-artifact-001',
    rollback_command_reference: 'docs/runbooks/rollback-test-db.md#collection-execute',
    ...overrides,
  };
}

function writeTempRequest(request: RealCollectionExecuteRequest): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'car-rental-execute-request-'));
  const filePath = path.join(dir, 'request.json');
  fs.writeFileSync(filePath, `${JSON.stringify(request, null, 2)}\n`, 'utf8');
  return filePath;
}

function expectInvalid(overrides: Partial<RealCollectionExecuteRequest>, text: string): void {
  const result = validateRealCollectionExecuteRequestObject(makeRequest(overrides));
  expect(result.valid).toBe(false);
  expect(result.blockers.join('\n')).toContain(text);
}

describe('realCollectionExecuteRequest', () => {
  it('template 生成脚本存在', () => {
    expect(fileExists('scripts/car-rental/generate-real-collection-execute-request-template.ts')).toBe(true);
  });

  it('validate request 脚本存在', () => {
    expect(fileExists('scripts/car-rental/validate-real-collection-execute-request.ts')).toBe(true);
  });

  it('apply request 脚本存在', () => {
    expect(fileExists('scripts/car-rental/apply-real-collection-execute-request.ts')).toBe(true);
  });

  it('schema 文档存在', () => {
    expect(fileExists('docs/car-rental-real-collection-execute-request-schema.md')).toBe(true);
  });

  it('operator checklist 存在', () => {
    expect(fileExists('docs/car-rental-real-collection-execute-request-checklist.md')).toBe(true);
  });

  it('review checklist 存在', () => {
    expect(fileExists('docs/car-rental-real-collection-execute-review-checklist.md')).toBe(true);
  });

  it('template 不包含 APP_KEY', () => {
    expect(JSON.stringify(buildRealCollectionExecuteRequestTemplate())).not.toContain('APP_KEY');
  });

  it('template 不包含 DB_PASSWORD', () => {
    expect(JSON.stringify(buildRealCollectionExecuteRequestTemplate())).not.toContain('DB_PASSWORD');
  });

  it('template 不包含 IOPGPS_LOGIN_KEY', () => {
    expect(JSON.stringify(buildRealCollectionExecuteRequestTemplate())).not.toContain('IOPGPS_LOGIN_KEY');
  });

  it('target_version 不是 2.0.61 时失败', () => {
    expectInvalid({ target_version: '2.0.60' }, 'target_version 必须是 2.0.61。');
  });

  it('package_manager 不是 yarn 时失败', () => {
    expectInvalid({ package_manager: 'pnpm' }, 'package_manager 必须是 yarn。');
  });

  it('database_dialect 不是 postgresql 时失败', () => {
    expectInvalid({ database_dialect: 'postgres' }, 'database_dialect 必须是 postgresql。');
  });

  it('is_isolated_database = false 时失败', () => {
    expectInvalid({ is_isolated_database: false }, 'is_isolated_database 必须是 true。');
  });

  it('is_production_like_database = true 时失败', () => {
    expectInvalid({ is_production_like_database: true }, 'is_production_like_database 必须是 false。');
  });

  it('backup_plan_confirmed = false 时失败', () => {
    expectInvalid({ backup_plan_confirmed: false }, 'backup_plan_confirmed 必须是 true。');
  });

  it('rollback_plan_confirmed = false 时失败', () => {
    expectInvalid({ rollback_plan_confirmed: false }, 'rollback_plan_confirmed 必须是 true。');
  });

  it('iopgps_real_sync_allowed = true 时失败', () => {
    expectInvalid({ iopgps_real_sync_allowed: true }, 'iopgps_real_sync_allowed 必须是 false。');
  });

  it('mock_data_only = false 时失败', () => {
    expectInvalid({ mock_data_only: false }, 'mock_data_only 必须是 true。');
  });

  it('collection_scope 包含非 8 个最小 Collection 时失败', () => {
    expectInvalid(
      { collection_scope: ['drivers', 'contract_documents'] },
      'collection_scope 只能包含最小 8 个 Collection。',
    );
  });

  it('缺少 operator 时失败', () => {
    expectInvalid({ operator: '' }, 'operator 必须非空。');
  });

  it('缺少 execute_reason 时失败', () => {
    expectInvalid({ execute_reason: '' }, 'execute_reason 必须非空。');
  });

  it('包含 password 字段时失败', () => {
    const request = { ...makeRequest(), password: 'secret' };
    const result = validateRealCollectionExecuteRequestObject(request);
    expect(result.valid).toBe(false);
    expect(result.blockers.join('\n')).toContain('password 字段');
  });

  it('filled.json 被 .gitignore 忽略', () => {
    const gitignore = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
    expect(gitignore).toContain('test-data/generated/real-collection-execute-request.filled.json');
    expect(gitignore).toContain('test-data/generated/real-collection-execute-request.*filled*.json');
  });

  it('preflight 不带 request 时仍可报告 blockers', () => {
    const context = buildRealCollectionExecutePreflightContext({ env: {} });
    expect(context.blockers.join('\n')).toContain('数据库类型未明确为 postgres / postgresql。');
    expect(context.blockers.join('\n')).toContain('未明确确认当前数据库是隔离测试库。');
  });

  it('preflight 带合法 request 时可消除 request 对应 blockers', () => {
    const requestFile = writeTempRequest(makeRequest());
    const context = buildRealCollectionExecutePreflightContext({ env: {}, requestFile });
    const blockers = context.blockers.join('\n');
    expect(context.executeRequestApplied).toBe(true);
    expect(blockers).not.toContain('数据库类型未明确为 postgres / postgresql。');
    expect(blockers).not.toContain('未明确确认当前数据库是隔离测试库。');
    expect(blockers).not.toContain('未确认数据库备份计划。');
    expect(blockers).not.toContain('未确认回滚计划。');
    expect(blockers).not.toContain('未确认只允许 mock 数据。');
  });

  it('apply request 默认 dry-run 不创建 Collection', () => {
    const requestFile = writeTempRequest(makeRequest());
    const summary = applyRealCollectionExecuteRequest(requestFile);
    expect(summary.createsCollection).toBe(false);
    expect(summary.executed).toBe(false);
  });

  it('apply request 不写数据库', () => {
    const requestFile = writeTempRequest(makeRequest());
    expect(applyRealCollectionExecuteRequest(requestFile).writesDatabase).toBe(false);
  });

  it('apply request 不读取 .env', () => {
    const requestFile = writeTempRequest(makeRequest());
    expect(applyRealCollectionExecuteRequest(requestFile).readsEnvFile).toBe(false);
  });
});
