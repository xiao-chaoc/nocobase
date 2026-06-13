# Car Rental Pre-release Risk Register

| 风险编号 | 风险描述 | 来源阶段 | 严重程度 | 触发条件 | 影响 | 缓解措施 | 是否阻塞 UAT | 是否阻塞生产 | 当前状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-001 | NocoBase 真实 API 与 dry-run 假设不一致 | collection | high | 真实执行时 API 行为不同 | 注册失败 | 本地/NAS 真实执行验证 | 是 | 是 | open |
| R-002 | Collection 真实注册失败 | collection | high | schema/权限不兼容 | 数据模型不可用 | 保留回滚并修正注册计划 | 是 | 是 | open |
| R-003 | Runtime 服务 / 动作无法真实注册 | runtime | high | 服务或 action API 不兼容 | 业务动作不可用 | 真实 Runtime 报告验证 | 是 | 是 | open |
| R-004 | 权限字段隐藏不生效 | permission | critical | 角色配置未生效 | 越权访问 | 权限矩阵逐项验证 | 是 | 是 | open |
| R-005 | 敏感字段泄露 | permission | critical | UI/API 未隐藏敏感字段 | 隐私泄露 | 隐私字段 guard 和真实权限验证 | 是 | 是 | open |
| R-006 | 页面 UI schema 不兼容 | page_menu_block | medium | UI 初始化失败 | UAT 无法使用 | 真实 UI 初始化和截图验证 | 是 | 是 | open |
| R-007 | mock 数据被误导入生产 | mock_data_import | critical | 环境 guard 失效 | 生产污染 | mock production guard | 是 | 是 | open |
| R-008 | 付款单日超付校验失效 | business_smoke | high | 业务校验未生效 | 财务错误 | smoke test 真实执行 | 是 | 是 | open |
| R-009 | 押金误计入租金收入 | business_smoke | high | 分类规则错误 | 收入错误 | 财务断言验证 | 是 | 是 | open |
| R-010 | 当前欠款错误包含未来应收 | business_smoke | high | 账龄规则错误 | 催收错误 | 欠款口径验证 | 是 | 是 | open |
| R-011 | 合同文件三语内容不一致 | contract_document | medium | 模板翻译不同步 | 法务风险 | 三语模板比对 | 是 | 是 | open |
| R-012 | 真实合同扫描件误提交 | contract_document | critical | 真实附件进入仓库 | 隐私泄露 | 禁止真实扫描件，使用 mock | 是 | 是 | open |
| R-013 | IOPGPS 被误启用 | gps_mock | critical | 环境变量或开关错误 | 调用真实外部服务 | 默认禁用真实 IOPGPS | 是 | 是 | open |
| R-014 | GPS 数据参与租金计算 | gps_mock | high | 业务边界错误 | 账单错误 | GPS 与租金解耦验证 | 是 | 是 | open |
| R-015 | GPS 失败影响租金台账 | gps_mock | high | 同步失败传播 | 核心业务中断 | 故障隔离验证 | 是 | 是 | open |
| R-016 | 备份失败 | backup_rollback | critical | 备份命令或存储失败 | 无法恢复 | 备份实操演练 | 是 | 是 | open |
| R-017 | 回滚失败 | backup_rollback | critical | dump/storage 不可恢复 | 灾难恢复失败 | 回滚实操演练 | 是 | 是 | open |
| R-018 | 生产复用测试 volume / storage / dump / env | production_init_guard | critical | 部署路径复用 | 生产污染/泄密 | 新 clone、新目录、新 env、新 DB volume、新 storage | 是 | 是 | open |
| R-019 | 生产初始化导入 mock 数据 | production_init_guard | critical | init 流程误用 mock | 生产污染 | mock_data_allowed_in_production=false | 是 | 是 | open |
| R-020 | 隐私数据导入流程缺失 | privacy_data | critical | 真实数据导入无 guard | 隐私泄露 | 下一轮补齐隐私数据导入 guard | 是 | 是 | open |
| R-021 | UAT 未执行 | uat | critical | 未完成用户验收 | 业务未确认 | 完成 UAT checklist | 是 | 是 | open |
| R-022 | production_ready 被误标记 | final_aggregation | critical | 自动置 true 或人工误判 | 过早上线 | production_ready 不由 Codex 自动置 true | 是 | 是 | open |
