import fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertCanStartRealCollectionAdapter,
  detectNocobaseHostEnvironment,
  summarizeNocobaseHostEnvironment,
} from '../realHostEnvironmentDetector';

function makeTempHost(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-host-detector-'));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'nocobase', packageManager: 'pnpm@9.0.0' }, null, 2),
  );
  const files = [
    'packages/core/app/package.json',
    'packages/core/server/package.json',
    'packages/core/database/package.json',
    'packages/core/app/src/index.ts',
    'packages/core/database/src/database.ts',
    'packages/core/database/src/collection.ts',
    'packages/core/database/src/dialects/postgres-dialect.ts',
    'packages/core/logger/src/index.ts',
    'packages/core/server/src/plugin-manager.ts',
    'packages/core/acl/src/acl.ts',
    'packages/plugins/@nocobase/plugin-ui-schema-storage/src/server/index.ts',
    'packages/plugins/@nocobase/plugin-workflow/src/server/index.ts',
    'packages/plugins/@nocobase/plugin-workflow-delay/src/server/index.ts',
    'packages/plugins/@nocobase/plugin-localization/src/index.ts',
    'packages/plugins/@nocobase/plugin-file-manager/src/server/index.ts',
    'packages/plugins/@nocobase/plugin-action-print/src/index.ts',
    'packages/plugins/plugin-rental-core/package.json',
    'packages/plugins/plugin-contract-documents/package.json',
    'packages/plugins/plugin-iopgps/package.json',
    'packages/shared/nocobase-automation/package.json',
  ];
  for (const file of files) {
    const absolute = path.join(root, file);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(
      absolute,
      file.endsWith('package.json') && file.includes('@nocobase') ? JSON.stringify({ version: '2.0.61' }) : '',
    );
  }
  fs.writeFileSync(path.join(root, 'packages/core/app/package.json'), JSON.stringify({ version: '2.0.61' }));
  return root;
}

describe('realHostEnvironmentDetector', () => {
  let tempRoots: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const root of tempRoots) fs.rmSync(root, { recursive: true, force: true });
    tempRoots = [];
  });

  beforeEach(() => {
    tempRoots = [];
  });

  it('detectNocobaseHostEnvironment 能返回结构化结果', () => {
    const root = makeTempHost();
    tempRoots.push(root);

    const result = detectNocobaseHostEnvironment({ rootDir: root });

    expect(result).toMatchObject({
      target_version: '2.0.61',
      package_manager: 'pnpm',
      is_nocobase_host: true,
      has_app: true,
      has_db: true,
      has_collection_manager: true,
      safety: {
        reads_env_file: false,
        connects_database: false,
        calls_iopgps: false,
        writes_business_data: false,
      },
    });
    expect(result.capability_matrix.app).toBe('present');
  });

  it('summarizeNocobaseHostEnvironment 能输出中文摘要', () => {
    const root = makeTempHost();
    tempRoots.push(root);
    const result = detectNocobaseHostEnvironment({ rootDir: root });

    const summary = summarizeNocobaseHostEnvironment(result);

    expect(summary).toContain('NocoBase v2.0.61 真实环境检测 Adapter 摘要');
    expect(summary).toContain('完整 NocoBase 宿主工程');
    expect(summary).toContain('Collection Manager / Repository 能力');
  });

  it('assertCanStartRealCollectionAdapter 能在缺少 db / collection manager 时失败', () => {
    const root = makeTempHost();
    tempRoots.push(root);
    fs.rmSync(path.join(root, 'packages/core/database/src/database.ts'));
    fs.rmSync(path.join(root, 'packages/core/database/src/collection.ts'));

    const result = detectNocobaseHostEnvironment({ rootDir: root });

    expect(() => assertCanStartRealCollectionAdapter(result)).toThrow(/db|collection/i);
  });

  it('assertCanStartRealCollectionAdapter 能在非 v2.0.61 时失败', () => {
    const root = makeTempHost();
    tempRoots.push(root);
    fs.writeFileSync(path.join(root, 'packages/core/app/package.json'), JSON.stringify({ version: '2.0.60' }));

    const result = detectNocobaseHostEnvironment({ rootDir: root });

    expect(() => assertCanStartRealCollectionAdapter(result)).toThrow(/2\.0\.61/);
  });

  it('脚本检测逻辑不读取 .env 真实值，也不输出敏感密钥', () => {
    const root = makeTempHost();
    tempRoots.push(root);
    fs.writeFileSync(
      path.join(root, '.env'),
      ['APP_KEY=secret-app-key', 'DB_PASSWORD=secret-db-password', 'IOPGPS_LOGIN_KEY=secret-iopgps-key'].join('\n'),
    );
    const readFileSpy = vi.spyOn(fs, 'readFileSync');

    const result = detectNocobaseHostEnvironment({ rootDir: root });
    const serialized = JSON.stringify(result) + summarizeNocobaseHostEnvironment(result);

    expect(readFileSpy.mock.calls.some(([file]) => String(file).endsWith('.env'))).toBe(false);
    expect(serialized).not.toContain('secret-app-key');
    expect(serialized).not.toContain('secret-db-password');
    expect(serialized).not.toContain('secret-iopgps-key');
    expect(serialized).not.toContain('APP_KEY=');
    expect(serialized).not.toContain('DB_PASSWORD=');
    expect(serialized).not.toContain('IOPGPS_LOGIN_KEY=');
  });

  it('检测过程不连接真实数据库、不调用真实 IOPGPS、不写业务数据', () => {
    const root = makeTempHost();
    tempRoots.push(root);

    const result = detectNocobaseHostEnvironment({ rootDir: root });

    expect(result.safety.connects_database).toBe(false);
    expect(result.safety.calls_iopgps).toBe(false);
    expect(result.safety.writes_business_data).toBe(false);
  });
});
