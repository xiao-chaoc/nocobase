# car-rental 真实 Collection execute PR 审查包

> 阶段结论：本 PR 只固化 execute 审查包、受控 execute 脚本草案、post-validate 脚本草案与 rollback 演练说明；不执行真实 Collection 创建，不写数据库 schema，不执行 migration，不生产部署。

## 1. 执行目标

在隔离 NocoBase 2.0.61 PostgreSQL 测试库中注册 car-rental 核心 Collection 最小范围。

该目标只适用于已人工准备并确认的隔离测试库，不使用生产库，不连接生产环境，不启用真实 IOPGPS，不导入真实司机、车辆、付款或合同数据。

## 2. 目标版本与安全标签

- NocoBase = 2.0.61
- package_manager = yarn
- database_dialect = postgresql
- database_safety_label = isolated_test_database
- IOPGPS_SYNC_ENABLED = false
- mock_data_only = true

## 3. 最小 Collection 范围

本 execute 包只覆盖以下 8 个核心 Collection：

- `drivers`
- `vehicles`
- `lease_contracts`
- `rent_daily_ledgers`
- `rent_payments`
- `rent_payment_allocations`
- `deposit_records`
- `operation_logs`

## 4. 明确不包含

本 PR 和本阶段明确不包含：

- `contract_templates`
- `contract_documents`
- `gps_devices`
- `gps_daily_mileages`
- `gps_location_snapshots`
- `iopgps_settings`
- 页面
- 权限
- 服务动作
- 测试数据导入
- 合同生成
- IOPGPS 真实同步

## 5. 备份信息

- backup_artifact_reference = `backups-test/car-rental/pre-real-collection-register-20260610-235309.dump`

该 dump 文件是执行前必须人工确认存在的外部备份 artifact，不得提交到 Git。执行前必须确认该文件真实存在、可读，并且来源于目标隔离 PostgreSQL 测试库的执行前备份；不得为了通过审查伪造备份文件。

## 6. 回滚信息

- rollback_command_reference = `scripts/car-rental/restore-collection-test-db.sh backups-test/car-rental/pre-real-collection-register-20260610-235309.dump`

恢复前必须人工输入 `YES`。该命令只用于隔离测试库，不用于生产库或类生产库；恢复前必须再次确认目标数据库不是生产库，并保留回滚日志。

## 7. 进入 execute 前必须满足

- validate request 通过。
- apply dry-run 通过。
- preflight with request 通过。
- backup dump 存在。
- rollback 脚本存在。
- 当前 Git 工作区不包含 `.env`、`.env.test`、`filled.json`、`dump`、`sql`。
- 人工确认执行窗口。
- 人工确认 operator。
- 人工确认当前不是生产库。
- 人工确认 IOPGPS 禁用。
- execute request 在最终 execute PR 中才允许显式改为 `allow_real_execution=true`，且必须配套 `--execute` 与 `--confirm-real-collection-execute`。

## 8. 本 PR 不应执行

本轮只生成 execute 包，不执行真实 Collection 创建，不写数据库 schema，不执行 migration，不注册服务，不注册权限，不创建页面，不导入数据，不调用真实 IOPGPS，不生成合同文件。

如果需要进入最终 execute，必须另起单独 PR，重新附上人工确认结果、backup artifact、preflight with request 输出、rollback 演练记录与执行窗口。
