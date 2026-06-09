# car-rental 真实 Collection Adapter 最小计划

## 1. 当前实现范围

- 当前宿主工程：`/workspace/nocobase`。
- 当前 NocoBase 目标版本：`2.0.61`。
- 当前模式：`dry_run`。
- 是否执行真实注册：`false`。
- 是否写数据库：`false`。
- 是否创建 Collection：`false`。
- 是否执行 migration：`false`。
- 本轮只实现真实 Collection Adapter 的 plan-only / validate-only / dry-run 最小可验证路径，不真实建表。

## 2. 已检测到的 NocoBase Collection API 证据

| 文件路径 | 方法名 | 对本 Adapter 的用途 | 状态 | 摘要 |
| --- | --- | --- | --- | --- |
| `packages/core/database/src/database.ts` | `Database.collection(options)` | 可用于计划/映射 | 已源码确认 | Database.collection(options) 会 clone options、触发 beforeDefineCollection/afterDefineCollection，并通过 collectionFactory 创建 Collection。 |
| `packages/core/database/src/database.ts` | `Database.import({ directory, from, extensions })` | 可用于计划/映射 | 已源码确认 | Database.import 通过 ImporterReader 读取目录，并对每个模块调用 this.collection({...module, origin})。 |
| `packages/core/database/src/database.ts` | `defineCollection(collectionOptions)` | 可用于计划/映射 | 已源码确认 | defineCollection 直接返回 CollectionOptions，是插件内声明 Collection 的现有 helper。 |
| `packages/core/database/src/database.ts` | `Database.getRepository(name)` | 仅作为后续验证 | 已源码确认 | getRepository(name) 基于已定义 Collection 返回 collection.repository；可用于执行后验证，但本轮不写库。 |
| `packages/plugins/@nocobase/plugin-data-source-main/src/server/models/collection.ts` | `CollectionModel.load(options)` | 可用于计划/映射 | 已源码确认 | data-source-main 的 Collection model load 会在缺失时调用 this.db.collection(collectionOptions)。 |
| `packages/core/database/src/database.ts` | `Database.sync(options)` | 仅作为后续验证 | 已源码确认 | Database.sync 会调用 sequelize.sync；本轮仅识别，严禁调用。 |
| `packages/plugins/@nocobase/plugin-data-source-main/src/server/migrations/20230918024546-set-collection-schema.ts` | `app.emitAsync('loadCollections')` | 仅作为后续验证 | 已源码确认 | 迁移示例在更新 collections 元数据后 emit loadCollections；本轮不执行 migration。 |
| `packages/plugins/@nocobase/plugin-users/src/server/collections/users.ts` | `defineCollection({...})` | 可用于计划/映射 | 已源码确认 | 插件 Collection 示例使用 defineCollection 声明 name、origin、migrationRules、fields、unique 等结构。 |

## 3. 映射策略

- 将 car-rental 插件中的 Collection 草案转换为 `RealCollectionSchemaDraft`。
- 再将 `RealCollectionSchemaDraft` 映射为 NocoBase v2.0.61 可理解的 Collection schema 草案。
- 保留字段、关系、普通索引、唯一约束、敏感字段与业务 notes。
- 关系字段仅保留 schema 草案信息，不调用 `db.collection`、不调用 `db.sync`、不触发 migration。

## 4. 最小 Collection 范围

| Collection | plannedAction | 字段数 | 唯一约束数 | 敏感字段数 | 校验 |
| --- | --- | ---: | ---: | ---: | --- |
| `drivers` | dry_run_register | 15 | 1 | 5 | 通过 |
| `vehicles` | dry_run_register | 16 | 3 | 4 | 通过 |
| `lease_contracts` | dry_run_register | 19 | 1 | 6 | 通过 |
| `rent_daily_ledgers` | dry_run_register | 18 | 2 | 4 | 通过 |
| `rent_payments` | dry_run_register | 13 | 1 | 3 | 通过 |
| `rent_payment_allocations` | dry_run_register | 10 | 1 | 1 | 通过 |
| `deposit_records` | dry_run_register | 16 | 1 | 8 | 通过 |
| `operation_logs` | dry_run_register | 13 | 1 | 4 | 通过 |

## 5. 暂不处理范围

- `contract_templates`
- `contract_documents`
- `gps_devices`
- `gps_daily_mileages`
- `gps_location_snapshots`
- `iopgps_settings`

上述 Collection 属于合同文件和 IOPGPS 后续阶段，本轮不真实处理。

## 6. 安全边界

- 不读取 `.env`。
- 不输出任何应用、数据库或 IOPGPS 真实密钥。
- 不连接生产库。
- 不创建 Collection。
- 不执行 migration。
- 不导入真实或测试业务数据。
- 不调用真实 IOPGPS。
- 不标记 `production_ready`。

## 7. 为什么本轮不真实建表

当前任务要求实现最小可验证真实 Adapter 代码、脚本、测试和报告，但明确禁止真实创建 Collection、执行 migration 或使用生产库。因此本轮只生成可审查的 schema 草案、校验结果和 dry-run 计划。

## 8. 进入真实执行前必须满足的条件

- 显式设置 `mode=real`。
- 显式设置 `allowRealExecution=true`。
- 完成数据库备份并记录回滚方案。
- 使用隔离数据库，不能使用生产库。
- 禁用真实 IOPGPS。
- 仅使用 mock 数据。
- 完成 NocoBase v2.0.61 API 二次验证和人工评审。

## 9. 当前结论与下一步建议

- 当前 blockers：无。
- 当前可以进入下一轮真实 Collection execute 前置检查，但仍不能真实执行。
- 下一步建议：在隔离数据库中验证 `Database.collection(options)`、Collection Manager 元数据写入路径、事务和回滚边界。

## 10. 下一阶段：execute preflight

- 下一阶段是真实 Collection execute preflight，只检查是否具备未来执行真实 Collection 注册的安全条件。
- execute preflight 仍不创建 Collection、不写数据库、不执行 migration、不注册权限、不创建页面、不导入测试数据。
- execute 前必须人工确认隔离 PostgreSQL 测试库、数据库备份、可验证回滚路径、只使用 mock 数据、IOPGPS 真实同步禁用。
- 没有 execute preflight 通过，不得进入真实 Collection 创建。
- 即使 execute preflight 通过，也必须另起 PR，并显式提供 execute reason、target database、backup artifact、rollback command、operator、execution time 和 expected result。
