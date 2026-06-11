# car-rental 真实 Collection execute PR review checklist

> 本 checklist 用于审查未来最终 execute PR。本 PR 只提供审查包与脚本草案，不执行真实 Collection 创建，不生产部署，不使用生产库。

## 必审项

- [ ] backup dump `backups-test/car-rental/pre-real-collection-register-20260610-235309.dump` 在执行环境中真实存在。
- [ ] backup dump 未提交到 Git。
- [ ] filled request 未提交到 Git。
- [ ] preflight with request 已通过，并且输出未包含 secret。
- [ ] request 中 `allow_real_execution` 仍为 `false`，直到最终 execute PR 明确修改并再次审查。
- [ ] execute 脚本默认 dry-run。
- [ ] execute 需要同时提供 `--execute` 和 `--confirm-real-collection-execute`。
- [ ] rollback 脚本 `scripts/car-rental/restore-collection-test-db.sh` 存在。
- [ ] rollback drill 文档 `docs/car-rental-real-collection-execute-rollback-drill.md` 存在。
- [ ] post-validate 脚本 `scripts/car-rental/post-validate-real-collection-registration.ts` 存在。
- [ ] Collection scope 仅包含 8 个最小 Collection：`drivers`、`vehicles`、`lease_contracts`、`rent_daily_ledgers`、`rent_payments`、`rent_payment_allocations`、`deposit_records`、`operation_logs`。
- [ ] 未涉及权限、页面、服务动作或测试数据导入。
- [ ] 未启用 IOPGPS，且 `IOPGPS_SYNC_ENABLED = false`。
- [ ] 未标记 `production_ready`。
- [ ] 不使用生产库，不连接生产库，不对生产库执行 restore 或 execute。
- [ ] NocoBase 2.0.61、yarn、postgresql、isolated_test_database、mock_data_only = true 均已确认。
- [ ] 明确不提交 dump、不提交 filled request、不提交 `.env.car-rental-collection-test`。

## 一键隔离测试执行器审查项

- [ ] 推荐使用 `scripts/car-rental/run-isolated-collection-registration-test.sh` 替代手工步骤。
- [ ] run-isolated 默认 `prepare-only`，不创建 Collection。
- [ ] 真实 execute 需要 `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true`、`--execute` 和 `--confirm-real-collection-execute`。
- [ ] 脚本仍只适用于隔离 PostgreSQL 测试库，不使用生产库。
- [ ] Docker 运行环境仍需数据库隔离和备份；Docker 隔离不等于数据库安全。
- [ ] 不可直接生产部署。

## 本阶段新增审查项

- [ ] 已确认当前 PR 允许在隔离 PostgreSQL 测试库真实注册最小 8 个 Collection。
- [ ] 执行命令必须是：`CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true bash scripts/car-rental/run-isolated-collection-registration-test.sh --execute --confirm-real-collection-execute`。
- [ ] `run-isolated` 调用 execute 脚本时必须传入 `--execute`、`--confirm-real-collection-execute`、`--runtime-allow-real-execution`。
- [ ] Docker 隔离不等于数据库安全，仍必须检查 `isolated_test_database`。
- [ ] 失败时必须使用 `scripts/car-rental/restore-collection-test-db.sh <backup-file>` 回滚。
- [ ] 成功仍不代表 `production_ready`，报告必须保持 `production_ready=false`。
- [ ] Runtime、权限、页面和数据导入均留到下一阶段。

## NAS 一键 runner 兼容性补充

- 推荐优先使用 `bash scripts/car-rental/run-isolated-collection-registration-test.sh` 一键执行隔离测试准备流程，不再手动逐步执行 compose 启动、备份、filled request 生成、request 校验、apply dry-run 和 preflight。
- Synology NAS 环境可能只有 `node` 和 `npm`，没有 `yarn`、`npx` 或 `node_modules/.bin/ts-node`；一键 runner 会依次尝试 `node_modules/.bin/ts-node`、`npx ts-node`、`npm exec --package=ts-node --package=typescript -- ts-node`，不可用时输出手工 fallback 步骤。
- `docker-compose` 1.28.5 不支持 Compose 顶层 `name` 字段；隔离测试项目名应由命令参数 `-p car-rental-collection-test` 提供。
- PostgreSQL 端口映射必须是 `53240:5432`，不能是 `53240:53240`；容器内 PostgreSQL target port 仍是 `5432`。
- 生产前删除测试容器、测试 network、测试 storage、测试备份和测试源码目录后，在生产新目录重新 clone，可以最小化测试影响；但生产仍必须使用新目录、新 `.env`、新 PostgreSQL 数据目录 / volume、新 storage 和新数据库，不能复用测试 dump、filled request 或 mock 数据。
