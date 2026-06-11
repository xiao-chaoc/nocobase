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
