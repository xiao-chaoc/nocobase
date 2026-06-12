# Car Rental Mock Data Import Dry-run Report

- 当前阶段: mock_data_import
- 执行模式: codex_dry_run / codex_mock_report
- workflow_mode: codex_only
- production_ready=false
- local_execution_required_pre_release=true
- 当前不要求用户本地运行。
- 正式版前才本地执行真实 pre-release mock import 验证。
- mock 数据不能进入生产；mock data cannot enter production。
- production init must not call mock import。

## Fixture files

| Fixture | 用途 |
| --- | --- |
| `test-data/mock/car-rental/drivers.mock.json` | mock drivers。 |
| `test-data/mock/car-rental/vehicles.mock.json` | mock vehicles。 |
| `test-data/mock/car-rental/lease-contracts.mock.json` | 长租合同、时限合同。 |
| `test-data/mock/car-rental/rent-daily-ledgers.mock.json` | 自然周租金台账、免租日、未付原因、欠款。 |
| `test-data/mock/car-rental/rent-payments.mock.json` | mock rent payments，只有 placeholder screenshot reference。 |
| `test-data/mock/car-rental/rent-payment-allocations.mock.json` | 付款按日分配、单日不可超付。 |
| `test-data/mock/car-rental/deposit-records.mock.json` | 押金收取、抵扣、退还，押金不计入租金收入。 |
| `test-data/mock/car-rental/operation-logs.mock.json` | operation logs。 |
| `test-data/mock/car-rental/contract-documents.mock.json` | 合同文档 placeholder metadata。 |
| `test-data/mock/car-rental/gps-status.mock.json` | GPS mock status 和 mock IOPGPS sync id，无真实凭据。 |
| `test-data/mock/car-rental/mock-manifest.json` | fixture manifest 和业务覆盖清单。 |

## Fixture summary

- required_file_count: 11
- existing_file_count: 11
- total_records: 27
- 所有 fixture 均包含 `mock_data_only=true` 等价布尔值。
- 所有 fixture 均包含 `not_for_production=true` 等价布尔值。

## Business case coverage

| Business case | Coverage |
| --- | --- |
| long-term contract case | covered |
| time-bound contract case | covered |
| weekly rent ledger case | covered |
| free-rent day case | covered |
| payment allocation case | covered |
| no overpay per day case | covered |
| unpaid reason case | covered |
| arrears case | covered |
| deposit collect / offset / refund case | covered |
| deposit not counted as rent income case | covered |
| current arrears excludes future receivables case | covered |
| contract document placeholder case | covered |
| GPS mock status case | covered |
| operation logs case | covered |

## Privacy guard results

- no suspicious real phone: passed。
- no suspicious email: passed。
- no suspicious identity or passport: passed。
- no real address: passed。
- no real payment screenshot path: passed。
- no real contract scan path: passed。
- no real GPS / IOPGPS credential: passed。

## Production guard results

- workflow_mode=codex_only: passed。
- stage=mock_data_import: passed。
- execution_mode=codex_dry_run: passed。
- production_ready=false: passed。
- mock 数据不能进入生产: passed。
- production init must not call mock import: passed。

## Blockers

- None in current Codex-generated dry-run report。

## Warnings

- 当前不要求用户本地运行。
- 正式版前才本地执行真实 pre-release mock import 验证。
- 不连接数据库、不导入数据、不写 schema、不执行 migration。
- 不启用真实 IOPGPS。

## modification_items

- 当前 Codex-only fixture 覆盖已满足 dry-run smoke coverage。
- 后续仍需在 pre-release local execution 环境实现真实 isolated_test_database 导入验证。
- 后续 Business smoke test stage 需要消费这些 fixture 的业务规则覆盖结果。

## JSON report

```text
test-data/generated/car-rental-mock-data-import-dry-run.generated.json
```
