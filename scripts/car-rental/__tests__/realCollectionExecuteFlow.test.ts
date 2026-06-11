import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runControlledRealCollectionRegistration } from '../execute-real-collection-registration';
import { buildPendingPostValidateReport } from '../post-validate-real-collection-registration';
import { MINIMAL_COLLECTION_SCOPE } from '../validate-real-collection-execute-request';

const executeScript = fs.readFileSync(path.resolve(__dirname, '../execute-real-collection-registration.ts'), 'utf8');
const adapterScript = fs.readFileSync(path.resolve(__dirname, '../realNocobaseCollectionAdapter.ts'), 'utf8');
const runnerScript = fs.readFileSync(
  path.resolve(__dirname, '../run-isolated-collection-registration-test.sh'),
  'utf8',
);

function tempFile(name: string, payload: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'car-rental-execute-flow-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return file;
}

function backupFile(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'car-rental-backup-'));
  const file = path.join(dir, 'backup.dump');
  fs.writeFileSync(file, 'test backup placeholder', 'utf8');
  return file;
}

function validRequest(backup: string, overrides: Record<string, unknown> = {}) {
  return {
    allow_real_execution: false,
    target_version: '2.0.61',
    package_manager: 'yarn',
    database_dialect: 'postgresql',
    database_safety_label: 'isolated_test_database',
    is_isolated_database: true,
    is_production_like_database: false,
    backup_plan_confirmed: true,
    iopgps_real_sync_allowed: false,
    mock_data_only: true,
    collection_scope: [...MINIMAL_COLLECTION_SCOPE],
    backup_artifact_reference: backup,
    rollback_command_reference: `scripts/car-rental/restore-collection-test-db.sh ${backup}`,
    ...overrides,
  };
}

function validPreflight(overrides: Record<string, unknown> = {}) {
  return { blockers: [], context: { blockers: [] }, validation: { blockers: [] }, ...overrides };
}

describe('car-rental real collection execute flow gates', () => {
  it('execute script without --execute is dry-run and writes production_ready=false report', async () => {
    const output = tempFile('dry-run-result.json', {});
    const result = await runControlledRealCollectionRegistration(['--output', output]);
    expect(result.mode).toBe('dry-run');
    expect(result.production_ready).toBe(false);
    expect(JSON.parse(fs.readFileSync(output, 'utf8')).production_ready).toBe(false);
  });

  it('execute script rejects when --confirm-real-collection-execute is missing', async () => {
    const backup = backupFile();
    const request = tempFile('request.json', validRequest(backup));
    const preflight = tempFile('preflight.json', validPreflight());
    await expect(
      runControlledRealCollectionRegistration([
        '--request',
        request,
        '--preflight',
        preflight,
        '--backup',
        backup,
        '--execute',
        '--runtime-allow-real-execution',
      ]),
    ).rejects.toThrow('--confirm-real-collection-execute');
  });

  it('execute script rejects when --runtime-allow-real-execution is missing', async () => {
    expect(executeScript).toContain('--runtime-allow-real-execution');
  });

  it('execute script rejects missing request, preflight, and backup files', async () => {
    await expect(
      runControlledRealCollectionRegistration([
        '--request',
        '/tmp/missing-request.json',
        '--preflight',
        '/tmp/missing-preflight.json',
        '--backup',
        '/tmp/missing-backup.dump',
        '--execute',
        '--confirm-real-collection-execute',
        '--runtime-allow-real-execution',
      ]),
    ).rejects.toThrow('request 文件不存在');
  });

  it('execute script rejects preflight blockers', async () => {
    const backup = backupFile();
    const request = tempFile('request.json', validRequest(backup));
    const preflight = tempFile('preflight.json', validPreflight({ blockers: ['blocked'] }));
    await expect(
      runControlledRealCollectionRegistration([
        '--request',
        request,
        '--preflight',
        preflight,
        '--backup',
        backup,
        '--execute',
        '--confirm-real-collection-execute',
        '--runtime-allow-real-execution',
      ]),
    ).rejects.toThrow('preflight 存在 blockers');
  });

  it('execute script rejects non-postgresql, non-isolated, IOPGPS true, and mockDataOnly false gates', async () => {
    const backup = backupFile();
    const request = tempFile(
      'request.json',
      validRequest(backup, {
        database_dialect: 'mysql',
        database_safety_label: 'unsafe',
        iopgps_real_sync_allowed: true,
        mock_data_only: false,
      }),
    );
    const preflight = tempFile('preflight.json', validPreflight());
    await expect(
      runControlledRealCollectionRegistration([
        '--request',
        request,
        '--preflight',
        preflight,
        '--backup',
        backup,
        '--execute',
        '--confirm-real-collection-execute',
        '--runtime-allow-real-execution',
      ]),
    ).rejects.toThrow('database_dialect 必须是 postgresql');
  });

  it('execute script rejects when CAR_RENTAL_COLLECTION_EXECUTE_ENABLED is not true', async () => {
    expect(executeScript).toContain("process.env.CAR_RENTAL_COLLECTION_EXECUTE_ENABLED !== 'true'");
  });

  it('adapter contains registerCollectionsForReal and executeRealCollectionRegistration', () => {
    expect(adapterScript).toContain('registerCollectionsForReal');
    expect(adapterScript).toContain('executeRealCollectionRegistration');
  });

  it('post-validate does not fake success when real verification is unavailable', () => {
    const report = buildPendingPostValidateReport('out.json', 'no database');
    expect(report.overallStatus).toBe('pending_real_api_verification');
    expect(report.production_ready).toBe(false);
  });

  it('run-isolated execute mode passes --runtime-allow-real-execution and prints restore command on failure', () => {
    expect(runnerScript).toContain('--runtime-allow-real-execution');
    expect(runnerScript).toContain('restore-collection-test-db.sh');
  });
});
