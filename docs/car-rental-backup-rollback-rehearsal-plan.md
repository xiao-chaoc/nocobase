# Car Rental Backup / rollback rehearsal plan

## 阶段目标

Backup / rollback rehearsal 阶段用于在正式版前确认租车业务初始化、Collection 注册、Runtime 注册、权限、页面、mock 导入、业务 smoke、合同文档和 GPS mock 阶段均具备可审计的备份、失败停止和回滚路径。

当前目标不是证明生产可用，而是补齐 Codex-only workflow 下的离线演练计划、dry-run 脚本、JSON/Markdown 报告、修改项清单、校验脚本和测试。当前仍为 production_ready=false。

## 当前 Codex-only 执行模式

- workflow_mode=codex_only。
- execution_mode=codex_dry_run / codex_mock_report。
- 当前不要求用户本地运行。
- run-full 仅保留为未来正式版前本地/NAS 执行入口，当前不要求用户现在运行 run-full。
- 正式版前才本地执行真实备份、恢复和回滚演练。

## 当前不真实备份/恢复数据库的原因

- 用户已删除本地 NAS 测试目录和 Docker 容器。
- 当前没有有效本地 dump，不得引用已删除的本地 NAS dump 作为当前有效备份。
- 本轮严格禁止真实连接数据库、真实备份数据库、真实恢复数据库、删除文件、写 schema 或执行 migration。
- 当前不能使用真实 IOPGPS、真实司机资料、真实付款截图或真实合同扫描件。
- 当前不能把 mock 数据导入生产。
- 未来正式版前本地/NAS 执行时才生成真实 backup dump，且 dump / SQL / filled request 不得提交。

## 已发现 backup / restore / rollback 入口

| 入口 | 状态 | 说明 |
| --- | --- | --- |
| `scripts/car-rental/backup-collection-test-db.sh` | existing | 隔离 PostgreSQL 测试库备份脚本，要求 `CAR_RENTAL_DATABASE_SAFETY_LABEL=isolated_test_database`，拒绝生产库标识。 |
| `scripts/car-rental/restore-collection-test-db.sh` | existing | 隔离 PostgreSQL 测试库恢复脚本，要求 `isolated_test_database`，拒绝生产库标识，并要求人工输入 `YES`。 |
| `docs/car-rental-real-collection-execute-rollback.md` | existing | Real Collection execute rollback 说明。 |
| `docs/car-rental-real-collection-execute-rollback-drill.md` | existing | Rollback drill 文档。 |
| `scripts/car-rental/execute-real-collection-registration.ts` | existing | 生成 `rollback_command_reference`，默认指向 restore 脚本。 |
| `scripts/car-rental/post-validate-real-collection-registration.ts` | existing | post-validate 入口，失败时必须走回滚处理。 |
| `.gitignore` | existing | 忽略 `.env.car-rental-collection-test`、`backups-test/`、`*.dump`、`*.sql` 和 filled request。 |

## 缺失备份/回滚项

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 真实本地/NAS restore 验证结果 | missing | 用户已删除本地 NAS 测试环境；当前不能生成或引用真实 dump。 |
| 真实 storage 快照恢复验证 | missing | 当前不得删除或恢复文件，正式版前才本地执行。 |
| 真实隐私数据回滚验证 | missing | 当前不能使用真实司机资料、付款截图或合同扫描件。 |

## Planned 备份/回滚项

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| pre-release local backup dump | planned | 正式版前才本地执行并生成真实 backup dump；dump 不提交。 |
| pre-release local restore drill | planned | 使用新目录、新 `.env`、新 PostgreSQL volume、新 storage 执行。 |
| storage / plugin storage snapshot rehearsal | planned | 仅在正式版前本地/NAS 环境执行，不在 Codex-only 阶段删除或恢复文件。 |
| production init guard stage | planned | 下一轮 Codex 应补齐 Production init guard stage。 |

## Pending verification 备份/回滚项

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 真实 PostgreSQL client 版本和权限 | pending_verification | 正式版前本地/NAS 执行时验证。 |
| 真实 dump 可恢复性 | pending_verification | 当前没有有效本地 dump。 |
| 真实文件存储快照完整性 | pending_verification | 当前不删除、不复制、不恢复 storage。 |
| 真实 IOPGPS 关闭状态 | pending_verification | 当前仅检查 `IOPGPS_SYNC_ENABLED=false`，不调用真实 IOPGPS。 |

## 必须覆盖的回滚场景

| 场景 | Codex-only 覆盖 | 真实执行时要求 |
| --- | --- | --- |
| Collection 注册前备份 | existing | execute 前必须有备份 artifact reference。 |
| Collection 注册失败回滚 / collection registration failure rollback | existing | 使用 restore 脚本回滚隔离测试库。 |
| Collection post-validate 失败回滚 / post-validate failure rollback | existing | post-validate 失败时停止并恢复。 |
| Runtime 注册失败回滚 / runtime registration failure rollback | planned | Runtime dry-run 已建立，真实执行前必须接入回滚。 |
| Permission 初始化失败回滚 / permission initialization failure rollback | planned | 权限初始化失败时停止并恢复。 |
| Page 初始化失败回滚 / page initialization failure rollback | planned | 页面/菜单/区块初始化失败时停止并恢复。 |
| Mock 数据导入失败回滚 / mock data import failure rollback | planned | mock 导入失败时停止并恢复；mock 数据不得进入生产。 |
| Business smoke test 失败回滚 / business smoke failure rollback | planned | 业务 smoke 失败时保留报告并恢复。 |
| Contract document test 失败回滚 / contract document failure rollback | planned | 不使用真实合同扫描件；正式版前失败时恢复。 |
| GPS mock test 失败回滚 / GPS mock failure rollback | planned | 不调用真实 IOPGPS；失败时恢复测试库状态。 |
| IOPGPS 意外启用时停止并回滚 / IOPGPS unexpected enabled rollback | existing | 发现 `IOPGPS_SYNC_ENABLED=true` 必须停止。 |
| 发现生产库标识时停止 / production database stop condition | existing | 发现 prod/production/live 标识必须停止。 |
| 发现真实隐私数据时停止 / privacy data exposure stop condition | planned | 发现真实司机资料、真实付款截图或真实合同扫描件必须停止。 |
| 发现 mock 数据进入生产时停止 | existing | mock 数据不能进入生产。 |

## 必须检查的安全条件

- `DB_DIALECT=postgres/postgresql`。
- `DB_DATABASE` 是测试库。
- `CAR_RENTAL_DATABASE_SAFETY_LABEL=isolated_test_database`。
- `CAR_RENTAL_MOCK_DATA_ONLY=true`。
- `IOPGPS_SYNC_ENABLED=false`。
- `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED` 默认 false。
- 生产库禁止执行。
- backup dump 不提交。
- SQL dump 不提交。
- filled request 不提交。
- `.env` 不提交。
- production_ready=false。

## 禁止事项

- 不真实连接数据库。
- 不真实备份数据库。
- 不真实恢复数据库。
- 不删除文件。
- 不写 schema。
- 不执行 migration。
- 不启用真实 IOPGPS。
- 不使用真实隐私数据。
- 不标记 production_ready。
- 不引用已删除的本地 dump 作为当前有效备份。
