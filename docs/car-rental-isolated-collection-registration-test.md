# car-rental 一键隔离 Collection 注册测试执行器

## 1. 脚本目的

`scripts/car-rental/run-isolated-collection-registration-test.sh` 是给 NAS / 本地 Docker 环境使用的一键隔离测试执行器。它把 car-rental 最小 8 个 Collection 的隔离 PostgreSQL 测试流程串联为一个受控入口：环境安全检查、Docker Compose 启动、数据库健康检查、备份、execute request 生成、request 校验、apply dry-run、preflight、可选真实 execute、post-validate、总报告和失败回滚提示。

默认模式是 `prepare-only`，不 execute，不创建 Collection，不写数据库 schema，不执行 migration，不生产部署。

## 2. 为什么 Docker 仍需要隔离测试库

Docker 隔离不等于数据库安全。即使通过 `docker-compose.car-rental-collection-test.yml` 启动 PostgreSQL，也必须确认连接目标、数据库名称、env 安全标签和备份 artifact 都属于隔离测试库。脚本会检查 `DB_DIALECT=postgres/postgresql`、`DB_DATABASE` 包含 `test` / `car_rental` / `collection_test`、`CAR_RENTAL_DATABASE_SAFETY_LABEL=isolated_test_database`、`CAR_RENTAL_MOCK_DATA_ONLY=true`、`IOPGPS_SYNC_ENABLED=false`，并在 execute 模式要求 `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true`。

## 3. 脚本执行阶段

1. `env safety`：读取 `.env.car-rental-collection-test`，检查隔离测试库、安全标签、mock-only、IOPGPS 禁用和 execute env 开关。
2. `compose up`：默认启动 `docker-compose.car-rental-collection-test.yml`；可用 `--skip-compose-up` 跳过。
3. `DB health check`：等待 PostgreSQL healthy / `pg_isready`。
4. `backup`：调用 `scripts/car-rental/backup-collection-test-db.sh` 生成 dump，并确认备份文件存在。
5. `request generation`：调用 `scripts/car-rental/generate-real-collection-execute-request-from-test-db.ts` 生成本地 ignored 的 `test-data/generated/real-collection-execute-request.filled.json`。
6. `validate request`：调用 `scripts/car-rental/validate-real-collection-execute-request.ts`。
7. `apply dry-run`：调用 `scripts/car-rental/apply-real-collection-execute-request.ts`，只 dry-run。
8. `preflight`：调用 `scripts/car-rental/preflight-real-collection-execute.ts --request ...`。
9. `optional execute`：仅当显式传入 `--execute --confirm-real-collection-execute` 且 env 开关为 true 时，调用 `scripts/car-rental/execute-real-collection-registration.ts`。
10. `post-validate`：execute 后调用 `scripts/car-rental/post-validate-real-collection-registration.ts` 生成 JSON 报告；如果真实只读 NocoBase schema API 尚未验证，结果保持 `pending_real_api_verification`。
11. `report`：生成 `test-data/generated/isolated-collection-registration-test-report.generated.json`。
12. `rollback instruction`：失败时输出 `scripts/car-rental/restore-collection-test-db.sh <backup-file>`。

## 4. prepare-only 用法

默认不 execute，只完成 execute 前全部准备：

```bash
bash scripts/car-rental/run-isolated-collection-registration-test.sh
```

完成后脚本会输出：“已完成 execute 前全部准备，可以加 --execute 执行”。

## 5. 真实隔离测试 execute 用法

仅在 NAS / 本地 Docker 隔离测试库中执行，并且必须显式开启 env 门禁与人工确认参数：

```bash
CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true bash scripts/car-rental/run-isolated-collection-registration-test.sh --execute --confirm-real-collection-execute
```

真实 execute 仍必须通过 backup、validate request、apply dry-run、preflight with request、备份文件存在和 post-validate；不得跳过任何阶段。当前 execute 脚本如果真实 NocoBase Collection API 尚未完成验证，会受控失败并提示 `pending_real_api_verification`，不得伪造成功。

## 6. 跳过 compose up

如果 PostgreSQL 已经由人工启动，可以跳过 compose up，但仍会执行健康检查和所有安全门禁：

```bash
bash scripts/car-rental/run-isolated-collection-registration-test.sh --skip-compose-up
```

## 7. 数据库生命周期选项

- `--keep-db-running`：执行后保持隔离测试库运行。
- `--stop-db-after`：执行后停止隔离测试库。
- `--report-only`：仅检查已有总报告，不执行流程。

## 8. 如何回滚

如果 execute 或 post-validate 失败，使用脚本输出的回滚命令恢复隔离测试库，例如：

```bash
scripts/car-rental/restore-collection-test-db.sh backups-test/car-rental/pre-real-collection-register-20260610-235309.dump
```

恢复前必须人工确认目标仍是隔离测试库，按 restore 脚本提示输入 `YES`，并保留日志。

## 9. 禁止事项

- 不使用生产库或类生产库。
- 不启用真实 IOPGPS。
- 不使用真实司机资料。
- 不使用真实付款截图。
- 不使用真实合同扫描件。
- 不提交 `.env.car-rental-collection-test`。
- 不提交 backup dump。
- 不提交 filled request。
- 不提交 SQL 文件。
- 不标记 `production_ready`。
- 不直接生产部署。

## 10. 当前真实执行状态（v2.0.61）

本阶段已经允许在 **隔离 PostgreSQL 测试库** 中真实注册 car-rental 最小 8 个 Collection：`drivers`、`vehicles`、`lease_contracts`、`rent_daily_ledgers`、`rent_payments`、`rent_payment_allocations`、`deposit_records`、`operation_logs`。`prepare-only` 模式仍不创建 Collection；只有以下命令会进入真实 execute：

```bash
CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true bash scripts/car-rental/run-isolated-collection-registration-test.sh --execute --confirm-real-collection-execute
```

真实 execute 仍只适用于 `database_safety_label=isolated_test_database` 的隔离测试库。Docker 隔离不等于数据库安全；执行前必须完成 safety check、备份、filled request、validate request、apply dry-run 和 preflight。失败时使用脚本输出的命令回滚：

```bash
scripts/car-rental/restore-collection-test-db.sh <backup-file>
```

成功也不代表 `production_ready`；所有报告必须保持 `production_ready=false`。下一阶段才进入 Runtime、权限、页面和测试数据导入。
