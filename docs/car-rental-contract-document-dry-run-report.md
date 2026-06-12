# Car Rental Contract Document Dry-run Report

## 当前阶段

- stage: `contract_document_test`
- workflow_mode: `codex_only`
- execution_mode: `codex_dry_run`
- production_ready=false
- pre-release local execution required: true
- 当前不要求用户本地运行。
- 正式版前才本地执行真实合同模板、打印、扫描件上传、权限和文件存储验证。
- 当前不使用真实合同扫描件，不生成真实合同文件，不上传文件。
- 当前不启用真实 IOPGPS。
- mock 数据不得进入生产，mock 数据不能进入生产。

## Fixture files

- `test-data/mock/car-rental/mock-manifest.json`
- `test-data/mock/car-rental/lease-contracts.mock.json`
- `test-data/mock/car-rental/contract-documents.mock.json`
- `test-data/mock/car-rental/deposit-records.mock.json`
- `test-data/mock/car-rental/rent-daily-ledgers.mock.json`
- `test-data/mock/car-rental/rent-payment-allocations.mock.json`
- `test-data/mock/car-rental/drivers.mock.json`
- `test-data/mock/car-rental/vehicles.mock.json`

## Detected document entries

| Entry | Status | Notes |
| --- | --- | --- |
| contract document collection draft | existing | `contract_documents` metadata and sensitive file references were detected. |
| contract template collection draft | existing | `contract_templates` language/version/template metadata was detected. |
| three-language template selection | existing | `zh-CN`, `en-US`, `fr-FR` are represented in source metadata. |
| print status service | existing | Print metadata can be recorded without real printing in this dry-run. |
| signed scan placeholder service | existing | `signed_scan_file` is modeled as a sensitive file reference. |
| lease contract driver and vehicle binding | existing | `driver_id` and `vehicle_id` are present in source/fixtures. |
| safe contract document placeholders | existing | Contract document fixtures use `placeholder://` references. |

## Planned document entries

| Entry | Status | Notes |
| --- | --- | --- |
| real DOCX/PDF renderer | planned | Deferred to pre-release local execution. |
| printable trilingual template content parity review | planned | Requires real template text and business/legal review. |
| real signed scan upload workflow | planned | Deferred because this stage forbids real scan files and upload. |

## Missing document entries

| Entry | Status | Notes |
| --- | --- | --- |
| real generated contract files | missing | Intentionally missing in Codex-only dry-run. |
| real signed scan files | missing | Intentionally missing; no real scan files may be committed. |
| real download verification | missing | Requires generated files and permission checks in pre-release local execution. |

## Language coverage

| Language | Status | Evidence |
| --- | --- | --- |
| Chinese contract version (`zh-CN`) | pass | Locale and template language metadata detected. |
| English contract version (`en-US`) | pass | Locale and template language metadata detected. |
| French contract version (`fr-FR`) | pass | Locale and template language metadata detected. |
| language field consistency | warning | Metadata is aligned, but real legal content parity remains pending_verification. |

## Contract field coverage

| Field | Status | Notes |
| --- | --- | --- |
| contract | pass | Contract metadata exists in document and lease fixtures. |
| driver | pass | Contract driver binding exists through `driver_id`. |
| vehicle | pass | Contract vehicle binding exists through `vehicle_id`. |
| deposit | pass | Deposit fields and deposit records exist. |
| rent | pass | Daily rent and ledger fixtures exist. |
| free_rent_day | pass | Default free-rent day fixtures exist. |
| offline_signing | pass | Signed scan placeholder and offline signing metadata exist. |

## Placeholder guard results

- checked: true
- passed: true
- document metadata placeholder: pass
- signed scan placeholder: pass
- no real scan files: pass

## Privacy guard results

- checked: true
- passed: true
- no real driver private data: pass
- no real payment screenshots: pass
- no real token/password/secret output: pass
- no DB_PASSWORD / APP_KEY / IOPGPS_LOGIN_KEY output: pass

## Production guard results

- production_ready=false
- mock_data_allowed_in_production=false
- no database connection: pass
- no database import: pass
- no real contract file generation: pass
- no file upload: pass
- no real IOPGPS: pass

## Blockers

- None in the generated dry-run report.

## Warnings

- Real trilingual legal template content, printable layout, signed scan upload, download permission and audit logs remain pre-release local execution work.

## Modification items

- Maintain the detailed checklist in `docs/car-rental-contract-document-modification-items.md`.
- Keep Contract document test real execution as `local_pre_release`.
- Continue to keep `production_ready=false` until all later stages and real pre-release validation are complete.

## Generated JSON report

The JSON dry-run report is generated at:

```text
test-data/generated/car-rental-contract-document-dry-run.generated.json
```
