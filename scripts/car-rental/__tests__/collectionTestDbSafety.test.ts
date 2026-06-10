import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { buildRealCollectionExecuteRequestFromTestDb } from '../generate-real-collection-execute-request-from-test-db';

const rootDir = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function makeTempRootWithBackup(): { root: string; backup: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'car-rental-collection-test-db-'));
  const backup = path.join(root, 'backups-test/car-rental/pre-real-collection-register-20260610-000000.dump');
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, 'placeholder dump path only for unit test', 'utf8');
  return { root, backup };
}

describe('collectionTestDbSafety', () => {
  it('example env 存在', () => {
    expect(exists('.env.car-rental-collection-test.example')).toBe(true);
  });

  it('docker compose 草案存在', () => {
    expect(exists('docker-compose.car-rental-collection-test.yml')).toBe(true);
  });

  it('backup 脚本存在', () => {
    expect(exists('scripts/car-rental/backup-collection-test-db.sh')).toBe(true);
  });

  it('restore 脚本存在', () => {
    expect(exists('scripts/car-rental/restore-collection-test-db.sh')).toBe(true);
  });

  it('safety 脚本存在', () => {
    expect(exists('scripts/car-rental/validate-collection-test-db-safety.ts')).toBe(true);
  });

  it('request 预填充脚本存在', () => {
    expect(exists('scripts/car-rental/generate-real-collection-execute-request-from-test-db.ts')).toBe(true);
  });

  it('example env 不包含真实密码', () => {
    const env = read('.env.car-rental-collection-test.example');
    expect(env).toContain('DB_PASSWORD=TEST_ONLY_CHANGE_ME');
    expect(env).not.toMatch(/password\s*=\s*(?!TEST_ONLY_CHANGE_ME)(?!.*CHANGE_ME).{12,}/i);
  });

  it('example env 不包含 APP_KEY', () => {
    expect(read('.env.car-rental-collection-test.example')).not.toContain('APP_KEY');
  });

  it('example env 不包含 IOPGPS_LOGIN_KEY', () => {
    expect(read('.env.car-rental-collection-test.example')).not.toContain('IOPGPS_LOGIN_KEY');
  });

  it('DB_DATABASE 包含 test', () => {
    expect(read('.env.car-rental-collection-test.example')).toContain(
      'DB_DATABASE=nocobase_car_rental_collection_test',
    );
  });

  it('IOPGPS_SYNC_ENABLED=false', () => {
    expect(read('.env.car-rental-collection-test.example')).toContain('IOPGPS_SYNC_ENABLED=false');
  });

  it('CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false', () => {
    expect(read('.env.car-rental-collection-test.example')).toContain('CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false');
  });

  it('backup 脚本拒绝非测试库名', () => {
    const script = read('scripts/car-rental/backup-collection-test-db.sh');
    expect(script).toContain('contains_test_marker "$DB_DATABASE"');
    expect(script).toContain('拒绝备份');
  });

  it('restore 脚本要求确认', () => {
    const script = read('scripts/car-rental/restore-collection-test-db.sh');
    expect(script).toContain('请输入 YES 继续');
    expect(script).toContain('[ "$CONFIRMATION" = "YES" ]');
  });

  it('request 预填充脚本要求 backup 文件存在', () => {
    const script = read('scripts/car-rental/generate-real-collection-execute-request-from-test-db.ts');
    expect(script).toContain('fs.existsSync(absoluteBackupPath)');
    expect(script).toContain('备份文件不存在');
  });

  it('request 预填充脚本生成 allow_real_execution=false', () => {
    const request = buildRealCollectionExecuteRequestFromTestDb(
      'backups-test/car-rental/pre-real-collection-register-20260610-000000.dump',
    );
    expect(request.allow_real_execution).toBe(false);
  });

  it('request 预填充脚本不输出 DB_PASSWORD', () => {
    const script = read('scripts/car-rental/generate-real-collection-execute-request-from-test-db.ts');
    expect(script).not.toContain('DB_PASSWORD');
  });

  it('.gitignore 忽略 .env.car-rental-collection-test', () => {
    expect(read('.gitignore')).toContain('.env.car-rental-collection-test');
  });

  it('.gitignore 忽略 backups-test', () => {
    expect(read('.gitignore')).toContain('backups-test/');
  });

  it('.gitignore 忽略 *.dump', () => {
    expect(read('.gitignore')).toContain('*.dump');
  });

  it('request builder 使用真实 backup 路径作为引用且不读取 dump 内容', () => {
    const { backup } = makeTempRootWithBackup();
    const relativeBackup = path.relative(rootDir, backup);
    const request = buildRealCollectionExecuteRequestFromTestDb(relativeBackup);
    expect(request.backup_artifact_reference).toBe(relativeBackup);
    expect(request.rollback_command_reference).toContain(relativeBackup);
    expect(request.iopgps_real_sync_allowed).toBe(false);
    expect(request.mock_data_only).toBe(true);
  });
});
