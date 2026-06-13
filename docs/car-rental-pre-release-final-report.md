# Car Rental Pre-release Final Report

## 当前总体状态

- workflow_mode: codex_only
- target_version: 2.0.61
- package_manager: yarn
- local_nas_test_status: paused
- local_docker_status: deleted_by_user
- production_ready: false
- uat_ready: false
- 当前不要求用户本地运行；正式版前才恢复本地/NAS pre-release 真实执行。

## 已完成 Codex-only dry-run 阶段

- Collection registration / execute preparation: missing_report
- Runtime / service / action registration stage: codex_dry_run
- Permission / sensitive field stage: codex_dry_run
- Page / menu / block initialization stage: codex_dry_run
- Mock data import stage: codex_dry_run
- Business smoke test stage: codex_dry_run
- Contract document test stage: codex_dry_run
- GPS mock test stage: codex_dry_run
- Backup / rollback rehearsal stage: codex_dry_run
- Production init guard stage: codex_dry_run

## 未完成真实执行阶段

Collection / Runtime / Permission / Page / Mock import / Smoke / Contract / GPS / Backup rollback / Production init guard 均尚未完成本地/NAS pre-release 真实执行。

## 每阶段结果表

| 阶段 | 名称 | 状态 | 报告 | 需要真实执行 | production_ready |
| --- | --- | --- | --- | --- | --- |
| collection | Collection registration / execute preparation | missing_report | test-data/generated/isolated-collection-registration-test-report.generated.json | true | false |
| runtime | Runtime / service / action registration stage | codex_dry_run | test-data/generated/car-rental-runtime-registration-dry-run.generated.json | true | false |
| permission_sensitive_field | Permission / sensitive field stage | codex_dry_run | test-data/generated/car-rental-permission-sensitive-field-dry-run.generated.json | true | false |
| page_menu_block | Page / menu / block initialization stage | codex_dry_run | test-data/generated/car-rental-page-menu-block-dry-run.generated.json | true | false |
| mock_data_import | Mock data import stage | codex_dry_run | test-data/generated/car-rental-mock-data-import-dry-run.generated.json | true | false |
| business_smoke | Business smoke test stage | codex_dry_run | test-data/generated/car-rental-business-smoke-dry-run.generated.json | true | false |
| contract_document | Contract document test stage | codex_dry_run | test-data/generated/car-rental-contract-document-dry-run.generated.json | true | false |
| gps_mock | GPS mock test stage | codex_dry_run | test-data/generated/car-rental-gps-mock-dry-run.generated.json | true | false |
| backup_rollback_rehearsal | Backup / rollback rehearsal stage | codex_dry_run | test-data/generated/car-rental-backup-rollback-rehearsal-dry-run.generated.json | true | false |
| production_init_guard | Production init guard stage | codex_dry_run | test-data/generated/car-rental-production-init-guard-dry-run.generated.json | true | false |

## Blockers 汇总

- Missing report for Collection registration / execute preparation: test-data/generated/isolated-collection-registration-test-report.generated.json
- 本地/NAS pre-release 真实执行尚未完成。
- UAT checklist 尚未完成。
- Privacy data import guard 尚未完成。
- Production deployment runbook 尚未完成。

## Warnings 汇总

- runtime: 当前 Codex-only 阶段不要求用户本地运行；正式版前才进行本地/NAS 隔离执行。
- runtime: 本 dry-run 不连接数据库、不注册真实 runtime、不写 schema、不执行 migration。
- permission_sensitive_field: 当前不要求用户本地运行；正式版前才本地执行真实权限注册和本地/NAS 隔离验证。
- permission_sensitive_field: 本 dry-run 不连接数据库、不真实注册权限、不创建角色、不写 schema、不执行 migration、不启用真实 IOPGPS。
- permission_sensitive_field: missing_permission_entries 只记录为修改项，不导致 Codex-only dry-run 失败。
- permission_sensitive_field: mock 数据不能进入生产，真实司机资料、真实付款截图、真实合同扫描件均不得用于本阶段。
- page_menu_block: 当前不要求用户本地运行；正式版前才本地执行真实页面/菜单/区块初始化验证。
- page_menu_block: 本 dry-run 不连接数据库、不创建真实页面、不注册真实菜单、不写 UI schema、不执行 migration。
- page_menu_block: mock 数据不能进入生产；本阶段不导入任何数据。
- page_menu_block: 真实 IOPGPS 未启用，GPS 页面只能按 mock 状态规划。
- mock_data_import: 当前不要求用户本地运行；正式版前才本地执行真实 pre-release mock import 验证。
- mock_data_import: Codex-only dry-run 不连接数据库、不导入真实数据、不导入 mock 数据到数据库、不写 schema、不执行 migration。
- mock_data_import: 不启用真实 IOPGPS；GPS / IOPGPS 仅允许 mock status 和 mock sync id。
- mock_data_import: mock 数据不能进入生产；production init must not call mock import。
- contract_document: No required metadata gaps detected in the Codex-only dry-run; real template content still requires pre-release local verification.
- gps_mock: Codex-only GPS mock dry-run does not replace formal pre-release local verification.
- gps_mock: Real IOPGPS credentials and real GPS tracks must remain outside Git and outside reports.
- backup_rollback_rehearsal: Codex-only dry-run does not replace formal pre-release local/NAS backup and restore execution.
- backup_rollback_rehearsal: 当前不要求用户本地运行；未来正式版前才生成真实 backup dump。
- backup_rollback_rehearsal: 当前没有有效本地 dump，且不得引用已删除的本地 NAS dump 作为当前有效备份。
- production_init_guard: pre-release local execution is still required
- production_init_guard: current local execution is not required
- 当前不要求用户本地运行；正式版前才恢复本地/NAS。
- 真实 IOPGPS 默认仍应禁用。
- mock 数据不得进入生产。

## 修改项汇总

详见 docs/car-rental-pre-release-remaining-modification-items.md。

## 风险清单

| 风险编号 | 风险描述 | 来源阶段 | 严重程度 | 当前状态 |
| --- | --- | --- | --- | --- |
| R-001 | NocoBase 真实 API 与 dry-run 假设不一致 | collection | high | open |
| R-002 | Collection 真实注册失败 | collection | high | open |
| R-003 | Runtime 服务 / 动作无法真实注册 | runtime | high | open |
| R-004 | 权限字段隐藏不生效 | permission_sensitive_field | critical | open |
| R-005 | 敏感字段泄露 | permission_sensitive_field | critical | open |
| R-006 | 页面 UI schema 不兼容 | page_menu_block | medium | open |
| R-007 | mock 数据被误导入生产 | mock_data_import | critical | open |
| R-008 | 付款单日超付校验失效 | business_smoke | high | open |
| R-009 | 押金误计入租金收入 | business_smoke | high | open |
| R-010 | 当前欠款错误包含未来应收 | business_smoke | high | open |
| R-011 | 合同文件三语内容不一致 | contract_document | medium | open |
| R-012 | 真实合同扫描件误提交 | contract_document | critical | open |
| R-013 | IOPGPS 被误启用 | gps_mock | critical | open |
| R-014 | GPS 数据参与租金计算 | gps_mock | high | open |
| R-015 | GPS 失败影响租金台账 | gps_mock | high | open |
| R-016 | 备份失败 | backup_rollback_rehearsal | critical | open |
| R-017 | 回滚失败 | backup_rollback_rehearsal | critical | open |
| R-018 | 生产复用测试 volume / storage / dump / env | production_init_guard | critical | open |
| R-019 | 生产初始化导入 mock 数据 | production_init_guard | critical | open |
| R-020 | 隐私数据导入流程缺失 | privacy_data_import_guard | critical | open |
| R-021 | UAT 未执行 | uat | critical | open |
| R-022 | production_ready 被误标记 | final_aggregation | critical | open |

## Go / No-Go 判定

- Codex-only dry-run: partial_complete
- UAT: No-Go
- Production: No-Go

## 为什么当前不是 production_ready

尚未完成本地/NAS pre-release 真实执行、UAT、真实权限验证、备份回滚实操、隐私数据导入流程和生产部署 runbook；production_ready 不由 Codex 自动置 true。

## 为什么当前不是 UAT ready

UAT 前置清单尚未通过，真实 Collection / Runtime / Permission / Page / Mock import / Smoke / Contract / GPS / Backup rollback 均未执行。

## 用户本地测试已暂停说明

用户已删除本地 NAS 测试目录和 Docker 容器；当前不要求用户本地运行。run-full 仅保留为未来正式版前本地/NAS 执行入口。

## 正式版前恢复本地/NAS 执行条件

生产前必须重新 clone、新目录、新 env、新 DB volume、新 storage；不得复用测试 volume、storage、dump 或 env。

## 生产与外部服务边界

mock 数据不得进入生产。真实 IOPGPS 默认仍应禁用。不得使用真实司机资料、真实付款截图或真实合同扫描件完成 Codex dry-run。

## 下一步 Codex 任务

- Implement privacy data import guard stage.
- Implement production deployment runbook stage.
- Finalize UAT checklist stage.
- Prepare pre-release local execution recovery package.
- Implement real local/NAS pre-release report ingestion stage.

## production_ready 自动置位说明

Codex 不自动置 production_ready=true，生产就绪必须由人工在真实执行和 UAT 后确认。
