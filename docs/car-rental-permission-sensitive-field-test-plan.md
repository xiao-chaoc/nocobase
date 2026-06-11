# Car Rental Permission / Sensitive Field Test Plan

## 阶段目标

Permission / sensitive field 阶段用于在 Codex-only workflow 下先补齐权限策略计划、敏感字段 dry-run 检查、角色矩阵、缺失项报告和修改项清单。当前目标是把正式版前必须验证的 ACL / permission / role / field visibility / resource action / operation log redaction 入口固化到仓库中，避免后续真实注册权限时遗漏敏感字段。

## 当前 Codex-only 执行模式

- workflow_mode: `codex_only`。
- execution_mode: `codex_dry_run` / `codex_mock_report`。
- production_ready=false。
- 当前不要求用户本地运行；正式版前才本地执行真实权限注册和本地/NAS 隔离验证。
- run-full retained for future pre-release execution，当前不要求用户运行 run-full。

## 当前不真实注册权限的原因

用户已删除本地 NAS 测试目录和 Docker 容器；本轮任务只在 GitHub 仓库中维护测试脚本、报告、mock/dry-run 文件和修改项清单。本阶段不能真实连接数据库、不能真实注册权限、不能创建真实角色、不能写 schema、不能执行 migration、不能真实创建页面、不能导入数据，也不能启用真实 IOPGPS。mock 数据不能进入生产，真实司机资料、真实付款截图、真实合同扫描件均不得用于本阶段。

## 已发现 ACL / permission / visibility 入口

| 状态 | 入口 | 涉及插件/模块 | 说明 |
| --- | --- | --- | --- |
| existing | `pluginRegistration.permissions` notes | plugin-iopgps | 已有权限说明草案，提到 system_admin / manager / gps_maintenance 可操作 GPS，同步凭据不默认给财务和运营查看。 |
| existing | `contractDocumentsActionRegistry.requiredRoles` | plugin-contract-documents | 已有 action 级 requiredRoles 草案，但尚未确认真实 ACL 注册。 |
| existing | `contractScanService` signed scan note | plugin-contract-documents | 已有合同扫描件敏感字段说明和 operation log TODO。 |
| existing | `permissionPlanNormalizer` / runtime automation permission planning | packages/shared/nocobase-automation | 已有权限计划规范化和 runtime dry-run 侧记录能力。 |
| existing | service/action/collection source roots | plugin-rental-core / plugin-contract-documents / plugin-iopgps | 可作为后续 resource action / field visibility 真实注册输入。 |

## 缺失权限项

以下项目目前没有被确认成真实权限注册或真实字段可见性规则，标记为 missing，并进入 modification_items：

- 总收入隐藏规则。
- 总付款额隐藏规则。
- 未来应收隐藏规则。
- 付款截图访问规则。
- 合同扫描件访问规则的真实 ACL 绑定。
- 司机证件访问规则。
- IOPGPS secret 隐藏规则的真实 UI/API 验证。
- GPS 原始轨迹访问规则。
- 系统密钥永不暴露规则。
- 司机不登录规则。
- customer portal 禁止规则。
- online payment 禁止规则。

## planned 权限项

- finance_sensitive_totals_visibility：财务敏感汇总字段只对财务和管理员可见。
- payment_attachment_visibility：完整付款截图仅财务和管理员可访问。
- contract_scan_visibility：合同扫描件仅授权管理角色可访问。
- driver_document_visibility：司机证件字段必须脱敏，司机不登录系统。
- iopgps_secret_never_exposed：IOPGPS 登录凭据、系统密钥和 token 永不在 UI/API/operation logs 中明文暴露。
- gps_raw_track_visibility：车辆 GPS 原始轨迹仅管理员和 GPS 维护角色可访问。
- operation_log_redaction_policy：operation logs 可审计但不得泄露密钥。

## pending_verification 权限项

- NocoBase v2.0.61 真实 ACL / resource action / field permission API 的准确注册点。
- owner scoped access / record permissions 是否需要按门店、车辆归属或业务 owner 扩展。
- 页面 / 菜单 / 区块初始化阶段的字段隐藏与按钮可见性绑定方式。

## 禁止事项

- 不真实连接数据库。
- 不真实注册权限。
- 不真实创建角色。
- 不真实创建页面。
- 不真实导入数据。
- 不写 schema。
- 不执行 migration。
- 不启用真实 IOPGPS。
- 不使用真实司机资料。
- 不使用真实付款截图。
- 不使用真实合同扫描件。
- 不把 mock 数据导入生产；mock 数据不能进入生产。
- 不标记 production_ready。

## 必须覆盖的敏感字段与权限规则

- 非授权角色不得查看总收入。
- 非授权角色不得查看总付款额。
- 非授权角色不得查看未来应收。
- 非授权角色不得查看完整付款截图。
- 非授权角色不得查看合同扫描件。
- 非授权角色不得查看司机证件。
- 非授权角色不得查看 IOPGPS 登录凭据。
- 非授权角色不得查看车辆 GPS 原始轨迹。
- 普通操作员只能看到必要操作字段。
- 财务角色可以查看收款、欠款、押金，但仍不得查看系统密钥。
- 管理员可以查看业务敏感数据，但不得在 UI/API 中暴露系统密钥。
- 司机不登录系统。
- 没有司机端权限。
- 没有 customer portal。
- 没有 online payment permission。
- 押金不计入租金收入。
- 当前欠款不包含未来应收。
- operation logs 可审计，但不得泄露密钥。

## 验收标准

- dry-run JSON 报告存在或可生成。
- Markdown 报告和修改项清单均记录 production_ready=false。
- 缺失权限项不会导致 dry-run 失败退出，但必须进入 missing_permission_entries 和 modification_items。
- 任何系统密钥、真实 token、真实 password 或真实凭据泄露风险必须列为 blocker。
- 正式版前才本地执行真实权限注册验证；当前不要求用户本地运行。
