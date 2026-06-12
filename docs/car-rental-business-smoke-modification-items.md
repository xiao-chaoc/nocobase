# Car Rental Business Smoke Modification Items

本清单对应 Business smoke test stage。当前执行模式为 Codex-only `codex_dry_run` / `codex_mock_report`，当前不要求用户本地运行；正式版前才本地执行真实业务 smoke 验证。当前仍为 `production_ready=false`，mock 数据不得进入生产，不启用真实 IOPGPS。

| 编号 | smoke 规则项 | 状态 | 业务规则 | 涉及 fixture | 是否阻塞 UAT | 是否阻塞生产 | Codex 修改建议 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BSM-001 | driver no login | pass | 司机存在且不登录系统 | drivers.mock.json | 否 | 是 | 保持司机 fixture 只有 mock 身份字段，不加入登录字段 | dry-run 报告 BS-001 为 pass | 已建立 dry-run |
| BSM-002 | vehicle plate required | pass | 车辆存在且必须有车牌 | vehicles.mock.json | 否 | 是 | 保持每辆车 `plate_number` 非空 | dry-run 报告 BS-002 为 pass | 已建立 dry-run |
| BSM-003 | contract driver binding | pass | 合同必须绑定司机 | lease-contracts.mock.json, drivers.mock.json | 否 | 是 | 新增合同 fixture 时同步新增或复用 mock driver | dry-run 报告 BS-003 为 pass | 已建立 dry-run |
| BSM-004 | contract vehicle binding | pass | 合同必须绑定车辆 | lease-contracts.mock.json, vehicles.mock.json | 否 | 是 | 新增合同 fixture 时同步新增或复用 mock vehicle | dry-run 报告 BS-004 为 pass | 已建立 dry-run |
| BSM-005 | deposit required | pass | 合同必须有押金 | lease-contracts.mock.json, deposit-records.mock.json | 否 | 是 | 每份合同至少保留一条押金记录 | dry-run 报告 BS-005 为 pass | 已建立 dry-run |
| BSM-006 | long-term contract | pass | 支持长租合同 | lease-contracts.mock.json | 否 | 是 | 保留 open-ended 长租合同 fixture | dry-run 报告 BS-006 为 pass | 已建立 dry-run |
| BSM-007 | time-bound contract | pass | 支持时限合同 | lease-contracts.mock.json | 否 | 是 | 保留 fixed-term 时限合同 fixture | dry-run 报告 BS-007 为 pass | 已建立 dry-run |
| BSM-008 | natural month for time-bound contract | pending_verification | 时限合同以自然月为周期 | lease-contracts.mock.json | 否 | 是 | Codex 先校验日期边界；正式版前本地验证自然月周期生成 | dry-run 有结构检查，pre-release local execution 再验真实周期 | 待正式版前本地验证 |
| BSM-009 | natural week rent calculation | pass | 所有合同按自然周计算租金 | rent-daily-ledgers.mock.json | 否 | 是 | 保持日台账 `natural_week` 字段 | dry-run 报告 BS-009 为 pass | 已建立 dry-run |
| BSM-010 | selected free-rent days | pass | 默认免租日必须来自合同生成时选择 | lease-contracts.mock.json | 否 | 是 | 保持 `default_free_rent_days` 来源于合同 fixture | dry-run 报告 BS-010 为 pass | 已建立 dry-run |
| BSM-011 | daily ledger by date | pass | 免租日应体现在日租金台账，日租金台账必须按日期生成 | lease-contracts.mock.json, rent-daily-ledgers.mock.json | 否 | 是 | 新增免租日时同步新增对应日台账 | dry-run 报告 BS-011、BS-012 为 pass | 已建立 dry-run |
| BSM-012 | payment allocation by date | pass | 付款必须按日分配 | rent-payments.mock.json, rent-payment-allocations.mock.json, rent-daily-ledgers.mock.json | 否 | 是 | 保持 allocation 绑定 daily ledger 和 allocation date | dry-run 报告 BS-013 为 pass | 已建立 dry-run |
| BSM-013 | no overpay per day | pass | 单日不可超付 | rent-daily-ledgers.mock.json, rent-payment-allocations.mock.json | 是 | 是 | 若出现超付，立即调整 allocation 或 ledger fixture | dry-run 报告 BS-014 为 pass 且 blockers 为空 | 已建立 dry-run |
| BSM-014 | unpaid reason | pass | 未付日期必须有未付原因或状态 | rent-daily-ledgers.mock.json | 否 | 是 | 未付/部分欠款台账必须保留 `unpaid_reason` 或状态 | dry-run 报告 BS-015 为 pass | 已建立 dry-run |
| BSM-015 | current arrears excludes future receivables | pass | 欠款计算只统计当前日期及以前，当前欠款不包含未来应收 | lease-contracts.mock.json | 是 | 是 | 保持 `current_arrears_excludes_future_receivables=true`；真实算法留待 pre-release 本地验证 | dry-run 报告 BS-016 为 pass | 已建立 dry-run |
| BSM-016 | deposit collect / offset / refund | pass | 押金收取、抵扣、退还存在 | deposit-records.mock.json | 否 | 是 | 保留 collect / offset / refund 三类押金事件 | dry-run 报告 FR-001、FR-002、FR-003 为 pass | 已建立 dry-run |
| BSM-017 | deposit not counted as rent income | pass | 押金不计入租金收入 | deposit-records.mock.json | 是 | 是 | 保持所有押金记录 `rent_income=false` | dry-run 报告 FR-004 为 pass | 已建立 dry-run |
| BSM-018 | contract document placeholder | pass | 合同文档使用 placeholder，不使用真实扫描件 | contract-documents.mock.json | 是 | 是 | 仅允许 placeholder 引用和 `real_file_attached=false` | dry-run 报告 BS-017 为 pass | 已建立 dry-run |
| BSM-019 | GPS not used for rent calculation | pass | GPS 不参与租金计算 | rent-daily-ledgers.mock.json, gps-status.mock.json | 是 | 是 | 保持租金台账不引用 GPS/IOPGPS 计算字段 | dry-run 报告 BS-019 为 pass | 已建立 dry-run |
| BSM-020 | IOPGPS real sync disabled | pass | IOPGPS 真实同步默认禁用 | gps-status.mock.json, run-isolated-business-smoke-test.sh | 是 | 是 | 保持 dry-run 禁用真实 IOPGPS | dry-run 报告 BS-020 为 pass | 已建立 dry-run |
| BSM-021 | operation logs | pass | operation logs 存在 | operation-logs.mock.json | 否 | 是 | 保留操作日志 mock fixture | dry-run 报告 BS-021 为 pass | 已建立 dry-run |
| BSM-022 | privacy guard | pass | mock 数据不得包含真实隐私数据 | all safe mock fixtures | 是 | 是 | 若新增 fixture，继续使用 MOCK/placeholder 数据并跑 guard | dry-run 报告 PG-002 为 pass | 已建立 dry-run |
| BSM-023 | production guard | pass | mock 数据不得进入生产 | mock-manifest.json | 是 | 是 | 保持 `mock_data_only=true`、`not_for_production=true` 和 manifest production guard | dry-run 报告 PR-003 为 pass，production_ready=false | 已建立 dry-run |

## 下一步

下一轮 Codex 应补齐 Contract document test stage；GPS mock、backup/rollback、production init guard 仍为 pending。
