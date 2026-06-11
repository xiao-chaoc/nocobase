# Car Rental Runtime Registration Plan

## 1. Runtime 阶段目标

Runtime / 服务 / 动作注册阶段用于把 car-rental 三个插件与 `packages/shared/nocobase-automation` 中的自动化适配器纳入统一检查范围，确认哪些 runtime/service/action/server method 已经存在、哪些仍是 planned、哪些需要后续真实 NocoBase 注册验证。

本阶段只补齐 Codex-only 测试路线图第 2 阶段的脚本、dry-run 报告、修改项清单和校验测试；当前仍不是 production_ready。

## 2. 当前 Codex-only 执行模式

- workflow_mode: `codex_only`
- stage: `runtime_registration`
- execution_mode: `codex_dry_run` / `codex_mock_report`
- production_ready: `false`
- 当前不要求用户本地运行。
- 正式版前才本地执行 `scripts/car-rental/run-full-isolated-system-test.sh` 和真实 runtime 验证。

## 3. 当前不真实注册 runtime 的原因

1. 用户已经删除本地 NAS 测试目录和本地 Docker 容器。
2. 当前不能使用真实 IOPGPS。
3. 当前不能使用真实司机资料、真实付款截图、真实合同扫描件。
4. 当前不能把 mock 数据导入生产。
5. 本轮不要真实连接数据库，不要真实注册 runtime，不要写 schema。
6. 正式版前仍需要在隔离本地/NAS 环境完成 pre-release local execution。

## 4. 已发现 runtime/service/action 入口

本轮扫描范围：

- `packages/plugins/plugin-rental-core/src/server/`
- `packages/plugins/plugin-contract-documents/src/server/`
- `packages/plugins/plugin-iopgps/src/server/`
- `packages/shared/nocobase-automation/src/`

### plugin-rental-core existing 入口

| 类型 | 状态 | 文件 | 说明 |
| --- | --- | --- | --- |
| plugin registration | existing | `packages/plugins/plugin-rental-core/src/server/pluginRegistration.ts` | 结构化注册描述，包含 collections、services、permissions、scheduledTasks、actions。 |
| action registry | existing | `packages/plugins/plugin-rental-core/src/server/actions/actionRegistry.ts` | 合同激活、台账生成、长租补台账、付款确认、付款冲正、未付原因、押金、欠款等动作草案。 |
| permission registry | existing | `packages/plugins/plugin-rental-core/src/server/permissions/permissionRegistry.ts` | 权限与敏感字段过滤草案。 |
| schedule registry | existing | `packages/plugins/plugin-rental-core/src/server/schedules/scheduleRegistry.ts` | 长租未来台账等 scheduler 草案。 |
| services | existing | `packages/plugins/plugin-rental-core/src/server/services/*.ts` | 合同生命周期、自然周台账、付款分配、押金、欠款、免租日、operation logs 等纯函数/服务骨架。 |
| collection resources | existing | `packages/plugins/plugin-rental-core/src/server/collections/*.ts` | 司机、车辆、合同、台账、付款、押金、操作日志等 collection draft。 |

### plugin-contract-documents existing 入口

| 类型 | 状态 | 文件 | 说明 |
| --- | --- | --- | --- |
| plugin registration | existing | `packages/plugins/plugin-contract-documents/src/server/pluginRegistration.ts` | 合同模板、合同文档、服务、权限、动作草案。 |
| action registry | existing | `packages/plugins/plugin-contract-documents/src/server/actions/actionRegistry.ts` | 合同渲染、打印、签署扫描件上传等动作草案。 |
| services | existing | `packages/plugins/plugin-contract-documents/src/server/services/*.ts` | 合同文档渲染、模板校验、打印、扫描件校验等服务骨架。 |
| collection resources | existing | `packages/plugins/plugin-contract-documents/src/server/collections/*.ts` | 合同模板和合同文档 collection draft。 |

### plugin-iopgps existing 入口

| 类型 | 状态 | 文件 | 说明 |
| --- | --- | --- | --- |
| plugin registration | existing | `packages/plugins/plugin-iopgps/src/server/pluginRegistration.ts` | IOPGPS collections、services、permissions、scheduledTasks、actions 草案。 |
| action registry | existing | `packages/plugins/plugin-iopgps/src/server/actions/actionRegistry.ts` | 手动同步设备状态、定位、每日里程、历史里程补同步；`callsRealApi=false`。 |
| schedule registry | existing | `packages/plugins/plugin-iopgps/src/server/schedules/scheduleRegistry.ts` | IOPGPS 同步 scheduler 草案，默认禁用，`callsRealApi=false`。 |
| services | existing | `packages/plugins/plugin-iopgps/src/server/services/*.ts` | token 状态、状态归一化、设备状态、定位、里程、错误日志隔离服务骨架。 |
| collection resources | existing | `packages/plugins/plugin-iopgps/src/server/collections/*.ts` | GPS 设备、绑定、定位快照、每日里程、状态日志、设置 collection draft。 |

### nocobase-automation existing 入口

| 类型 | 状态 | 文件 | 说明 |
| --- | --- | --- | --- |
| mock runtime adapter | existing | `packages/shared/nocobase-automation/src/mockRuntimeAdapter.ts` | Codex-only mock runtime 适配器。 |
| real runtime adapter | existing | `packages/shared/nocobase-automation/src/realRuntimeRegistrationAdapter.ts` | 后续真实注册适配器草案，当前不执行。 |
| runtime executor | existing | `packages/shared/nocobase-automation/src/runtimeRegistrationExecutor.ts` | runtime 注册执行器抽象。 |
| runtime validator | existing | `packages/shared/nocobase-automation/src/runtimeRegistrationValidator.ts` | runtime 注册校验抽象。 |
| runtime safety/schema mapper | existing | `packages/shared/nocobase-automation/src/realRuntimeSafetyChecker.ts`, `realRuntimeSchemaMapper.ts` | 后续真实 runtime safety/schema 映射草案。 |

## 5. 缺失 runtime/service/action 项

| 项 | 状态 | 说明 |
| --- | --- | --- |
| 真实 NocoBase runtime 注册执行 | missing | 当前仅有结构化草案和 dry-run；后续需要真实 service/action/permission 注册。 |
| 真实权限注册与 ACL 校验 | missing | 当前存在 permission placeholder；下一阶段单独补齐权限与敏感字段测试。 |
| 页面动作绑定 | missing | 当前仅有 action registry 草案；页面 / 菜单 / 区块初始化阶段补齐。 |
| 真实 scheduler/workflow 绑定 | pending_verification | 当前有 schedule registry 草案；正式版前本地执行时验证是否绑定 NocoBase scheduler/workflow。 |
| 真实合同文件生成 | missing | 当前不生成真实合同文件；合同文件测试阶段补齐。 |
| 真实 IOPGPS 同步 | missing | 当前必须默认禁用；只允许 mock sync。 |

## 6. Planned runtime 项

| runtime | 状态 | 插件 | 业务规则 |
| --- | --- | --- | --- |
| contract_creation_runtime | planned | plugin-rental-core | 合同创建需校验司机、车辆、合同类型和生效规则。 |
| natural_week_ledger_generation_runtime | planned | plugin-rental-core | 按自然周生成租金台账，支持长租、时限合同和默认免租日。 |
| payment_daily_allocation_runtime | planned | plugin-rental-core | 付款按日分配，单日不可超付。 |
| deposit_lifecycle_runtime | planned | plugin-rental-core | 押金收取、抵扣、退还，不计入租金收入。 |
| shortfall_calculation_runtime | planned | plugin-rental-core | 欠款计算保留未付原因，当前欠款不包含未来应收。 |
| contract_document_generation_runtime | planned | plugin-contract-documents | 后续生成合同文档和签署扫描件管理，当前不生成真实文件。 |
| iopgps_mock_sync_runtime | planned | plugin-iopgps | IOPGPS mock sync，真实同步默认禁用。 |
| operation_log_runtime | planned | plugin-rental-core | 关键业务动作记录 operation logs。 |
| permission_check_runtime_placeholder | planned | plugin-rental-core | 下一阶段补权限和敏感字段校验。 |
| page_action_runtime_placeholder | planned | plugin-rental-core | 后续页面动作绑定。 |

## 7. 禁止事项

- 不真实连接数据库。
- 不真实注册权限。
- 不真实创建页面。
- 不真实调用 IOPGPS。
- 不真实生成合同文件。
- 不使用真实司机资料。
- 不使用真实付款截图。
- 不使用真实合同扫描件。
- 不标记 production_ready。
- 不写 schema。
- 不执行 migration。
- mock 数据不能进入生产。

## 8. 需要覆盖的核心 runtime 能力

- 司机管理。
- 车辆管理。
- 合同创建。
- 长租合同。
- 时限合同。
- 自然周租金台账生成。
- 默认免租日。
- 付款按日分配。
- 单日不可超付。
- 未付原因。
- 欠款计算。
- 押金收取。
- 押金抵扣。
- 押金退还。
- 押金不计入租金收入。
- 当前欠款不包含未来应收。
- 合同文档生成。
- IOPGPS mock sync。
- IOPGPS 真实同步默认禁用。
- operation logs。
