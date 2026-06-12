# Car Rental Codex-only Project Status

- generated_at: 2026-06-12T13:30:01.648Z
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
- Codex-only workflow established.
- Local NAS test paused.
- Full isolated system test plan created.
- Runtime registration dry-run stage added.
- Permission and sensitive field dry-run stage added.
- Page/menu/block dry-run stage added.
- Mock data import dry-run stage added.
- Safe mock fixtures added.
- Mock data production guard added.
- Business smoke test dry-run stage added.
- production_ready=false 门禁保持开启

## Current pending items

- Contract document test stage.
- GPS mock test stage.
- Backup/rollback rehearsal stage.
- Production init guard stage.

## Current blockers

- 用户已删除本地 NAS 测试目录，当前无法执行本地 Docker / PostgreSQL 验证
- 当前不能使用真实 IOPGPS
- 当前不能使用真实司机资料、真实付款截图或真实合同扫描件
- mock data cannot enter production

## Next Codex tasks

- Implement contract document test stage.
- 补齐 GPS mock test stage
- 生成正式部署 runbook 与隐私数据导入前检查清单

## Next user actions

- 审查 Codex PR
- 合并 PR
- 确认业务规则
- 正式版前重新 clone 到新目录
- 正式版前配置生产 .env、新 PostgreSQL volume 和新 storage
- 提供真实隐私数据前进行人工确认
