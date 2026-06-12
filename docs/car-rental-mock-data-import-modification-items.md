# Car Rental Mock Import Modification Items

当前不要求用户本地运行；正式版前才本地执行真实 pre-release mock import 验证。mock 数据不能进入生产；mock data cannot enter production。production init must not call mock import。

| 编号 | mock 数据项 | 状态 existing / planned / missing / pending_verification | 业务规则 | 涉及 fixture | 是否阻塞 UAT | 是否阻塞生产 | Codex 修改建议 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MI-001 | mock drivers | existing | 明显假名、mock phone、MOCK- document numbers | `drivers.mock.json` | 否 | 否 | 保持假数据，不加入真实个人信息 | dry-run privacy guard 通过 | done |
| MI-002 | mock vehicles | existing | MOCK-PLATE 假车牌、mock GPS device | `vehicles.mock.json` | 否 | 否 | 保持 fake plate 和 fake VIN reference | fixture 存在且 marker 完整 | done |
| MI-003 | mock lease contracts | existing | long-term contract case；time-bound contract case | `lease-contracts.mock.json` | 否 | 否 | 后续接入真实 isolated import adapter | 两类合同均覆盖 | done |
| MI-004 | mock rent daily ledgers | existing | weekly rent ledger case；free-rent day case；unpaid reason case；arrears case | `rent-daily-ledgers.mock.json` | 否 | 否 | 后续 Business smoke test 校验计算结果 | 台账覆盖自然周、免租、欠款 | done |
| MI-005 | mock rent payments | existing | payment allocation case 使用 placeholder proof | `rent-payments.mock.json` | 否 | 否 | 禁止真实付款截图 | screenshot_reference 为 placeholder | done |
| MI-006 | mock rent payment allocations | existing | payment allocation；no overpay per day case | `rent-payment-allocations.mock.json` | 否 | 否 | smoke test 校验每日分配不超租金 | allocation amount 不超过 ledger rent | done |
| MI-007 | mock deposit records | existing | deposit collect / offset / refund case | `deposit-records.mock.json` | 否 | 否 | smoke test 校验押金生命周期 | collect、offset、refund 均覆盖 | done |
| MI-008 | mock operation logs | existing | operation logs case | `operation-logs.mock.json` | 否 | 否 | 后续验证审计列表可读 | 操作日志 fixture 存在 | done |
| MI-009 | mock contract document metadata | existing | 合同文档 placeholder，不使用真实扫描件 | `contract-documents.mock.json` | 否 | 否 | Contract document test stage 消费 metadata | scan/generated references 均为 placeholder | done |
| MI-010 | mock GPS status | existing | GPS mock status；mock IOPGPS sync records 无真实凭据 | `gps-status.mock.json` | 否 | 否 | GPS mock test stage 消费 status | 不含真实 credential | done |
| MI-011 | long-term contract case | existing | 长租合同无结束日，当前欠款不包含未来应收 | `lease-contracts.mock.json` | 否 | 否 | smoke test 校验 open-ended ledger | case 字段可扫描 | done |
| MI-012 | time-bound contract case | existing | 时限合同含 start/end date | `lease-contracts.mock.json` | 否 | 否 | smoke test 校验固定周期台账 | case 字段可扫描 | done |
| MI-013 | weekly rent ledger case | existing | 自然周租金台账 | `rent-daily-ledgers.mock.json`, `mock-manifest.json` | 否 | 否 | smoke test 校验 natural_week | manifest 覆盖 | done |
| MI-014 | free-rent day case | existing | 默认免租日 | `rent-daily-ledgers.mock.json` | 否 | 否 | 校验 rent_amount=0 | status=free_rent_day | done |
| MI-015 | payment allocation case | existing | 付款按日分配 | `rent-payment-allocations.mock.json` | 否 | 否 | 校验 payment->ledger references | allocation records 存在 | done |
| MI-016 | no overpay per day case | existing | 单日不可超付 | `rent-payment-allocations.mock.json` | 否 | 否 | smoke test 校验 allocated_amount <= rent_amount | no_overpay_per_day=true | done |
| MI-017 | unpaid reason case | existing | 未付原因 | `rent-daily-ledgers.mock.json` | 否 | 否 | 后续补 unpaid reason collection 映射 | unpaid_reason 使用 MOCK- 前缀 | done |
| MI-018 | arrears case | existing | 欠款 | `rent-daily-ledgers.mock.json` | 否 | 否 | smoke test 校验 arrears_amount | partial/unpaid ledger 存在 | done |
| MI-019 | deposit collect / offset / refund case | existing | 押金收取、抵扣、退还 | `deposit-records.mock.json` | 否 | 否 | smoke test 校验押金状态流转 | 三类事件均存在 | done |
| MI-020 | deposit not counted as rent income case | existing | 押金不计入租金收入 | `deposit-records.mock.json`, `mock-manifest.json` | 否 | 否 | smoke test 校验 rent_income=false | 所有 deposit rent_income=false | done |
| MI-021 | current arrears excludes future receivables case | existing | 当前欠款不包含未来应收 | `lease-contracts.mock.json`, `mock-manifest.json` | 否 | 否 | Business smoke test 校验截止日计算 | case 覆盖 | done |
| MI-022 | privacy guard case | existing | 拒绝真实个人信息、真实凭据、真实文件路径 | dry-run script, validation script | 是 | 是 | 保持 guard 阻断能力 | production guard 校验通过 | done |
| MI-023 | production guard case | existing | mock import 只允许 isolated_test_database，拒绝生产 | dry-run script, validation script, docs | 是 | 是 | 后续 Production init guard stage 再交叉验证 | 文档和 report 均声明不能进生产 | done |
| MI-024 | real pre-release import execution | missing | 真实 isolated_test_database 导入验证 | future script | 是 | 是 | 正式版前才本地执行 | local_pre_release 环境验证通过 | pending |
| MI-025 | collection import adapter mapping | pending_verification | fixture 到 NocoBase collection 写入映射 | future adapter | 是 | 是 | 后续在本地隔离库验证 | 不连接生产、不使用真实数据 | pending |
