# Car Rental Codex-only Project Status

- generated_at: 2026-06-11T15:27:51.864Z
- workflow_mode: codex_only
- local_nas_test_status: paused
- local_docker_status: deleted_by_user
- target_version: 2.0.61
- package_manager: yarn
- production_ready: false
- pre_release_local_required: true
- privacy_data_local_required: true
- mock_data_allowed_in_production: false

## Current completed items

- 完整 NocoBase v2.0.61 宿主工程基线已确认
- Codex-only workflow 文档已创建
- local NAS paused 状态已记录
- run-full retained for future pre-release execution
- production_ready=false 门禁保持开启

## Current pending items

- Runtime / 服务 / 动作注册测试脚本
- 权限与敏感字段测试脚本
- 页面 / 菜单 / 区块初始化测试脚本
- mock 数据导入测试脚本
- 核心业务 smoke test 脚本
- 合同文件测试脚本
- GPS mock 测试脚本
- 备份 / 回滚演练脚本
- 完整 pre-release 总报告
- 生产初始化脚本草案与生产防 mock 门禁

## Current blockers

- 用户已删除本地 NAS 测试目录，当前无法执行本地 Docker / PostgreSQL 验证
- 当前不能使用真实 IOPGPS
- 当前不能使用真实司机资料、真实付款截图或真实合同扫描件
- mock data cannot enter production

## Next Codex tasks

- 补齐 Runtime / 服务 / 动作注册测试脚本
- 补齐权限与敏感字段测试脚本
- 补齐页面 / 菜单 / 区块初始化测试脚本
- 补齐 mock 数据导入和生产防 mock 门禁
- 生成正式部署 runbook 与隐私数据导入前检查清单

## Next user actions

- 审查 Codex PR
- 合并 PR
- 确认业务规则
- 正式版前重新 clone 到新目录
- 正式版前配置生产 .env、新 PostgreSQL volume 和新 storage
- 提供真实隐私数据前进行人工确认
