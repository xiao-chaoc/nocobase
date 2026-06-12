# Car Rental GPS mock test plan

## 阶段目标

GPS mock test stage 用于在 Codex-only workflow 下验证 IOPGPS / GPS 相关源码入口和 safe mock fixtures 是否足以覆盖车辆定位、里程、设备状态、异常提示与失败隔离规则。当前不要求用户本地运行；正式版前才本地执行真实验证。

## 当前 Codex-only 执行模式

- workflow_mode: `codex_only`
- stage: `gps_mock_test`
- execution_mode: `codex_dry_run`
- production_ready=false
- local_execution_required_pre_release=true
- 当前只读取源码和 `test-data/mock/car-rental/gps-status.mock.json`，不连接数据库、不导入数据、不写 schema、不执行 migration。

## 当前不真实调用 IOPGPS 的原因

- 当前不能使用真实 IOPGPS，不能调用真实 IOPGPS API。
- IOPGPS 登录凭据、provider auth、真实轨迹与真实设备数据都不得进入 Git、报告或 mock fixtures。
- GPS 原始轨迹属于敏感数据；当前只允许明显 mock 坐标和 placeholder。
- 真实同步只允许正式版前单独验证，不在 Codex-only 阶段执行。

## 已发现 GPS / IOPGPS / device / status / mileage / location 入口

- gps device: existing（34 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。
- gps location: existing（90 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。
- gps mileage: existing（28 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。
- gps status: existing（47 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。
- iopgps: existing（55 files），示例：`packages/plugins/plugin-iopgps/README.md`。
- sync disabled guard: existing（5 files），示例：`packages/plugins/plugin-iopgps/src/server/actions/actionRegistry.ts`。
- vehicle binding: existing（53 files），示例：`packages/plugins/plugin-iopgps/src/locale/en-US.json`。

## 缺失 GPS mock 项

- 当前 dry-run 未发现必须立即补齐的 GPS mock fixture 缺失项。

## Planned GPS mock 项

- real IOPGPS API credential configuration: planned — Only allowed in separate pre-release local verification with secrets outside Git.
- real IOPGPS status/location/mileage synchronization: planned — Codex-only stage must not call real provider APIs.
- scheduler/workflow registration for real sync: planned — Current schedule registry is a disabled draft; real registration is deferred.
- real GPS raw track retention policy review: planned — Raw provider tracks are sensitive and absent from fixtures.

## Pending verification GPS mock 项

- real provider endpoint contract: pending_verification — Must be verified only in pre-release local environment without committing credentials.
- real database write path: pending_verification — This task intentionally avoids database connection, schema write, and migration.

## GPS mock 必须覆盖的业务规则

- GPS mock device 存在。
- GPS mock status 存在。
- GPS mock mileage 存在。
- GPS mock location 存在。
- GPS mock 离线状态存在。
- GPS mock 设备异常状态存在。
- GPS mock 同步失败状态存在。
- GPS 绑定车辆。
- GPS 不绑定司机隐私数据。
- GPS 不参与租金计算。
- GPS 失败不影响租金台账。
- GPS 失败不影响付款分配。
- GPS 失败不影响押金。
- GPS 失败不影响合同文档。
- IOPGPS_SYNC_ENABLED=false。
- 不包含真实 IOPGPS token。
- 不包含真实 login_key。
- 不包含真实 access_token。
- 不包含真实 GPS 原始轨迹。
- 真实同步只允许正式版前单独验证，不在 Codex-only 阶段执行。
- mock 数据不能进入生产。

## 禁止事项

- 不真实连接数据库。
- 不真实调用 IOPGPS。
- 不真实导入数据。
- 不写 schema。
- 不执行 migration。
- 不启用真实 IOPGPS。
- 不使用真实 GPS 轨迹。
- 不使用真实司机资料。
- 不使用真实付款截图。
- 不使用真实合同扫描件。
- 不标记 production_ready。
