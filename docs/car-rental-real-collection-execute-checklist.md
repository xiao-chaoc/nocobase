# car-rental 真实 Collection execute 人工确认清单

本清单只用于未来另起 PR 申请真实 Collection execute；当前阶段仍不得真实创建 Collection、不得执行 migration、不得写数据库。

## 1. 执行前必须确认

- [ ] 当前 NocoBase 版本 2.0.61。
- [ ] 当前包管理器 yarn。
- [ ] 当前数据库是 PostgreSQL。
- [ ] 当前数据库是隔离测试库。
- [ ] 当前数据库不是生产库。
- [ ] 已完成数据库备份。
- [ ] 已验证回滚路径。
- [ ] `IOPGPS_SYNC_ENABLED=false`。
- [ ] 只使用 mock 数据。
- [ ] 不使用真实司机资料。
- [ ] 不使用真实付款截图。
- [ ] 不使用真实合同扫描件。
- [ ] 不启用真实 IOPGPS。
- [ ] 已阅读 real collection adapter plan。
- [ ] 已阅读 execute preflight 报告。
- [ ] 已明确最小 Collection 范围。

## 2. 最小 Collection 范围

- `drivers`
- `vehicles`
- `lease_contracts`
- `rent_daily_ledgers`
- `rent_payments`
- `rent_payment_allocations`
- `deposit_records`
- `operation_logs`

## 3. 本阶段仍不包括

- `contract_documents`
- `contract_templates`
- `gps_devices`
- `gps_daily_mileages`
- `gps_location_snapshots`
- `iopgps_settings`
- 页面
- 权限
- 服务动作
- 测试数据导入

## 4. 进入真实 execute 的 PR 要求

如果要进入真实 execute，必须另起 PR，并显式说明：

- execute reason
- target database
- backup artifact
- rollback command
- operator
- execution time
- expected result

没有通过 execute preflight、没有人工确认清单、没有 `--execute` 显式门禁时，不得进入真实 Collection 创建。

## 5. execute request 申请包

- 下一步应先生成 `test-data/generated/real-collection-execute-request.template.json`，再由操作人复制为本地忽略的 `filled.json` 人工填写。
- `filled.json` 必须通过 validate request、apply request dry-run 和 preflight with request。
- 合法 request 只能消除 preflight 中可人工确认的安全字段 blockers；本轮仍不允许真实创建 Collection。

## 6. 隔离 PostgreSQL 测试库准备包检查

- [ ] 已复制 `.env.car-rental-collection-test.example` 为本地 `.env.car-rental-collection-test`，且未提交本地 env。
- [ ] `DB_DIALECT` 是 `postgres` 或 `postgresql`。
- [ ] `DB_DATABASE` 明确包含 `test` / `car_rental` / `collection_test`，且不包含 `prod`、`production`、`live`。
- [ ] `CAR_RENTAL_DATABASE_SAFETY_LABEL=isolated_test_database`。
- [ ] `CAR_RENTAL_MOCK_DATA_ONLY=true`。
- [ ] `IOPGPS_SYNC_ENABLED=false`，且没有真实 `IOPGPS_LOGIN_KEY`。
- [ ] `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false`。
- [ ] 已运行 `scripts/car-rental/validate-collection-test-db-safety.ts`，不得跳过 safety check。
- [ ] `backup_artifact_reference` 来自 `scripts/car-rental/backup-collection-test-db.sh` 的真实输出，不是手写假路径。
- [ ] `rollback_command_reference` 引用 `scripts/car-rental/restore-collection-test-db.sh <backup-file>` 或回滚文档。
- [ ] 未提交 `.env.car-rental-collection-test`、`backups-test/`、`*.dump`、`*.sql` 或 filled request。
