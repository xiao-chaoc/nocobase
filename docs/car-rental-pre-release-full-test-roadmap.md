# Car Rental 正式版前一键隔离总测试路线图

本文定义正式版前集中总结测试路线图。目标是不再让用户逐个手工执行细小门禁，而是由 Codex / 脚本组织隔离测试、汇总报告和修改项清单。

## 阶段 1：Collection 注册隔离测试

- 输入：`.env.car-rental-collection-test`、`docker-compose.car-rental-collection-test.yml`、Collection execute request、测试库备份。
- 自动脚本：`scripts/car-rental/run-isolated-collection-registration-test.sh`。
- 输出报告：`test-data/generated/isolated-collection-registration-test-report.generated.json`。
- 成功标准：隔离 PostgreSQL ready，备份成功，request 生成 / 校验 / dry-run / preflight 成功；execute 仅在显式门禁下通过。
- 失败处理：使用报告中的 rollback 命令恢复测试库。
- 是否允许 mock 数据：允许，仅限隔离测试库。
- 是否允许生产执行：不允许。

## 阶段 2：Runtime / 服务 / 动作注册隔离测试

- 当前状态：codex_dry_run 已建立。
- Runtime 真实执行：仍为 local_pre_release，正式版前才本地执行。
- 输入：Runtime / service / action 注册计划、Codex-only 源码扫描结果、Collection 测试报告。
- 自动脚本：`scripts/car-rental/run-isolated-runtime-registration-test.sh`。
- 输出报告：`test-data/generated/car-rental-runtime-registration-dry-run.generated.json`、`docs/car-rental-runtime-registration-dry-run-report.md`。
- 成功标准：当前仅生成 dry-run / mock report，不连接数据库、不真实注册 runtime、不写 schema、不启用真实 IOPGPS；后续真实服务、动作、runtime 元数据必须在正式版前隔离库内完成并可回滚。
- 失败处理：记录 blockers 和 modification_items；真实执行失败时回滚隔离库。
- 是否允许 mock 数据：允许，仅限 Codex-only mock report 或隔离测试库；mock 数据不能进入生产。
- 是否允许生产执行：不允许。

## 阶段 3：权限和敏感字段隔离测试

- 输入：角色权限矩阵、敏感字段清单、隔离测试库。
- 自动脚本：`scripts/car-rental/run-isolated-permission-test.sh`。
- 输出报告：权限和敏感字段隔离报告。
- 成功标准：司机证件、付款凭证、合同文件等敏感字段满足最小可见范围。
- 失败处理：生成权限修改项。
- 是否允许 mock 数据：允许，但不得包含真实司机资料、真实付款截图或真实合同扫描件。
- 是否允许生产执行：不允许。

## 阶段 4：页面 / 菜单 / 区块初始化测试

- 输入：页面初始化计划、菜单计划、区块计划、隔离测试库。
- 自动脚本：`scripts/car-rental/run-isolated-page-initialization-test.sh`。
- 输出报告：页面初始化报告。
- 成功标准：核心页面、菜单入口、列表 / 表单 / 看板区块可初始化且不覆盖生产配置。
- 失败处理：生成页面 / 菜单修改项。
- 是否允许 mock 数据：允许。
- 是否允许生产执行：不允许。

## 阶段 5：mock 数据导入测试

- 当前状态：codex_dry_run 已建立。
- Mock data import 真实执行：仍为 local_pre_release，正式版前才本地执行。
- 输入：safe mock fixture、mock 数据门禁、Codex-only dry-run 扫描结果。
- 自动脚本：`scripts/car-rental/run-isolated-mock-data-import-test.sh`。
- 输出报告：`test-data/generated/car-rental-mock-data-import-dry-run.generated.json`、`docs/car-rental-mock-data-import-dry-run-report.md`。
- 成功标准：当前仅 dry-run 校验 fixture，不连接数据库、不导入数据、不写 schema、不执行 migration、不启用真实 IOPGPS；真实 local_pre_release 执行时仅允许 `isolated_test_database` 且 `CAR_RENTAL_MOCK_DATA_ONLY=true`。
- 失败处理：记录 blockers 和 fixture 修改项；真实 local_pre_release 失败时删除或回滚测试数据。
- 是否允许 mock 数据：允许，仅限 Codex-only fixture 或隔离测试库；mock 数据不能进入生产。
- 是否允许生产执行：不允许。

## 阶段 6：核心业务 smoke test

- 当前状态：codex_dry_run 已建立。
- Business smoke test 真实执行：仍为 local_pre_release，正式版前才本地执行。
- 当前不要求用户本地运行。
- 输入：合同、司机、车辆、付款、台账、押金、合同文档 placeholder、GPS mock status、operation logs safe mock fixtures。
- 自动脚本：`scripts/car-rental/run-isolated-business-smoke-test.sh`。
- 输出报告：
  - `test-data/generated/car-rental-business-smoke-dry-run.generated.json`
  - `docs/car-rental-business-smoke-dry-run-report.md`
  - `docs/car-rental-business-smoke-modification-items.md`
- 成功标准：以下业务规则在 Codex-only dry-run 中生成结构化结果，blocker 必须进入报告：
  - 司机存在且不登录系统。
  - 车辆存在且必须有车牌。
  - 合同必须绑定司机和车辆。
  - 合同必须有押金。
  - 支持长租合同和时限合同。
  - 时限合同以自然月为周期。
  - 所有合同按自然周计算租金。
  - 默认免租日来自合同生成时选择并体现在日租金台账。
  - 日租金台账按日期生成。
  - 付款必须按日分配，单日不可超付。
  - 未付日期必须有未付原因或状态。
  - 欠款计算只统计当前日期及以前，当前欠款不包含未来应收。
  - 押金收取 / 抵扣 / 退还存在，押金不计入租金收入。
  - 合同文档使用 placeholder，不使用真实扫描件。
  - GPS mock status 存在，GPS 不参与租金计算，IOPGPS 真实同步默认禁用。
  - operation logs 存在。
  - mock 数据不得包含真实隐私数据，mock 数据不得进入生产。
- 失败处理：记录阻塞 UAT / 阻塞生产的问题并生成修改项。
- 是否允许 mock 数据：允许，仅限 Codex-only mock report 或隔离测试库；mock 数据不能进入生产。
- 是否允许生产执行：不允许。

## 阶段 7：合同文件测试

- 输入：合同文件模块、安全合同文档 fixture、placeholder metadata。
- 自动脚本：`scripts/car-rental/run-isolated-contract-document-test.sh`。
- 输出报告：`test-data/generated/car-rental-contract-document-dry-run.generated.json` 和 `docs/car-rental-contract-document-dry-run-report.md`。
- 当前状态：codex_dry_run 已建立；真实执行仍为 local_pre_release。
- 成功标准：三语 metadata、合同/司机/车辆/押金/租金/免租日/线下签署字段、placeholder guard、privacy guard、production guard 均通过；不得使用真实合同扫描件，不生成真实合同文件。
- 失败处理：生成 blockers 和 modification_items，不清理真实文件，因为本阶段不上传文件。
- 是否允许 mock 数据：允许，仅允许 safe mock fixture 和 placeholder。
- 是否允许生产执行：不允许。

## 阶段 8：GPS mock 测试

- 当前状态：codex_dry_run 已建立。
- GPS mock test 真实执行：仍为 local_pre_release，正式版前才本地执行。
- 输入：plugin-iopgps、GPS mock fixture、隔离测试库。
- 自动脚本：`scripts/car-rental/run-isolated-gps-mock-test.sh`。
- 输出报告：`test-data/generated/car-rental-gps-mock-dry-run.generated.json`、`docs/car-rental-gps-mock-dry-run-report.md`。
- 成功标准：`IOPGPS_SYNC_ENABLED=false`，不调用真实 IOPGPS，仅验证 mock 数据映射、GPS 状态/里程/定位 placeholder、车辆绑定和失败隔离；GPS 不参与租金计算。
- 失败处理：生成 GPS 映射 / 同步策略修改项。
- 是否允许 mock 数据：允许，仅限 safe mock fixture；mock 数据不能进入生产。
- 是否允许生产执行：不允许。

## 阶段 9：备份 / 回滚演练

- 输入：隔离测试库、备份文件、回滚脚本。
- 自动脚本：`scripts/car-rental/run-isolated-backup-rollback-test.sh`。
- 输出报告：备份 / 回滚演练报告。
- 成功标准：备份可恢复、恢复后核心校验通过、报告记录回滚命令。
- 失败处理：阻塞 UAT 和生产，必须先修复。
- 是否允许 mock 数据：允许。
- 是否允许生产执行：不允许。

## 阶段 10：完整测试报告和修改项清单

- 输入：所有阶段报告。
- 自动脚本：`scripts/car-rental/run-full-isolated-system-test.sh`。
- 输出报告：
  - `test-data/generated/car-rental-full-isolated-system-test-report.generated.json`
  - `docs/car-rental-full-isolated-system-test-report.md`
- 成功标准：所有已实现阶段通过，未实现阶段明确 skipped，并进入 modification_items。
- 失败处理：集中生成 blockers、warnings、modification_items，交给 Codex 后续批量修复。
- 是否允许 mock 数据：允许，仅限测试。
- 是否允许生产执行：不允许。

## Codex-only 执行模式调整（2026-06-11）

当前路线图明确本地即时测试已暂停。用户已删除本地 NAS 测试目录和 Docker 容器，因此当前由 Codex 维护测试脚本和模拟/静态报告；真实 Docker / PostgreSQL 执行移动到正式版前的 pre-release local execution 阶段。

| 阶段 | 当前执行模式 | 当前责任方 | modification_items |
| --- | --- | --- | --- |
| Collection 注册隔离测试 | codex_dry_run | Codex 维护脚本、request 模板、dry-run 报告 | 保留 run-isolated 和 run-full，未来 pre-release 再执行真实本地/NAS 测试 |
| Runtime / 服务 / 动作注册测试 | codex_dry_run 已建立；真实执行仍为 local_pre_release | Codex | Runtime dry-run 脚本、JSON report、报告文档、修改项清单已建立；仍需后续实现真实 runtime |
| 权限与敏感字段测试 | codex_dry_run 已建立；真实执行仍为 local_pre_release | Codex | Permission dry-run 脚本、JSON report、报告文档、修改项清单已建立；仍需后续实现真实权限注册和本地 pre-release 验证 |
| 页面 / 菜单 / 区块初始化测试 | codex_dry_run 已建立；真实执行仍为 local_pre_release | Codex | Page / menu / block dry-run 已建立；真实执行仍为 local_pre_release |
| mock 数据导入测试 | codex_dry_run 已建立；真实执行仍为 local_pre_release | Codex | Mock data import dry-run、safe mock fixtures、JSON / Markdown 报告和生产防 mock 门禁已建立；仍需后续真实 pre-release 导入验证 |
| 核心业务 smoke test | codex_dry_run 已建立；真实执行仍为 local_pre_release | Codex | Business smoke dry-run、JSON / Markdown 报告、修改项清单、校验脚本和测试已建立 |
| 合同文件测试 | codex_dry_run 已建立；真实执行仍为 local_pre_release | Codex | Contract document dry-run、JSON / Markdown 报告、修改项清单、校验脚本和测试已建立；禁止真实合同扫描件，正式版前才本地执行真实合同文件验证 |
| GPS mock 测试 | codex_dry_run 已建立；真实执行仍为 local_pre_release | Codex | GPS mock dry-run、JSON / Markdown 报告、修改项清单、校验脚本和测试已建立；禁止真实 IOPGPS |
| 备份 / 回滚演练 | next_codex_task | Codex | 维护 backup / restore 脚本和 rollback drill 模板，当前不生成本地 dump |
| 正式版前本地/NAS 总执行 | local_pre_release | 用户在正式版前执行 | 重新 clone、新目录、新 env、新 DB volume、新 storage 后运行总测试 |
| 生产初始化 | pending | 用户 + Codex runbook | 生产初始化必须与测试初始化分离，mock data cannot enter production |

### Codex-only 阶段规则

- local NAS paused，Docker containers deleted by user。
- current local test not required，当前不要求用户本地启动 Docker、运行 PostgreSQL、运行 run-full、生成 backup dump 或生成 filled request。
- run-full retained for future pre-release execution：`scripts/car-rental/run-full-isolated-system-test.sh` 保留为未来正式版前本地/NAS 总入口。
- pre-release local execution 才进行真实本地/NAS 执行。
- production_ready=false，当前仍不能标记 production_ready。

## Page / menu / block 阶段更新（2026-06-11）

- Page / menu / block 阶段标记为 codex_dry_run 已建立。
- Page / menu / block 真实执行仍为 local_pre_release。
- Mock data import 阶段标记为 codex_dry_run 已建立。
- Mock data import 真实执行仍为 local_pre_release。
- Business smoke test 阶段标记为 codex_dry_run 已建立。
- Business smoke test 真实执行仍为 local_pre_release。
- Contract document test 阶段标记为 codex_dry_run 已建立。
- Contract document test 真实执行仍为 local_pre_release。
- GPS mock test 阶段标记为 codex_dry_run 已建立。
- GPS mock test 真实执行仍为 local_pre_release。
- Backup/rollback rehearsal 阶段标记为 next_codex_task。
- Production init guard 仍为 pending。


## Contract document test 阶段更新（2026-06-12）

- Contract document test 阶段标记为 codex_dry_run 已建立。
- Contract document test 真实执行仍为 local_pre_release。
- 当前不要求用户本地运行，不生成真实合同文件，不提交真实合同扫描件。
- production_ready=false。
- GPS mock test 阶段标记为 codex_dry_run 已建立。
- GPS mock test 真实执行仍为 local_pre_release。
- Backup/rollback rehearsal 阶段标记为 next_codex_task。
- Production init guard 仍为 pending。


## GPS mock test 阶段更新（2026-06-12）

- GPS mock test 阶段标记为 codex_dry_run 已建立。
- GPS mock test 真实执行仍为 local_pre_release，正式版前才本地执行。
- 当前不要求用户本地运行，不调用真实 IOPGPS，不使用真实 GPS 轨迹。
- production_ready=false。
- Backup/rollback rehearsal 阶段标记为 next_codex_task。
- Production init guard 仍为 pending。
