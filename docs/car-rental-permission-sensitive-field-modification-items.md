# Car Rental Permission / Sensitive Field 修改项清单

当前阶段：Codex-only permission_sensitive_field dry-run。当前不要求用户本地运行；正式版前才本地执行真实权限注册和本地/NAS 隔离验证。production_ready=false。不启用真实 IOPGPS，不使用真实司机资料、真实付款截图、真实合同扫描件，mock 数据不能进入生产。

| 编号 | 权限 / 敏感字段项 | 状态 | 业务规则 | 涉及插件 | 涉及文件 | 是否阻塞 UAT | 是否阻塞生产 | Codex 修改建议 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-001 | 总收入隐藏规则 | missing | 非授权角色不得查看总收入；押金不计入租金收入。 | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/` | 是 | 是 | 后续接入 field visibility / API projection / resource action ACL。 | operator 无法查看总收入，finance/admin 按授权查看，押金不计入租金收入。 | 待实现真实权限 |
| P-002 | 总付款额隐藏规则 | missing | 非授权角色不得查看总付款额。 | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/` | 是 | 是 | 增加付款汇总字段权限和接口脱敏。 | operator 无法查看总付款额，finance/admin 按授权查看。 | 待实现真实权限 |
| P-003 | 未来应收隐藏规则 | missing | 非授权角色不得查看未来应收；当前欠款不包含未来应收。 | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/` | 是 | 是 | 增加未来应收字段隐藏、欠款计算权限说明和测试 fixture。 | operator 不可见未来应收；欠款接口不混入未来应收。 | 待实现真实权限 |
| P-004 | 付款截图访问规则 | missing | 非授权角色不得查看完整付款截图。 | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/` | 是 | 是 | 增加文件引用脱敏和下载 action 权限。 | 未授权角色只看到脱敏状态，不能下载完整付款截图。 | 待实现真实权限 |
| P-005 | 合同扫描件访问规则 | planned | 非授权角色不得查看合同扫描件。 | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/contractScanService.ts` | 是 | 是 | 将 signed_scan_file 敏感字段说明接入真实 ACL 和文件访问策略。 | 未授权角色不能查看或下载合同扫描件。 | 已有敏感字段说明，待真实 ACL |
| P-006 | 司机证件访问规则 | missing | 非授权角色不得查看司机证件。 | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/` | 是 | 是 | 新增司机证件字段脱敏和 API projection。 | 非授权角色无法看到证件原文或图片。 | 待实现真实权限 |
| P-007 | IOPGPS secret 隐藏规则 | planned | 非授权角色不得查看 IOPGPS 登录凭据；系统密钥永不暴露。 | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/` | 是 | 是 | 只保留加密存储/脱敏状态，operation logs 不记录明文凭据。 | UI/API/report/log 不暴露 IOPGPS 登录凭据或系统密钥。 | 已有草案，待真实 ACL |
| P-008 | GPS 原始轨迹访问规则 | missing | 非授权角色不得查看车辆 GPS 原始轨迹。 | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/` | 是 | 是 | 增加 GPS raw track resource action 和角色可见性规则。 | 只有授权管理员/GPS 维护角色可访问原始轨迹。 | 待实现真实权限 |
| P-009 | 普通操作员权限 | planned | 普通操作员只能看到必要操作字段。 | plugin-rental-core / plugin-contract-documents | `packages/plugins/*/src/server/` | 是 | 是 | 定义 operator 字段白名单和动作白名单。 | operator 无敏感汇总、证件、凭据、原始轨迹访问权。 | 待实现真实权限 |
| P-010 | 财务角色权限 | planned | 财务角色可以查看收款、欠款、押金，但仍不得查看系统密钥。 | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/` | 是 | 是 | 定义 finance role matrix、付款/欠款/押金字段权限。 | finance 可看财务字段，不能看系统密钥和 GPS 原始轨迹。 | 待实现真实权限 |
| P-011 | 管理员业务敏感数据权限 | planned | 管理员可以查看业务敏感数据，但不得在 UI/API 中暴露系统密钥。 | all car-rental plugins | `packages/plugins/plugin-rental-core/src/server/`, `packages/plugins/plugin-contract-documents/src/server/`, `packages/plugins/plugin-iopgps/src/server/` | 是 | 是 | 区分业务敏感数据与系统密钥，管理员也只看脱敏凭据状态。 | admin 可执行业务管理，但不能获取密钥明文。 | 待实现真实权限 |
| P-012 | 系统密钥永不暴露规则 | planned | 系统密钥永不在 UI/API/report/operation logs 中暴露。 | plugin-iopgps / shared automation | `packages/plugins/plugin-iopgps/src/server/`, `packages/shared/nocobase-automation/src/` | 是 | 是 | 增加统一 redaction policy 和日志扫描。 | 任意 dry-run/report/log 不含真实 token/password/secret 值。 | 待实现真实权限 |
| P-013 | 司机不登录规则 | missing | 司机不登录系统，没有司机端权限。 | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/` | 否 | 是 | 明确不创建 driver role、不创建 driver login、不开放司机端入口。 | 无 driver role、无司机登录入口、无司机端页面。 | 待实现禁止策略 |
| P-014 | customer portal 禁止规则 | missing | 没有 customer portal。 | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/` | 否 | 是 | 后续 page/menu 阶段检查不得创建 customer portal。 | 无 customer portal 菜单、路由、权限。 | 待实现禁止策略 |
| P-015 | online payment 禁止规则 | missing | 没有 online payment permission。 | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/` | 否 | 是 | 后续 mock data / smoke test 阶段确认不创建在线支付权限。 | 无 online payment action、role、menu、collection permission。 | 待实现禁止策略 |
| P-016 | operation log 审计规则 | planned | operation logs 可审计，但不得泄露密钥。 | all car-rental plugins | `packages/plugins/*/src/server/` | 是 | 是 | 关键动作写审计日志，写入前做字段脱敏。 | operation logs 可追溯业务动作，不能包含密钥、凭据、真实文件内容。 | 待实现真实权限 |

## 下一步

1. Page / menu / block initialization stage。
2. Mock data import test stage。
3. Business smoke test stage。

正式权限注册和本地/NAS 验证保留到 local_pre_release；当前仍 production_ready=false。
