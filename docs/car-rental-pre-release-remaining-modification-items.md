# Car Rental Pre-release Remaining Modification Items

当前不要求用户本地运行；正式版前才恢复本地/NAS pre-release 真实执行。production_ready 不由 Codex 自动置 true。

| 编号 | 来源阶段 | 修改项 | 类型 | 是否阻塞 UAT | 是否阻塞 production | Codex 可处理 | 是否需要用户确认 | 建议下一步 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REM-001 | Runtime | Runtime 真实注册仍需 pre-release 本地验证 | pending_verification | 是 | 是 | 部分 | 是 | 恢复本地/NAS 后执行真实 Runtime 注册报告 | 真实报告通过且无 blocker | open |
| REM-002 | Permission | 权限真实注册仍需 pre-release 本地验证 | pending_verification | 是 | 是 | 部分 | 是 | 执行角色、字段隐藏、敏感字段访问验证 | 权限矩阵真实通过 | open |
| REM-003 | Page/Menu/Block | 页面 / 菜单 / 区块真实初始化仍需 pre-release 本地验证 | pending_verification | 是 | 是 | 部分 | 是 | 在真实 NocoBase UI 初始化并截图/记录 | UI schema 兼容且可导航 | open |
| REM-004 | Mock import | mock 数据真实导入仍需 pre-release 本地验证 | pending_verification | 是 | 是 | 部分 | 是 | 仅在隔离测试库导入 mock | mock 只进入测试库且 guard 生效 | open |
| REM-005 | Business smoke | business smoke 真实执行仍需 pre-release 本地验证 | pending_verification | 是 | 是 | 部分 | 是 | 执行租金、押金、欠款 smoke | 业务断言通过 | open |
| REM-006 | Contract document | 合同文档真实生成仍需 pre-release 本地验证 | pending_verification | 是 | 是 | 部分 | 是 | 使用 mock 合同数据生成测试文档 | 三语内容一致且不含真实扫描件 | open |
| REM-007 | GPS mock | GPS mock 真实页面/同步流程仍需 pre-release 本地验证 | pending_verification | 是 | 是 | 部分 | 是 | 执行 GPS mock 页面和同步隔离验证 | IOPGPS 真实同步禁用且 mock 正常 | open |
| REM-008 | Backup rollback | 备份/回滚真实演练仍需 pre-release 本地验证 | blocker | 是 | 是 | 部分 | 是 | 在测试环境执行备份和回滚 | 备份可恢复且无数据错位 | open |
| REM-009 | Production init guard | production init guard 仍需正式版前人工确认 | blocker | 是 | 是 | 是 | 是 | 校验新 clone、新 env、新 DB volume、新 storage | 拒绝测试产物进入生产 | open |
| REM-010 | Privacy data | 隐私数据导入 guard 尚未完成 | missing | 是 | 是 | 是 | 是 | 下一轮实现 privacy data import guard stage | 禁止真实隐私数据进入 Codex dry-run，生产导入需人工确认 | open |
| REM-011 | UAT | UAT checklist 尚未完成 | planned | 是 | 是 | 是 | 是 | 细化 UAT 场景、账号、角色和数据 | UAT checklist 可执行且通过 | open |
| REM-012 | Production runbook | Production deployment runbook 尚未完成 | planned | 是 | 是 | 是 | 是 | 编写生产部署 runbook | runbook 覆盖部署、回滚、密钥、存储和确认人 | open |
