# Car Rental Business Smoke Test Plan

## 1. Business smoke test 阶段目标

Business smoke test 是正式版前总测试路线图的第 6 阶段，用于在不接触真实数据库、真实 IOPGPS、真实司机资料、真实付款截图、真实合同扫描件的前提下，基于已提交的 safe mock fixtures 做离线业务规则 dry-run / smoke analysis。

本阶段目标：

- 确认司机、车辆、合同、押金、日租金台账、付款分配、合同文档 placeholder、GPS mock status、operation logs 等核心业务 fixtures 已覆盖。
- 离线识别会阻塞 UAT 或生产的业务规则缺口。
- 生成 JSON/Markdown 报告与修改项清单，供后续 Codex 阶段和正式版前本地/NAS 验证使用。
- 保持 `production_ready=false`，不把当前 Codex-only dry-run 误判为生产就绪。

## 2. 当前 Codex-only 执行模式

- workflow_mode: `codex_only`
- stage: `business_smoke_test`
- execution_mode: `codex_dry_run`
- production_ready: `false`
- local_execution_required_pre_release: `true`

当前不要求用户本地运行；正式版前才本地执行真实 Business smoke test。`run-full-isolated-system-test.sh` 仍保留为未来正式版前本地/NAS 执行入口，本轮只由 Codex 维护脚本、报告、mock/dry-run 文件和修改项清单。

## 3. 当前不真实连接数据库的原因

- 用户已删除本地 NAS 测试目录和 Docker 容器。
- 本轮任务明确要求不真实连接数据库、不真实导入数据、不写 schema、不执行 migration。
- 当前不能使用真实 IOPGPS、真实司机资料、真实付款截图、真实合同扫描件。
- mock 数据只允许用于 Codex-only 离线分析，不得进入生产。
- 当前仍不是 production_ready。

## 4. 使用的 mock fixtures

- `test-data/mock/car-rental/mock-manifest.json`
- `test-data/mock/car-rental/drivers.mock.json`
- `test-data/mock/car-rental/vehicles.mock.json`
- `test-data/mock/car-rental/lease-contracts.mock.json`
- `test-data/mock/car-rental/rent-daily-ledgers.mock.json`
- `test-data/mock/car-rental/rent-payments.mock.json`
- `test-data/mock/car-rental/rent-payment-allocations.mock.json`
- `test-data/mock/car-rental/deposit-records.mock.json`
- `test-data/mock/car-rental/operation-logs.mock.json`
- `test-data/mock/car-rental/contract-documents.mock.json`
- `test-data/mock/car-rental/gps-status.mock.json`

## 5. 业务规则覆盖矩阵

| 编号 | smoke 规则项 | Codex-only 检查方式 | 涉及 fixture | 预期 |
| --- | --- | --- | --- | --- |
| BS-001 | driver no login | 检查司机存在，且无登录账号/密码字段 | drivers | pass |
| BS-002 | vehicle plate required | 检查车辆存在且 `plate_number` 非空 | vehicles | pass |
| BS-003 | contract driver binding | 检查合同 `driver_id` 可解析到司机 | lease-contracts, drivers | pass |
| BS-004 | contract vehicle binding | 检查合同 `vehicle_id` 可解析到车辆 | lease-contracts, vehicles | pass |
| BS-005 | deposit required | 检查每份合同存在押金记录 | lease-contracts, deposit-records | pass |
| BS-006 | long-term contract | 检查存在 open-ended 长租合同 | lease-contracts | pass |
| BS-007 | time-bound contract | 检查存在 fixed-term 时限合同 | lease-contracts | pass |
| BS-008 | natural month for time-bound contract | 检查时限合同有自然日期边界，真实月周期留待 pre-release 本地验证 | lease-contracts | pass / pending_verification |
| BS-009 | natural week rent calculation | 检查日租金台账包含 `natural_week` | rent-daily-ledgers | pass |
| BS-010 | selected free-rent days | 检查合同生成时选择的默认免租日 | lease-contracts | pass |
| BS-011 | free-rent days reflected in daily ledger | 检查免租日存在对应日租金台账 | lease-contracts, rent-daily-ledgers | pass |
| BS-012 | daily ledger by date | 检查日租金台账按日期生成 | rent-daily-ledgers | pass |
| BS-013 | payment allocation by date | 检查付款分配绑定到日台账和分配日期 | rent-payments, rent-payment-allocations, rent-daily-ledgers | pass |
| BS-014 | no overpay per day | 检查单日已付不超过应收，分配标记无超付 | rent-daily-ledgers, rent-payment-allocations | pass / blocker |
| BS-015 | unpaid reason | 检查未付/部分欠款日期有未付原因或状态 | rent-daily-ledgers | pass |
| BS-016 | current arrears excludes future receivables | 检查当前欠款不包含未来应收标记 | lease-contracts | pass / blocker |
| FR-001 | deposit collect exists | 检查押金收取事件存在 | deposit-records | pass |
| FR-002 | deposit offset exists | 检查押金抵扣事件存在 | deposit-records | pass |
| FR-003 | deposit refund exists | 检查押金退还事件存在 | deposit-records | pass |
| FR-004 | deposit not counted as rent income | 检查押金记录 `rent_income=false` | deposit-records | pass / blocker |
| BS-017 | contract document placeholder | 检查合同文档为 placeholder 且未附真实文件 | contract-documents | pass / blocker |
| BS-018 | GPS mock status exists | 检查 GPS mock status 存在 | gps-status | pass |
| BS-019 | GPS not used for rent calculation | 检查租金台账无 GPS/IOPGPS 计算引用 | rent-daily-ledgers, gps-status | pass / blocker |
| BS-020 | IOPGPS real sync disabled | 检查真实同步默认禁用 | gps-status, dry-run env | pass / blocker |
| BS-021 | operation logs | 检查 operation logs 存在 | operation-logs | pass |
| PG-002 | privacy guard | 检查 mock 数据不得包含真实隐私数据 | all fixtures | pass / blocker |
| PR-003 | production guard | 检查 mock 数据不得进入生产 | mock-manifest | pass / blocker |

## 6. 通过标准

Business smoke Codex-only dry-run 通过标准：

- JSON 报告包含 `workflow_mode=codex_only`、`stage=business_smoke_test`、`execution_mode=codex_dry_run`。
- JSON 报告包含 `production_ready=false` 和 `local_execution_required_pre_release=true`。
- 核心业务规则、财务规则、隐私 guard、生产 guard 均生成结构化结果。
- 未发现单日超付。
- 未发现押金计入租金收入。
- 未发现当前欠款包含未来应收。
- 未发现 GPS 参与租金计算。
- 未发现真实隐私数据或真实凭据。
- 未发现 production_ready=true。

## 7. 失败处理

- 若发现 blocker，写入 dry-run JSON 的 `blockers`，并由总控脚本合并到总报告 blockers。
- 若发现缺失或待验证项，写入 `modification_items`，并同步到业务 smoke 修改项清单。
- 不允许为了通过而伪造业务规则结果；safe mock fixtures 不覆盖的规则必须记录为 blocker、missing 或 pending_verification。
- blocker 修复后由 Codex 更新 fixtures / dry-run 逻辑 / 文档，再重新生成报告。

## 8. 修改项生成规则

- blocker：阻塞 UAT 和生产，必须在正式版前修复。
- missing：fixture 或 dry-run 规则缺失，需要补 fixture 或补脚本规则。
- pending_verification：Codex-only 离线可做结构检查，但真实行为仍需正式版前本地/NAS 验证。
- warning：不阻塞当前 Codex-only 阶段，但需要保留在后续验证清单。
- pass：当前 safe mock fixture dry-run 已覆盖，但不代表生产就绪。

## 9. 禁止事项

- 不真实连接数据库。
- 不真实导入数据。
- 不写 schema。
- 不执行 migration。
- 不启用真实 IOPGPS。
- 不使用真实司机资料。
- 不使用真实付款截图。
- 不使用真实合同扫描件。
- 不标记 production_ready。
- mock 数据不得进入生产。
