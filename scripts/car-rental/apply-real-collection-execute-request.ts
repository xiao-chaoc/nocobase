import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  validateRealCollectionExecuteRequestFile,
  type RealCollectionExecuteRequest,
} from './validate-real-collection-execute-request';

const CONFIRMED_SUMMARY_PATH = 'test-data/generated/real-collection-execute-request.confirmed-summary.json';

export interface RealCollectionExecuteRequestDryRunSummary {
  databaseDialect: string;
  databaseSafetyLabel: string;
  isIsolatedDatabase: boolean;
  backupPlanConfirmed: boolean;
  rollbackPlanConfirmed: boolean;
  iopgpsRealSyncAllowed: boolean;
  mockDataOnly: boolean;
  collectionScope: string[];
  executeReason: string;
  operator: string;
  requestedAt: string;
  executionWindow: string;
  executed: false;
  writesDatabase: false;
  createsCollection: false;
  runsMigration: false;
  readsEnvFile: false;
}

function getArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index < 0) return null;
  return args[index + 1] ?? null;
}

function toDryRunSummary(request: RealCollectionExecuteRequest): RealCollectionExecuteRequestDryRunSummary {
  return {
    databaseDialect: request.database_dialect,
    databaseSafetyLabel: request.database_safety_label,
    isIsolatedDatabase: request.is_isolated_database,
    backupPlanConfirmed: request.backup_plan_confirmed,
    rollbackPlanConfirmed: request.rollback_plan_confirmed,
    iopgpsRealSyncAllowed: request.iopgps_real_sync_allowed,
    mockDataOnly: request.mock_data_only,
    collectionScope: request.collection_scope,
    executeReason: request.execute_reason,
    operator: request.operator,
    requestedAt: request.requested_at,
    executionWindow: request.execution_window,
    executed: false,
    writesDatabase: false,
    createsCollection: false,
    runsMigration: false,
    readsEnvFile: false,
  };
}

export function applyRealCollectionExecuteRequest(
  filePath: string,
  options: { execute?: boolean } = {},
): RealCollectionExecuteRequestDryRunSummary {
  const validation = validateRealCollectionExecuteRequestFile(filePath);
  if (!validation.valid || !validation.request) {
    throw new Error(`execute request 校验失败：\n${validation.blockers.map((blocker) => `- ${blocker}`).join('\n')}`);
  }

  const summary = toDryRunSummary(validation.request);
  if (options.execute) {
    fs.mkdirSync(path.dirname(CONFIRMED_SUMMARY_PATH), { recursive: true });
    fs.writeFileSync(CONFIRMED_SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  }
  return summary;
}

function main(): void {
  const args = process.argv.slice(2);
  const filePath = getArgValue(args, '--file');
  const execute = args.includes('--execute');
  if (!filePath) {
    // eslint-disable-next-line no-console
    console.error('请通过 --file 指定 test-data/generated/real-collection-execute-request.filled.json。');
    process.exitCode = 1;
    return;
  }

  try {
    const summary = applyRealCollectionExecuteRequest(filePath, { execute });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(summary, null, 2));
    if (execute) {
      // eslint-disable-next-line no-console
      console.log(`本轮 --execute 仅生成确认摘要，不创建 Collection：${CONFIRMED_SUMMARY_PATH}`);
    } else {
      // eslint-disable-next-line no-console
      console.log('dry-run 完成：未修改输入文件、未写数据库、未创建 Collection、未执行 migration、未读取 .env。');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
