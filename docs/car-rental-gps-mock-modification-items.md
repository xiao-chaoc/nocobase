# Car Rental GPS mock modification items

当前阶段：GPS mock test stage 已建立 codex_dry_run / codex_mock_report。当前不要求用户本地运行；正式版前才本地执行真实 GPS / IOPGPS 验证。production_ready=false，mock 数据不能进入生产，不启用真实 IOPGPS。

| 编号 | GPS mock 规则项 | 状态 | 业务规则 | 涉及 fixture | 涉及插件 | 是否阻塞 UAT | 是否阻塞生产 | Codex 修改建议 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GPS-001 | GPS mock device | pass | GPS mock device 存在 | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是，真实验证前阻塞生产 | 保留 `MOCK-GPS-DEVICE-001/002` | 至少两个 mock device 覆盖正常和异常场景 | 已建立 |
| GPS-002 | GPS vehicle binding | pass | GPS 绑定车辆，不绑定司机隐私数据 | `gps-status.mock.json`, `vehicles.mock.json` | `plugin-iopgps`, `plugin-rental-core` | 否 | 是，真实验证前阻塞生产 | 所有记录使用 `MOCK-VEHICLE-*` | 每条 GPS mock 记录都有 mock vehicle_id | 已建立 |
| GPS-003 | GPS online status | pass | GPS mock status 覆盖正常在线 | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是，真实验证前阻塞生产 | 保留 `online` fixture | dry-run 识别 online | 已建立 |
| GPS-004 | GPS offline status | pass | GPS mock 离线状态存在 | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是，真实验证前阻塞生产 | 保留 `offline` fixture | dry-run 识别 offline | 已建立 |
| GPS-005 | GPS fault status | pass | GPS mock 设备异常状态存在 | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是，真实验证前阻塞生产 | 保留 `fault` fixture | dry-run 识别 fault | 已建立 |
| GPS-006 | GPS sync failed status | pass | GPS mock 同步失败状态存在 | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是，真实验证前阻塞生产 | 保留 `sync_failed` fixture | dry-run 识别 sync_failed | 已建立 |
| GPS-007 | GPS mileage placeholder | pass | GPS mock mileage 存在但不代表真实里程 | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是，真实验证前阻塞生产 | 使用 placeholder 和 missing mileage case | 覆盖 mileage value 与缺失场景 | 已建立 |
| GPS-008 | GPS location placeholder | pass | GPS mock location 存在但不是真实坐标 | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是，真实验证前阻塞生产 | 使用明显 mock 坐标 / null location | 坐标标注 `not_real_coordinates` | 已建立 |
| GPS-009 | GPS no real raw track | pass | 不包含真实 GPS 原始轨迹 | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是 | 不提交 raw provider response | `raw_response_included=false` 且无真实轨迹 | 已建立 |
| GPS-010 | GPS not used for rent calculation | pass | GPS 不参与租金计算 | `gps-status.mock.json` | `plugin-rental-core` | 否 | 是 | 租金计算服务不读取 GPS | dry-run 未发现 GPS 参与租金计算 | 已建立 |
| GPS-011 | GPS failure does not affect rent ledger | pass | GPS 失败不影响租金台账 | `gps-status.mock.json` | `plugin-rental-core`, `plugin-iopgps` | 否 | 是 | GPS 失败只记录状态/错误 | failure isolation 通过 | 已建立 |
| GPS-012 | GPS failure does not affect payment allocation | pass | GPS 失败不影响付款分配 | `gps-status.mock.json` | `plugin-rental-core`, `plugin-iopgps` | 否 | 是 | 付款分配不得依赖 GPS | failure isolation 通过 | 已建立 |
| GPS-013 | GPS failure does not affect deposit | pass | GPS 失败不影响押金 | `gps-status.mock.json` | `plugin-rental-core`, `plugin-iopgps` | 否 | 是 | 押金服务不得依赖 GPS | failure isolation 通过 | 已建立 |
| GPS-014 | GPS failure does not affect contract document | pass | GPS 失败不影响合同文档 | `gps-status.mock.json` | `plugin-contract-documents`, `plugin-iopgps` | 否 | 是 | 合同文件生成不得依赖 GPS | failure isolation 通过 | 已建立 |
| GPS-015 | IOPGPS_SYNC_ENABLED=false | pass | 真实同步默认禁用 | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是 | 保持 Codex-only dry-run 禁用真实同步 | report 中真实同步为 false | 已建立 |
| GPS-016 | no IOPGPS token | pass | 不包含真实 IOPGPS token | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是 | 凭据只放本地 pre-release env | fixture/report 无真实 token 值 | 已建立 |
| GPS-017 | no login_key | pass | 不包含真实 login_key | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是 | 不提交 provider login key | fixture/report 无真实 login_key 值 | 已建立 |
| GPS-018 | no access_token | pass | 不包含真实 access_token | `gps-status.mock.json` | `plugin-iopgps` | 否 | 是 | 不提交 provider access token | fixture/report 无真实 access_token 值 | 已建立 |
| GPS-019 | production guard | pass | production_ready=false，mock 数据不能进入生产 | `gps-status.mock.json` | `plugin-iopgps`, `plugin-rental-core` | 否 | 是 | 保持 not_for_production=true | report 和文档均说明 production_ready=false | 已建立 |

## 下一步

- Backup/rollback rehearsal stage.
- Production init guard stage.
