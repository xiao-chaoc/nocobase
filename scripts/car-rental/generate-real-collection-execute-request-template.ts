import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MINIMAL_COLLECTION_SCOPE,
  type RealCollectionExecuteRequest,
} from './validate-real-collection-execute-request';

export const EXECUTE_REQUEST_TEMPLATE_PATH = 'test-data/generated/real-collection-execute-request.template.json';

export function buildRealCollectionExecuteRequestTemplate(): RealCollectionExecuteRequest {
  return {
    request_status: 'pending_manual_confirmation',
    target_version: '2.0.61',
    package_manager: 'yarn',
    database_dialect: 'postgresql',
    database_safety_label: 'isolated_test_database',
    is_isolated_database: true,
    is_production_like_database: false,
    backup_plan_confirmed: true,
    backup_artifact_reference: '请填写测试备份文件或备份编号，不要填写密码',
    rollback_plan_confirmed: true,
    rollback_command_reference: '请填写回滚文档或命令引用，不要填写密码',
    iopgps_real_sync_allowed: false,
    mock_data_only: true,
    collection_scope: [...MINIMAL_COLLECTION_SCOPE],
    execute_reason: '请填写为什么需要执行真实 Collection 注册',
    operator: '请填写操作人',
    requested_at: 'YYYY-MM-DD',
    execution_window: '请填写预计执行窗口',
    dry_run_first: true,
    allow_real_execution: false,
  };
}

export function writeRealCollectionExecuteRequestTemplate(
  filePath = EXECUTE_REQUEST_TEMPLATE_PATH,
): RealCollectionExecuteRequest {
  const template = buildRealCollectionExecuteRequestTemplate();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  return template;
}

function main(): void {
  writeRealCollectionExecuteRequestTemplate();
  // eslint-disable-next-line no-console
  console.log(`已生成真实 Collection execute request 模板：${EXECUTE_REQUEST_TEMPLATE_PATH}`);
  // eslint-disable-next-line no-console
  console.log(
    '请复制为 test-data/generated/real-collection-execute-request.filled.json 后人工填写；filled.json 不应提交。',
  );
}

if (require.main === module) {
  main();
}
