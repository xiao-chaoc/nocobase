import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MINIMAL_COLLECTION_SCOPE,
  type RealCollectionExecuteRequest,
} from './validate-real-collection-execute-request';
import { validateCollectionTestDbSafety } from './validate-collection-test-db-safety';

const OUTPUT_PATH = 'test-data/generated/real-collection-execute-request.filled.json';

function getArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] ?? null;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildRealCollectionExecuteRequestFromTestDb(backupPath: string): RealCollectionExecuteRequest {
  return {
    request_status: 'pending_manual_confirmation',
    target_version: '2.0.61',
    package_manager: 'yarn',
    database_dialect: 'postgresql',
    database_safety_label: 'isolated_test_database',
    is_isolated_database: true,
    is_production_like_database: false,
    backup_plan_confirmed: true,
    backup_artifact_reference: backupPath,
    rollback_plan_confirmed: true,
    rollback_command_reference: `scripts/car-rental/restore-collection-test-db.sh ${backupPath}`,
    iopgps_real_sync_allowed: false,
    mock_data_only: true,
    collection_scope: [...MINIMAL_COLLECTION_SCOPE],
    execute_reason: '在隔离 NocoBase v2.0.61 PostgreSQL 测试库中验证 car-rental 核心 Collection 最小范围真实注册能力。',
    operator: 'xiao-chaoc',
    requested_at: todayUtc(),
    execution_window: '待人工填写隔离测试库执行窗口',
    dry_run_first: true,
    allow_real_execution: false,
  };
}

export function generateRealCollectionExecuteRequestFromTestDb(
  backupPath: string,
  options: { rootDir?: string; outputPath?: string } = {},
): RealCollectionExecuteRequest {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const outputPath = options.outputPath ?? OUTPUT_PATH;
  const absoluteBackupPath = path.resolve(rootDir, backupPath);
  if (!backupPath.trim()) {
    throw new Error('必须通过 --backup 提供备份文件路径。');
  }
  if (!fs.existsSync(absoluteBackupPath)) {
    throw new Error(`备份文件不存在，不生成 filled request：${backupPath}`);
  }

  const safety = validateCollectionTestDbSafety(rootDir);
  if (!safety.valid) {
    throw new Error(
      `隔离测试库 safety check 未通过，不生成 filled request：\n${safety.blockers.map((item) => `- ${item}`).join('\n')}`,
    );
  }

  const request = buildRealCollectionExecuteRequestFromTestDb(backupPath);
  const absoluteOutputPath = path.resolve(rootDir, outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(request, null, 2)}\n`, 'utf8');
  return request;
}

function main(): void {
  const backup = getArgValue(process.argv.slice(2), '--backup');
  if (!backup) {
    console.error('请通过 --backup 指定 backups-test/car-rental/pre-real-collection-register-xxxx.dump。');
    process.exitCode = 1;
    return;
  }

  try {
    const request = generateRealCollectionExecuteRequestFromTestDb(backup);
    console.log(`已生成 ${OUTPUT_PATH}，请勿提交该文件。`);
    console.log(
      JSON.stringify(
        {
          database_dialect: request.database_dialect,
          database_safety_label: request.database_safety_label,
          backup_artifact_reference: request.backup_artifact_reference,
          rollback_command_reference: request.rollback_command_reference,
          allow_real_execution: request.allow_real_execution,
          iopgps_real_sync_allowed: request.iopgps_real_sync_allowed,
          mock_data_only: request.mock_data_only,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
