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

## 9. 一键隔离测试执行器

推荐在 NAS / 本地 Docker 环境使用 `scripts/car-rental/run-isolated-collection-registration-test.sh` 替代手工串联步骤。该脚本默认 `prepare-only`，只执行 env safety、compose up、DB health check、backup、request generation、validate request、apply dry-run、preflight 与总报告，不创建 Collection。

真实隔离测试 execute 必须同时满足：`CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true`、`--execute`、`--confirm-real-collection-execute`、备份文件存在、request 校验通过、preflight with request 无 blockers。脚本仍只适用于隔离 PostgreSQL 测试库；Docker 运行环境仍需要数据库隔离和备份，不可直接生产部署。

## 当前 PR 执行包更新

当前 execute 包已从草案推进为隔离测试库真实注册逻辑：允许在 NocoBase v2.0.61 宿主工程的隔离 PostgreSQL 测试库中创建最小 8 个 Collection。范围仅限 `drivers`、`vehicles`、`lease_contracts`、`rent_daily_ledgers`、`rent_payments`、`rent_payment_allocations`、`deposit_records`、`operation_logs`，不包含合同文档、IOPGPS、页面、权限、服务动作或测试数据导入。

执行命令：

```bash
CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true bash scripts/car-rental/run-isolated-collection-registration-test.sh --execute --confirm-real-collection-execute
```

Docker 隔离不等于数据库安全，仍必须使用 `isolated_test_database` safety label，并在 execute 前生成备份。失败时使用：

```bash
scripts/car-rental/restore-collection-test-db.sh <backup-file>
```

即使 execute 和 post-validate 成功，也不得标记 `production_ready`；下一阶段才处理 Runtime、权限、页面和数据导入。

## NAS 一键 runner 兼容性补充

- 推荐优先使用 `bash scripts/car-rental/run-isolated-collection-registration-test.sh` 一键执行隔离测试准备流程，不再手动逐步执行 compose 启动、备份、filled request 生成、request 校验、apply dry-run 和 preflight。
- Synology NAS 环境可能只有 `node` 和 `npm`，没有 `yarn`、`npx` 或 `node_modules/.bin/ts-node`；一键 runner 会依次尝试 `node_modules/.bin/ts-node`、`npx ts-node`、`npm exec --package=ts-node --package=typescript -- ts-node`，不可用时输出手工 fallback 步骤。
- `docker-compose` 1.28.5 不支持 Compose 顶层 `name` 字段；隔离测试项目名应由命令参数 `-p car-rental-collection-test` 提供。
- PostgreSQL 端口映射必须是 `53240:5432`，不能是 `53240:53240`；容器内 PostgreSQL target port 仍是 `5432`。
- 生产前删除测试容器、测试 network、测试 storage、测试备份和测试源码目录后，在生产新目录重新 clone，可以最小化测试影响；但生产仍必须使用新目录、新 `.env`、新 PostgreSQL 数据目录 / volume、新 storage 和新数据库，不能复用测试 dump、filled request 或 mock 数据。

## 正式版前一键隔离总测试补充

- 当前测试策略将从逐步手工执行每个小门禁，调整为正式版前集中运行 `bash scripts/car-rental/run-full-isolated-system-test.sh` 的一键隔离总测试流程。
- 用户可在正式版前运行 full isolated system test，由总控脚本集中调用已存在阶段，并把尚未实现的 Runtime / 权限 / 页面 / mock 数据 / smoke test / 合同文件 / GPS mock / 备份回滚阶段记录为 skipped 和 modification_items。
- 当前 Docker 只有 PostgreSQL 容器是正常现象；`docker-compose.car-rental-collection-test.yml` 只用于隔离 PostgreSQL 测试库，不是完整 NocoBase 应用部署。
- 完整 NocoBase 应用容器部署会在后续生产初始化阶段单独处理，不应与隔离测试 compose 混用。
- 测试和生产必须使用不同目录、不同 `.env`、不同 PostgreSQL DB volume、不同 storage。
- 生产前重新 clone 项目不会自动携带 PostgreSQL 测试数据；GitHub 拉取源码不会拉取 NAS 本地 volume、storage、dump 或 ignored env。
- 不要复用测试 dump / storage / env 到生产，也不要把 filled request、backup dump、SQL 文件或测试 `.env` 提交到 Git。

## Codex-only / 本地 NAS 测试暂停补充（2026-06-11）

- local NAS paused：用户已删除本地 NAS 测试目录。
- Docker containers deleted by user：用户已删除本地 Docker 测试容器。
- current local test not required：当前 Codex-only 模式下不再要求用户执行本地 Docker、PostgreSQL、run-full、backup dump 或 filled request 步骤。
- Codex 继续在 GitHub 仓库中维护测试脚本、dry-run 报告、mock 报告、报告模板和 modification_items。
- run-full retained for future pre-release execution：`scripts/car-rental/run-full-isolated-system-test.sh` 保留为未来正式版前本地/NAS 执行入口，当前不要求用户运行。
- 这些脚本保留用于正式版前恢复本地/NAS 测试；真实执行移动到 pre-release local execution 阶段。
- 生产初始化仍必须与测试初始化分离。
- 正式生产部署前必须重新 clone、使用新目录、新 `.env`、新 PostgreSQL volume、新 storage。
- 生产前重新 clone 不会带测试数据库数据，前提是不复用测试 volume、storage、dump、filled request 或 env。
- production_ready=false；mock data cannot enter production。
