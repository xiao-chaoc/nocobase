# car-rental 真实 Collection execute request JSON 输入 schema

本 schema 用于未来真实 Collection execute PR 的人工申请包。当前阶段只允许生成、填写、校验和 dry-run 应用 request；不得真实创建 Collection、不得执行 migration、不得写数据库、不得调用真实 IOPGPS。

## 推荐 JSON

```json
{
  "request_status": "pending_manual_confirmation",
  "target_version": "2.0.61",
  "package_manager": "yarn",
  "database_dialect": "postgresql",
  "database_safety_label": "isolated_test_database",
  "is_isolated_database": true,
  "is_production_like_database": false,
  "backup_plan_confirmed": true,
  "backup_artifact_reference": "请填写测试备份文件或备份编号，不要填写密码",
  "rollback_plan_confirmed": true,
  "rollback_command_reference": "请填写回滚文档或命令引用，不要填写密码",
  "iopgps_real_sync_allowed": false,
  "mock_data_only": true,
  "collection_scope": [
    "drivers",
    "vehicles",
    "lease_contracts",
    "rent_daily_ledgers",
    "rent_payments",
    "rent_payment_allocations",
    "deposit_records",
    "operation_logs"
  ],
  "execute_reason": "请填写为什么需要执行真实 Collection 注册",
  "operator": "请填写操作人",
  "requested_at": "YYYY-MM-DD",
  "execution_window": "请填写预计执行窗口",
  "dry_run_first": true,
  "allow_real_execution": false
}
```

## 校验规则

1. `request_status` 初始必须是 `pending_manual_confirmation`。
2. `target_version` 必须是 `2.0.61`。
3. `package_manager` 必须是 `yarn`。
4. `database_dialect` 必须是 `postgresql`。
5. `database_safety_label` 必须明确是 `isolated_test_database`。
6. `is_isolated_database` 必须是 `true`。
7. `is_production_like_database` 必须是 `false`。
8. `backup_plan_confirmed` 必须是 `true`。
9. `backup_artifact_reference` 必须非空，但不能包含密码、密钥或 secret 值。
10. `rollback_plan_confirmed` 必须是 `true`。
11. `rollback_command_reference` 必须非空，但不能包含密码、密钥或 secret 值。
12. `iopgps_real_sync_allowed` 必须是 `false`。
13. `mock_data_only` 必须是 `true`。
14. `collection_scope` 只能包含最小 8 个 Collection：`drivers`、`vehicles`、`lease_contracts`、`rent_daily_ledgers`、`rent_payments`、`rent_payment_allocations`、`deposit_records`、`operation_logs`。
15. `allow_real_execution` 默认必须是 `false`。
16. 任何真实 execute 必须另起 PR，并且不能由本轮执行。
17. request 不得包含 `APP_KEY`、`DB_PASSWORD`、`INIT_ROOT_PASSWORD`、`IOPGPS_LOGIN_KEY`、`access_token`、`login_key` 或任何 `password` 字段。
18. 校验脚本不得读取 `.env` 或 `.env.test`，不得连接 NocoBase，且不得写数据库。
