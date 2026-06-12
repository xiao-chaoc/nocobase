# Car Rental Page / Menu / Block Initialization Plan

## 阶段目标

Page / menu / block initialization stage 的目标是在 Codex-only workflow 下，把正式版前必须覆盖的 NocoBase 页面、菜单、区块、筛选器、动作按钮和敏感字段显示控制先整理成可审计 dry-run 计划。当前阶段只生成计划、脚本、JSON/Markdown 报告、修改项清单、校验脚本和测试，不真实连接数据库，也不真实创建页面。

## 当前 Codex-only 执行模式

- workflow_mode: `codex_only`
- stage: `page_menu_block_initialization`
- execution_mode: `codex_dry_run`
- production_ready=false
- local_execution_required_pre_release=true
- 当前不要求用户本地运行；正式版前才本地执行真实页面 / 菜单 / 区块初始化验证。
- run-full 仅保留为未来正式版前 local/NAS 总入口，不代表当前必须执行。

## 当前不真实创建页面 / 菜单 / 区块的原因

1. 用户已删除本地 NAS 测试目录和 Docker 容器，当前没有要求用户本地运行测试。
2. 本轮禁止真实连接数据库、创建页面、注册菜单、写 UI schema、写 schema、执行 migration 或注册真实权限。
3. 当前不能使用真实 IOPGPS，GPS 页面只能按 mock 状态和 dry-run 规划。
4. 当前不能使用真实司机资料、真实付款截图、真实合同扫描件。
5. mock 数据不能进入生产；本阶段不导入任何数据。
6. 当前仍不是 production_ready，所有报告必须保持 production_ready=false。

## 已发现页面 / 菜单 / UI schema / block 入口

| 状态 | 入口 | 涉及文件 | 说明 |
| --- | --- | --- | --- |
| existing | 页面 / 菜单 / 区块 dry-run 计划 builder | `packages/shared/nocobase-automation/src/pageInitializationPlan.ts` | 已存在菜单、页面、区块、筛选器、动作按钮的结构化计划函数；不真实写 UI。 |
| existing | 页面 dry-run executor | `packages/shared/nocobase-automation/src/pageInitializationExecutor.ts` | 使用 MockPageAdapter；不连接真实 NocoBase。 |
| existing | 页面计划 validator | `packages/shared/nocobase-automation/src/pageInitializationValidator.ts` | 已包含必需页面、禁止模式和敏感字段检查。 |
| existing | real page adapter 草案 | `packages/shared/nocobase-automation/src/realPageRegistrationAdapter.ts` | 仅作为后续真实接入草案；本轮不启用。 |
| existing | plugin-rental-core server registration plan | `packages/plugins/plugin-rental-core/src/server/pluginRegistration.ts` | 服务端 collection/service/action/permission/schedule 计划已存在。 |
| existing | plugin-contract-documents server registration plan | `packages/plugins/plugin-contract-documents/src/server/pluginRegistration.ts` | 合同文件服务端计划已存在；本轮不生成真实文件。 |
| existing | plugin-iopgps server registration plan | `packages/plugins/plugin-iopgps/src/server/pluginRegistration.ts` | GPS/IOPGPS 服务端计划已存在；本轮不启用真实 IOPGPS。 |
| missing | plugin-rental-core client runtime directory | `packages/plugins/plugin-rental-core/src/client/` | 扫描时不存在；真实 NocoBase UI 注册尚未实现。 |
| missing | plugin-contract-documents client runtime directory | `packages/plugins/plugin-contract-documents/src/client/` | 扫描时不存在；真实合同文件 UI 注册尚未实现。 |
| missing | plugin-iopgps client runtime directory | `packages/plugins/plugin-iopgps/src/client/` | 扫描时不存在；真实 GPS/IOPGPS UI 注册尚未实现。 |
| missing | addRoutes / addMenu / app.addComponents / schemaInitializer / schemaSettings | car-rental 插件 client 目录 | 本轮禁止真实注册菜单或写 UI schema，因此保持 missing。 |

## planned 页面项

| 页面 / 菜单 / 区块项 | 状态 | 计划入口 | 说明 |
| --- | --- | --- | --- |
| 车辆管理页面 | planned | `/rental/vehicles` | 车辆表格、当前合同、GPS 状态占位。 |
| 司机管理页面 | planned | `/rental/drivers` | 司机表格、司机详情；司机证件字段默认隐藏。 |
| 合同管理页面 | planned | `/rental/contracts` | 合同列表、合同详情、台账/付款/押金/合同文件关联。 |
| 合同创建页面 | planned | `/rental/contracts` action placeholder | `create_contract` 动作占位，后续真实 UI 才创建表单。 |
| 合同详情页面 | planned | `/rental/contracts/:id` placeholder | 当前仅有详情区块计划，真实路由待后续实现。 |
| 时限合同页面 | planned | contract type filter placeholder | 时限合同台账生成动作占位。 |
| 长租合同页面 | planned | contract type filter placeholder | 长租合同台账补生成动作占位。 |
| 日租金台账页面 | planned | `/rental/ledgers` | 每日租金台账表格，唯一事实来源。 |
| 付款登记页面 | planned | `/rental/payments` | 付款表格和创建付款动作；付款截图默认隐藏。 |
| 付款按日分配页面 | planned | `/rental/payments/:id/allocations` placeholder | 付款分配关联区块；必须分配到具体日期。 |
| 押金管理页面 | planned | `/rental/deposits` | 押金创建、抵扣、退款、免除动作占位。 |
| 欠款看板页面 | planned | `/rental/dashboard` | 欠款汇总、风险面板；敏感金额默认隐藏。 |
| 当前欠款日历页面 | planned | `/rental/calendar` | 日历占位和汇总；当前欠款不包含未来应收。 |
| 免租日显示 | planned | `/rental/calendar` | 在日历格/台账中展示免租日状态。 |
| 未付原因管理 | planned | `/rental/ledgers` action placeholder | 未付原因动作占位。 |
| 合同文档生成页面 | planned | `/rental/contract-documents` | 合同模板和合同文件表格；不真实生成 PDF/DOCX。 |
| 合同打印/下载入口 | planned | `/rental/contract-documents` action placeholder | 打印/下载文件字段默认隐藏。 |
| GPS mock 状态页面 | planned | `/rental/gps/status` | 仅 mock 状态计划；不调用真实 IOPGPS。 |
| IOPGPS 设置页面 | planned | `/rental/settings/iopgps` placeholder | 真实凭据默认隐藏；不显示 login key/token。 |
| operation logs 页面 | planned | `/rental/operation-logs` | 操作日志表格必须脱敏。 |
| 管理员菜单 | planned | `/rental` | 覆盖全部管理入口。 |
| 财务菜单 | planned | `/rental/ledgers` | 覆盖台账、付款、押金、欠款。 |
| 普通操作员菜单 | planned | `/rental/contracts` | 覆盖日常运营，不显示敏感财务/隐私字段。 |
| 权限敏感字段显示控制 placeholder | planned | all pages | 按角色隐藏付款截图、司机证件、合同扫描件、财务汇总、IOPGPS secret。 |

## 缺失页面项

- car-rental 三个插件的 `src/client/` 目录缺失，真实 UI runtime 尚未实现。
- 真实 addRoutes / addMenu / app.addComponents 未实现。
- 真实 UI schema、schemaInitializer、schemaSettings 未实现。
- 合同详情、合同创建、付款分配、时限合同、长租合同、IOPGPS 设置页目前只有计划/占位，未创建真实路由。

这些缺失项不导致 dry-run 失败；它们会进入 JSON report 的 `missing_page_entries` 和 `modification_items`。

## pending_verification 页面项

- NocoBase v2 client runtime 真实落点：需要后续在正式实现前确认应放入 `src/client-v2/` 还是其他插件约定目录。
- 合同详情、合同创建、付款分配是否拆分独立页面或作为 action/modal/block：待业务确认。
- IOPGPS 设置页面真实权限模型和真实凭据掩码策略：待 pre-release local execution 验证。
- operation logs 页面审计角色命名和只读权限：待权限阶段真实注册后验证。

## 禁止事项

- 不真实连接数据库。
- 不真实创建页面。
- 不真实注册菜单。
- 不真实写 UI schema。
- 不真实创建权限。
- 不导入数据。
- 不启用真实 IOPGPS。
- 不使用真实司机资料。
- 不使用真实付款截图。
- 不使用真实合同扫描件。
- 不标记 production_ready。
- mock 数据不能进入生产。
