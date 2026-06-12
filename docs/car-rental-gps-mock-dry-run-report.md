# Car Rental GPS mock dry-run report

## Current stage

- stage: `gps_mock_test`
- workflow_mode: `codex_only`
- execution_mode: `codex_dry_run`
- production_ready=false
- pre-release local execution required: true
- 当前不要求用户本地运行；正式版前才本地执行真实 GPS / IOPGPS 验证。
- 本阶段不调用真实 IOPGPS，不连接数据库，不导入数据。
- GPS 不参与租金计算。
- mock 数据不能进入生产。

## Fixture files

- `test-data/mock/car-rental/gps-status.mock.json`

## Detected GPS entries

- gps device: existing（34 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。
- gps location: existing（90 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。
- gps mileage: existing（28 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。
- gps status: existing（47 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。
- iopgps: existing（55 files），示例：`packages/plugins/plugin-iopgps/README.md`。
- sync disabled guard: existing（5 files），示例：`packages/plugins/plugin-iopgps/src/server/actions/actionRegistry.ts`。
- vehicle binding: existing（53 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。

## Planned GPS entries

- real IOPGPS API credential configuration: planned — Only allowed in separate pre-release local verification with secrets outside Git.
- real IOPGPS status/location/mileage synchronization: planned — Codex-only stage must not call real provider APIs.
- scheduler/workflow registration for real sync: planned — Current schedule registry is a disabled draft; real registration is deferred.
- real GPS raw track retention policy review: planned — Raw provider tracks are sensitive and absent from fixtures.

## Missing GPS entries

- 当前 dry-run 未发现必须立即补齐的 GPS mock fixture 缺失项。

## GPS status coverage

- online: pass，records=MOCK-GPS-STATUS-001
- offline: pass，records=MOCK-GPS-STATUS-002
- fault: pass，records=MOCK-GPS-STATUS-003
- sync_failed: pass，records=MOCK-GPS-STATUS-004

## GPS mileage coverage

- present: true
- placeholder: true
- missing_mileage_case_present: true

## GPS location coverage

- present: true
- placeholder: true
- no_real_coordinates: true
- sync_failure_no_location_case_present: true

## Vehicle binding coverage

- present: true
- vehicle_ids: MOCK-VEHICLE-001, MOCK-VEHICLE-002, MOCK-VEHICLE-003, MOCK-VEHICLE-004
- device_ids: MOCK-GPS-DEVICE-001, MOCK-GPS-DEVICE-002

## Failure isolation results

- GPS not used for rent calculation: true
- GPS failure does not affect rent ledger: true
- GPS failure does not affect payment allocation: true
- GPS failure does not affect deposit: true
- GPS failure does not affect contract document: true

## Secret guard results

- no IOPGPS token: true
- no login_key: true
- no access_token: true
- no real raw track / raw response: true

## Production guard results

- mock_data_only: true
- not_for_production: true
- production_ready=false
- IOPGPS_SYNC_ENABLED=false
- mock_data_cannot_enter_production: true

## Blockers

- 无 Codex-only dry-run blocker；真实接入仍需正式版前单独验证。

## Warnings

- Codex-only GPS mock dry-run does not replace formal pre-release local verification.
- Real IOPGPS credentials and real GPS tracks must remain outside Git and outside reports.

## Modification items

- Keep GPS mock test as codex_dry_run until separate pre-release local verification is approved.
- Add backup/rollback rehearsal stage next.

## Conclusion

GPS mock test dry-run stage 已建立。当前仍 production_ready=false；真实 IOPGPS 同步、真实 GPS 轨迹和真实设备凭据只能在正式版前单独验证，不在 Codex-only 阶段执行。
