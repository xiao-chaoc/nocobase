# car-rental 真实 Collection execute PR review checklist

- [ ] `target_version` 是否为 `2.0.61`。
- [ ] `package_manager` 是否为 `yarn`。
- [ ] `database_dialect` 是否为 `postgresql`。
- [ ] `database_safety_label` 是否为 `isolated_test_database`。
- [ ] 是否明确非 production / 非类生产库。
- [ ] backup artifact 是否存在且不含密码、连接串或密钥。
- [ ] rollback command reference 是否存在且不含密码、连接串或密钥。
- [ ] `iopgps_real_sync_allowed` 是否为 `false`。
- [ ] `mock_data_only` 是否为 `true`。
- [ ] `collection_scope` 是否只包含 8 个最小 Collection：`drivers`、`vehicles`、`lease_contracts`、`rent_daily_ledgers`、`rent_payments`、`rent_payment_allocations`、`deposit_records`、`operation_logs`。
- [ ] `filled.json` 是否未提交。
- [ ] 是否没有提交 `.env` 或 `.env.test`。
- [ ] 是否没有真实密钥：`APP_KEY`、`DB_PASSWORD`、`INIT_ROOT_PASSWORD`、`IOPGPS_LOGIN_KEY`、`access_token`、`login_key` 或 `password` 字段。
- [ ] 是否没有真实业务数据、真实司机资料、真实付款截图或真实合同扫描件。
- [ ] 是否未执行真实 Collection 创建。
- [ ] 是否未执行 migration、未写数据库、未注册权限、未创建页面、未调用真实 IOPGPS。
- [ ] preflight with request 是否通过。
- [ ] 是否仍不允许标记 `production_ready`。

## 隔离测试库准备包 review 项

- [ ] `.env.car-rental-collection-test.example` 只包含测试占位值，未包含 `APP_KEY`、`IOPGPS_LOGIN_KEY` 或真实密码。
- [ ] `.env.car-rental-collection-test` 未提交。
- [ ] `docker-compose.car-rental-collection-test.yml` 只启动隔离 `postgres:16`，未挂载生产 storage，未启动真实 IOPGPS，未执行 Collection 注册。
- [ ] `backup_artifact_reference` 来自 `scripts/car-rental/backup-collection-test-db.sh` 的真实测试库备份输出。
- [ ] `rollback_command_reference` 引用 `scripts/car-rental/restore-collection-test-db.sh <backup-file>` 或 `docs/car-rental-real-collection-execute-rollback.md`。
- [ ] 已运行 `scripts/car-rental/validate-collection-test-db-safety.ts`，并确认 `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false`。
- [ ] 未跳过 safety check，未使用 production DB，未调用真实 IOPGPS。
