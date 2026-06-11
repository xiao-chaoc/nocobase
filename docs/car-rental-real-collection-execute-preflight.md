# car-rental 真实 Collection execute preflight 报告

## 1. 当前结论

- 报告生成时间：`2026-06-10T00:31:40.367Z`。
- 宿主工程：`/workspace/nocobase`。
- preflight 是否通过：`false`。
- 是否 production_ready：`false`。
- 是否真实执行 Collection 注册：`false`。
- 是否写数据库：`false`。
- 是否创建 Collection：`false`。
- 是否执行 migration：`false`。
- 是否调用 IOPGPS：`false`。
- 本轮只做 execute 前置检查；即使无 blocker，也不得在本轮真实执行。
- execute request 文件：`未提供`。

## 2. preflight 检查项

- ✅ NocoBase 版本必须为 2.0.61：`2.0.61`
- ✅ 包管理器必须为 yarn：`yarn`
- ❌ 数据库类型必须为 PostgreSQL：`unknown`
- ❌ 必须明确是隔离测试库：`unconfirmed`
- ✅ 不得是生产或类生产库
- ❌ 必须有备份计划
- ❌ 必须有回滚计划
- ✅ 必须禁用 IOPGPS 真实同步
- ❌ 必须只允许 mock 数据
- ✅ 必须存在最小 Collection plan
- ✅ 必须存在 real host environment report
- ✅ 必须存在未执行、未写库的 real collection adapter plan
- ❌ execute request 已校验并应用：`未提供`
- ✅ execute 显式允许门禁本轮必须关闭

## 3. Blockers

- 数据库类型未明确为 postgres / postgresql。
- 未明确确认当前数据库是隔离测试库。
- 未确认数据库备份计划。
- 未确认回滚计划。
- 未确认只允许 mock 数据。

## 4. Warnings

- execute 显式允许门禁保持关闭；这是本轮预期状态。
- 本轮 preflight 不读取 .env、不连接数据库、不创建 Collection、不执行 migration、不调用 IOPGPS。

## 5. 下一步动作

- 在隔离测试库环境中明确 DB_DIALECT=postgres 或 postgresql，或提供合法 execute request。
- 设置隔离测试库确认门禁，或提供合法 execute request。
- 先完成数据库备份计划并记录备份 artifact，或提供合法 execute request。
- 先验证并记录可执行的回滚命令或回滚流程，或提供合法 execute request。
- 确认仅使用 mock 数据，不使用真实司机资料、付款截图或合同扫描件，或提供合法 execute request。
- 如需进入真实 execute，必须另起 PR，并提供人工确认清单、--execute 和执行信息。

## 6. execute 人工确认清单

- [ ] 当前 NocoBase 版本 2.0.61。
- [ ] 当前包管理器 yarn。
- [ ] 当前数据库是 PostgreSQL。
- [ ] 当前数据库是隔离测试库。
- [ ] 当前数据库不是生产库。
- [ ] 已完成数据库备份。
- [ ] 已验证回滚路径。
- [ ] IOPGPS_SYNC_ENABLED=false。
- [ ] 只使用 mock 数据。
- [ ] 不使用真实司机资料。
- [ ] 不使用真实付款截图。
- [ ] 不使用真实合同扫描件。
- [ ] 不启用真实 IOPGPS。
- [ ] 已阅读 real collection adapter plan。
- [ ] 已阅读 execute preflight 报告。
- [ ] 已明确最小 Collection 范围。

## 7. 最小 Collection 范围

- `drivers`
- `vehicles`
- `lease_contracts`
- `rent_daily_ledgers`
- `rent_payments`
- `rent_payment_allocations`
- `deposit_records`
- `operation_logs`

## 8. 本阶段仍不包括

- `contract_documents`
- `contract_templates`
- `gps_devices`
- `gps_daily_mileages`
- `gps_location_snapshots`
- `iopgps_settings`
- `页面`
- `权限`
- `服务动作`
- `测试数据导入`

## 9. 安全声明

- 本脚本不读取 `.env` 文件。
- 本脚本不输出应用、数据库或 IOPGPS 密钥值。
- 本脚本不连接数据库。
- 本脚本不创建 Collection。
- 本脚本不执行 migration。
- 本脚本不调用真实 IOPGPS。
- 本脚本不导入真实或 mock 业务数据。
- 没有 preflight 通过和另起 PR 的人工确认，不得进入真实 Collection 创建。

## 10. 如何用隔离 PostgreSQL 测试库准备包消除 blockers

- 使用 `.env.car-rental-collection-test.example` 创建本地 `.env.car-rental-collection-test`，并保持 `DB_DIALECT=postgres` 或 `postgresql`，可消除“数据库类型未明确” blocker。
- 使用明显包含 `test` / `car_rental` / `collection_test` 的 `DB_DATABASE`，并保持 `CAR_RENTAL_DATABASE_SAFETY_LABEL=isolated_test_database`，可消除“未确认隔离测试库” blocker；不得使用包含 `prod`、`production`、`live` 的库名。
- 运行 `scripts/car-rental/backup-collection-test-db.sh` 生成真实测试库 dump，并使用脚本输出的 `backup_artifact_reference`；不允许手写假的备份引用。
- 使用 `scripts/car-rental/restore-collection-test-db.sh <backup-file>` 或 `docs/car-rental-real-collection-execute-rollback.md` 作为 `rollback_command_reference`；不允许跳过回滚验证。
- 保持 `CAR_RENTAL_MOCK_DATA_ONLY=true`、`IOPGPS_SYNC_ENABLED=false`、`CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false`，并先运行 `scripts/car-rental/validate-collection-test-db-safety.ts`。
- 本准备包仍不允许真实创建 Collection、写数据库、执行 migration、调用真实 IOPGPS 或标记 `production_ready`。

## Execute PR 审查包补充（2026-06-11）

- 已获得真实 backup artifact：`backups-test/car-rental/pre-real-collection-register-20260610-235309.dump`。
- 该 backup artifact 不得提交到 Git，执行前必须在隔离测试环境中确认文件真实存在。
- 下一步是 execute PR 审查包：`docs/car-rental-real-collection-execute-pr-package.md`。
- 本轮仍不 execute，不执行真实 Collection 创建，不写数据库 schema，不执行 migration。
- execute 需要单独 PR，并且必须显式提供 `--execute` 与 `--confirm-real-collection-execute`。
- execute 仍只允许隔离测试库，不使用生产库；`IOPGPS_SYNC_ENABLED = false`，`mock_data_only = true`。

## 一键隔离测试执行器补充

推荐使用 `scripts/car-rental/run-isolated-collection-registration-test.sh` 替代手工步骤生成新的 preflight with request。run-isolated 默认 `prepare-only`，不创建 Collection；真实 execute 需要显式 `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true`、`--execute`、`--confirm-real-collection-execute`，并且仍只适用于隔离 PostgreSQL 测试库。Docker 运行环境仍需数据库隔离和备份，不可直接生产部署。
