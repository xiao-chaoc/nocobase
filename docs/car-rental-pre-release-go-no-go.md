# Car Rental Pre-release Go / No-Go

## 当前判定

- Codex-only dry-run 阶段：接近完成或已完成，以最终 JSON 的 missing_reports 为准。
- UAT: No-Go
- Production: No-Go
- production_ready=false
- uat_ready=false

## No-Go 原因

- 本地/NAS pre-release 真实执行已暂停。
- 未执行真实 Collection / Runtime / Permission / Page / Mock import / Smoke / Contract / GPS / Backup rollback。
- 未完成 UAT。
- 未完成生产部署 runbook。
- 未完成隐私数据导入 guard。
- 未完成真实 IOPGPS 启用流程。
- 未验证真实权限。
- 未验证真实备份回滚。
- 当前不要求用户本地运行；正式版前才恢复本地/NAS。

## Go 条件

- 完成本地/NAS pre-release execution。
- 所有阶段真实报告通过。
- UAT checklist 通过。
- 生产部署 runbook 完成。
- 生产初始化 guard 通过。
- 隐私数据导入 guard 通过。
- 备份回滚实操通过。
- production_ready 仍需要人工确认，不由 Codex 自动置 true。
