# Car Rental Mock Data Import Plan

## 1. 阶段目标

Mock data import 阶段用于在正式版前总测试路线图中准备可审计、可 dry-run、可阻断生产误用的汽车租赁 mock 数据导入基础。当前目标是补齐 Codex-only workflow 下的计划、fixture、dry-run 报告、修改项清单和生产防 mock 门禁，而不是执行真实数据导入。

## 2. 当前 Codex-only 执行模式

- workflow_mode: `codex_only`
- stage: `mock_data_import`
- execution_mode: `codex_dry_run`
- production_ready=false
- 当前不要求用户本地运行。
- 正式版前才本地执行真实 pre-release mock import 验证。
- run-full retained for future pre-release execution，当前只把 Mock data import 阶段记录为 codex_dry_run / codex_mock_report。

## 3. 当前不真实导入数据的原因

1. 用户已删除本地 NAS 测试目录和 Docker 容器。
2. 当前不要求用户本地运行测试。
3. 本轮禁止真实连接数据库、真实导入数据、写 schema 或执行 migration。
4. 当前不能使用真实 IOPGPS、真实司机资料、真实付款截图或真实合同扫描件。
5. mock 数据不能进入生产；mock data cannot enter production。
6. production init must not call mock import。

## 4. 已发现 mock / fixture / seed 入口

| 入口 | 状态 | 说明 |
| --- | --- | --- |
| `test-data/generated/` | existing | 已有 Codex-only dry-run JSON 报告目录。 |
| `packages/plugins/plugin-rental-core/src/server/collections/` | existing | 已有 drivers、vehicles、leaseContracts、rentDailyLedgers、rentPayments、rentPaymentAllocations、depositRecords 等 collection 定义入口。 |
| `packages/plugins/plugin-rental-core/src/server/services/` | existing | 已有 ledger、payment allocation、deposit、contract lifecycle 等服务入口。 |
| `packages/plugins/plugin-contract-documents/src/server/collections/` | existing | 已有 contractTemplates、contractDocuments collection 入口。 |
| `packages/plugins/plugin-contract-documents/src/server/services/` | existing | 已有 contract document、print、scan、template 服务入口。 |
| `packages/plugins/plugin-iopgps/src/server/collections/` | existing | 已有 GPS device、status、location、mileage、IOPGPS settings collection 入口。 |
| `packages/plugins/plugin-iopgps/src/server/services/` | existing | 已有 IOPGPS token、location、status、mileage normalize 等服务入口；当前不得启用真实同步。 |
| `packages/shared/nocobase-automation/src/` | existing | 已有自动化规划、校验和 dry-run 相关共享工具入口。 |
| `scripts/car-rental/` | existing | 已有 runtime、permission、page/menu/block 等 Codex-only dry-run 脚本和校验脚本。 |
| `test-data/mock/car-rental/` | existing | 本阶段新增安全 mock fixture 目录。 |

## 5. 缺失 mock import 项

| mock import 项 | 状态 | 说明 |
| --- | --- | --- |
| 真实 pre-release mock import 执行器 | missing | 本轮禁止真实连接数据库，正式版前才本地执行。 |
| DB 写入型 seed/import pipeline | missing | 当前只允许 dry-run 校验 fixture。 |
| 真实 IOPGPS mock-to-runtime adapter | missing | 当前不能调用真实 IOPGPS。 |
| 真实合同文件生成和 storage 写入 | missing | 当前不得生成真实合同文件。 |
| 生产初始化隔离调用检查 | missing | 后续 Production init guard stage 继续补齐。 |

## 6. Planned mock import 项

| mock import 项 | 状态 | 业务规则 |
| --- | --- | --- |
| mock drivers | planned | 明显假名、假 phone、MOCK- document numbers。 |
| mock vehicles | planned | MOCK-PLATE 车牌、mock GPS device。 |
| mock lease contracts | planned | 长租合同、时限合同、免租日、当前欠款排除未来应收。 |
| mock rent daily ledgers | planned | 自然周租金台账、未付原因、欠款。 |
| mock rent payments | planned | placeholder payment proof，不引用真实付款截图。 |
| mock rent payment allocations | planned | 付款按日分配、单日不可超付。 |
| mock deposit records | planned | 押金收取、抵扣、退还，押金不计入租金收入。 |
| mock operation logs | planned | 创建合同、分配付款、查看欠款等操作日志。 |
| mock contract document metadata | planned | placeholder scan/generated file reference，不引用真实合同扫描件。 |
| mock GPS status | planned | mock online/offline 状态，无真实轨迹。 |
| mock IOPGPS sync records | planned | 只允许 mock sync id，不含真实凭据。 |

## 7. Pending verification mock import 项

| 项目 | 状态 | 需要验证 |
| --- | --- | --- |
| NocoBase collection import API 适配 | pending_verification | 正式版前在 isolated_test_database 验证。 |
| 权限字段和 mock 导入字段映射 | pending_verification | 需与后续业务 smoke test 联动。 |
| 合同文档 placeholder 与真实文档模块关系 | pending_verification | 需在 Contract document test stage 验证。 |
| GPS mock status 与真实 IOPGPS 服务隔离 | pending_verification | 需在 GPS mock test stage 验证。 |

## 8. 允许的 mock 数据类型

- mock drivers。
- mock vehicles。
- mock lease contracts。
- mock rent daily ledgers。
- mock rent payments。
- mock rent payment allocations。
- mock deposit records。
- mock operation logs。
- mock contract document metadata。
- mock GPS status。
- mock IOPGPS sync records，但不含真实凭据。

## 9. 禁止的 mock 数据类型

- 真实司机姓名。
- 真实身份证 / 驾照 / 护照号码。
- 真实手机号。
- 真实地址。
- 真实付款截图。
- 真实合同扫描件。
- 真实 IOPGPS login key。
- 真实 GPS 原始轨迹。
- 真实银行卡或支付账号。
- 真实客户资料。
- 真实车辆隐私资料。

## 10. 生产门禁

- mock import 只允许 isolated_test_database。
- mock import 必须要求 CAR_RENTAL_MOCK_DATA_ONLY=true。
- mock import 必须拒绝 production_database。
- mock import 必须拒绝 DB_DATABASE 包含 prod。
- 生产初始化不得调用 mock import；production init must not call mock import。
- mock fixture 可以提交，但必须是假数据。
- generated filled request / dump / SQL 不得提交。
- mock 数据不能进入生产；mock data cannot enter production。
