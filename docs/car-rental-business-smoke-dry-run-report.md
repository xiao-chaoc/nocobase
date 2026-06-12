# Car Rental Business Smoke Dry-run Report

- generated_at: 2026-06-12T13:30:01.214Z
- current_stage: business_smoke_test
- workflow_mode: codex_only
- execution_mode: codex_dry_run
- production_ready: false
- pre_release local execution required: true
- 当前不要求用户本地运行；正式版前才本地执行真实业务 smoke 验证。
- mock 数据不得进入生产。

## Fixture files

- test-data/mock/car-rental/mock-manifest.json
- test-data/mock/car-rental/drivers.mock.json
- test-data/mock/car-rental/vehicles.mock.json
- test-data/mock/car-rental/lease-contracts.mock.json
- test-data/mock/car-rental/rent-daily-ledgers.mock.json
- test-data/mock/car-rental/rent-payments.mock.json
- test-data/mock/car-rental/rent-payment-allocations.mock.json
- test-data/mock/car-rental/deposit-records.mock.json
- test-data/mock/car-rental/operation-logs.mock.json
- test-data/mock/car-rental/contract-documents.mock.json
- test-data/mock/car-rental/gps-status.mock.json

## Business rule results

| ID | Rule item | Status | Details |
| --- | --- | --- | --- |
| BS-001 | driver no login | pass | 2 mock drivers exist without login fields. |
| BS-002 | vehicle plate required | pass | 2 vehicles have plate_number. |
| BS-003 | contract driver binding | pass | Every contract driver_id resolves to a mock driver. |
| BS-004 | contract vehicle binding | pass | Every contract vehicle_id resolves to a mock vehicle. |
| BS-005 | deposit required | pass | Every contract has at least one deposit record. |
| BS-006 | long-term contract | pass | Open-ended long-term mock contract exists. |
| BS-007 | time-bound contract | pass | Fixed-term mock contract exists. |
| BS-008 | natural month for time-bound contract | pass | Fixed-term contracts use calendar dates suitable for natural-month period checks; real month-cycle execution remains pre-release local verification. |
| BS-009 | natural week rent calculation | pass | Every ledger row includes natural_week in ISO week-like format. |
| BS-010 | selected free-rent days | pass | Every contract carries selected default_free_rent_days. |
| BS-011 | free-rent days reflected in daily ledger | pass | Selected free-rent dates are present in the daily ledger. |
| BS-012 | daily ledger by date | pass | Ledger rows are date-based and fixture contract/date pairs are unique in this smoke dataset. |
| BS-013 | payment allocation by date | pass | Every allocation resolves to one daily ledger date. |
| BS-014 | no overpay per day | pass | No daily paid_amount exceeds rent_amount and allocations assert no_overpay_per_day. |
| BS-015 | unpaid reason | pass | Unpaid or partial arrears ledger rows carry status and mock unpaid_reason when needed. |
| BS-016 | current arrears excludes future receivables | pass | Contracts explicitly mark current_arrears_excludes_future_receivables=true. |
| BS-017 | contract document placeholder | pass | All document references are placeholder:// and real_file_attached=false. |
| BS-018 | GPS mock status exists | pass | 2 GPS mock status records exist. |
| BS-019 | GPS not used for rent calculation | pass | Rent ledger rows contain no GPS or IOPGPS calculation references. |
| BS-020 | IOPGPS real sync disabled | pass | IOPGPS_REAL_SYNC_ENABLED=false for this dry-run. |
| BS-021 | operation logs | pass | 3 operation log records exist. |

## Financial rule results

| ID | Rule item | Status | Details |
| --- | --- | --- | --- |
| FR-001 | deposit collect exists | pass | At least one deposit collect event exists; per-contract deposit presence is covered by BS-005. |
| FR-002 | deposit offset exists | pass | Deposit offset event exists. |
| FR-003 | deposit refund exists | pass | Deposit refund event exists. |
| FR-004 | deposit not counted as rent income | pass | All deposit records have rent_income=false. |
| FR-005 | ledger contract binding | pass | Every ledger row resolves to a mock contract. |
| FR-006 | payment contract and driver binding | pass | Every payment resolves to a mock contract and driver. |

## Privacy guard results

| ID | Rule item | Status | Details |
| --- | --- | --- | --- |
| PG-001 | safe fixture flags | pass | All fixture files are marked mock_data_only=true and not_for_production=true. |
| PG-002 | privacy guard | pass | No real-looking phone number or national ID pattern detected. |
| PG-003 | secret guard | pass | No enabled credential, token, password, or login-key pattern detected. |

## Production guard results

| ID | Rule item | Status | Details |
| --- | --- | --- | --- |
| PR-001 | production_ready false | pass | production_ready=false is fixed in the dry-run report. |
| PR-002 | no database execution | pass | The dry-run reads JSON fixtures only and performs no database execution. |
| PR-003 | production guard | pass | mock data cannot enter production; production init must not call mock import |

## Blockers

- None in Codex fixture dry-run.

## Warnings

- None in Codex fixture dry-run.

## Modification items

- None from current safe mock fixture dry-run; real pre-release local execution remains required.

## Safety notes

- production_ready=false.
- pre-release local execution required.
- 当前不要求用户本地运行。
- mock 数据不得进入生产。
- 不启用真实 IOPGPS。
- 本 dry-run 不真实连接数据库、不真实导入数据、不写 schema、不执行 migration。
