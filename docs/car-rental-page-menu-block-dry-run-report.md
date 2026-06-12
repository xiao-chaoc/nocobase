# Car Rental Page / Menu / Block Dry-run Report

- 当前阶段: page_menu_block_initialization
- 执行模式: codex_dry_run / codex_mock_report
- workflow_mode: codex_only
- production_ready=false
- local_execution_required_pre_release=true
- 当前不要求用户本地运行；正式版前才本地执行真实页面 / 菜单 / 区块初始化验证。
- mock 数据不能进入生产；本阶段不导入任何数据。
- 不启用真实 IOPGPS，不读取或输出真实 secret/token/password。

JSON 报告位置：`test-data/generated/car-rental-page-menu-block-dry-run.generated.json`。

## detected page entries

| 状态 | 条目 | 文件 | 说明 |
| --- | --- | --- | --- |
| existing | Page initialization dry-run plan builder | `packages/shared/nocobase-automation/src/pageInitializationPlan.ts` | 已存在结构化 page/menu/block/filter/action 计划。 |
| existing | Page initialization dry-run executor | `packages/shared/nocobase-automation/src/pageInitializationExecutor.ts` | 使用 mock adapter，不创建真实页面。 |
| existing | Page initialization validator | `packages/shared/nocobase-automation/src/pageInitializationValidator.ts` | 包含必需页面、动作和敏感字段规则。 |
| existing | rental core server registration plan | `packages/plugins/plugin-rental-core/src/server/pluginRegistration.ts` | server collections/services/actions/permissions 计划存在。 |
| existing | contract documents server registration plan | `packages/plugins/plugin-contract-documents/src/server/pluginRegistration.ts` | 合同文件服务端计划存在。 |
| existing | iopgps server registration plan | `packages/plugins/plugin-iopgps/src/server/pluginRegistration.ts` | GPS/IOPGPS 服务端计划存在；真实 IOPGPS 未启用。 |

## planned page entries

- 车辆管理页面。
- 司机管理页面。
- 合同管理页面。
- 合同创建页面。
- 合同详情页面。
- 时限合同页面。
- 长租合同页面。
- 日租金台账页面。
- 付款登记页面。
- 付款按日分配页面。
- 押金管理页面。
- 欠款看板页面。
- 当前欠款日历页面。
- 免租日显示。
- 未付原因管理。
- 合同文档生成页面。
- 合同打印/下载入口。
- GPS mock 状态页面。
- IOPGPS 设置页面，真实凭据默认隐藏。
- operation logs 页面。
- 管理员菜单。
- 财务菜单。
- 普通操作员菜单。
- 权限敏感字段显示控制 placeholder。

## missing page entries

- `packages/plugins/plugin-rental-core/src/client/` 缺失，真实 client runtime 尚未实现。
- `packages/plugins/plugin-contract-documents/src/client/` 缺失，真实合同文件 UI 尚未实现。
- `packages/plugins/plugin-iopgps/src/client/` 缺失，真实 GPS/IOPGPS UI 尚未实现。
- 真实 addRoutes / addMenu / app.addComponents / schemaInitializer / schemaSettings 尚未实现。
- 本阶段禁止写 UI schema，因此真实 schema 文件保持 missing。

## menu matrix

| 菜单 | 角色 | 覆盖范围 | 状态 |
| --- | --- | --- | --- |
| 管理员菜单 | system_admin | 全部计划页面、系统设置、operation logs | planned |
| 财务菜单 | manager, accountant | 台账、付款、押金、欠款看板、当前欠款日历 | planned |
| 普通操作员菜单 | operator | 车辆、司机、合同、合同文件非敏感入口 | planned |
| GPS 管理菜单 | system_admin, manager, gps_maintenance | GPS mock 状态、GPS 设备、IOPGPS 设置占位 | planned |

## block matrix

| 区块类型 | 覆盖项 | 状态 |
| --- | --- | --- |
| table block | 车辆、司机、合同、日租金台账、付款、押金、合同文档、GPS、operation logs | planned |
| form block | 合同创建、付款登记、押金创建 action placeholder | planned |
| details block | 司机详情、合同详情、车辆 GPS 状态 | planned |
| filter block | 日期、司机、车辆、合同、状态、欠款筛选 | planned |
| calendar block | 当前欠款日历、免租日显示 | planned |
| action button | 生成台账、登记付款、付款冲正、合同文档生成、GPS mock 同步按钮占位 | planned |
| collection block | 基于已计划 collections 的 table/relation 区块 | planned |

## sensitive field UI rules

- 司机证件号、证件照、驾驶证文件默认隐藏。
- 付款截图默认隐藏，普通操作员不可见。
- 合同扫描件、生成 DOCX/PDF 文件默认隐藏。
- 总付款、总欠款、未来应收等财务汇总默认按角色隐藏，GPS 维护角色不可见。
- IOPGPS appid/login_key/access_token 等真实凭据不得在普通 UI 出现。

## blockers

当前 JSON dry-run 未记录必须立即阻断 Codex 阶段的 blocker。若后续发现真实 IOPGPS secret 可能在 UI 中显示、mock 数据可能进入生产页面初始化、或 production_ready=true，将立即列为 blocker。

## warnings

- 当前不要求用户本地运行。
- 正式版前才本地执行真实页面 / 菜单 / 区块初始化验证。
- 本 dry-run 不连接数据库、不创建真实页面、不注册真实菜单、不写 UI schema、不执行 migration。
- mock 数据不能进入生产。
- 真实 IOPGPS 未启用。

## modification_items

- 补齐 car-rental 插件真实 client runtime 页面入口。
- 补齐真实 addRoutes / addMenu / app.addComponents / schemaInitializer / schemaSettings。
- 补齐合同创建、合同详情、付款按日分配、时限合同、长租合同、IOPGPS 设置页面的真实 UI 实现。
- 后续在真实 NocoBase client runtime 中实现页面、菜单、区块和权限敏感字段显示控制。
- 正式版前在 local_pre_release 环境执行真实页面初始化验证。
