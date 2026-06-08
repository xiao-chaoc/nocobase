# plugin-iopgps

IOPGPS 插件骨架，负责 IOPGPS 配置、令牌、车辆位置、每日里程、GPS 设备状态和 GPS 错误日志。

当前目录只包含骨架，不包含真实 API 密钥，不调用真实 IOPGPS API，不影响租金台账和付款逻辑。

## 后续入口

- 服务入口：`src/server/index.ts`
- 服务骨架：`src/server/services/`
- Collection 草案：`src/server/collections/`
- 多语言：`src/locale/`

## 业务边界

- 配置从 `iopgps_settings` 或环境变量读取。
- `login_key_encrypted` 与 `access_token` 必须是敏感字段。
- GPS 数据只用于运营监控，不参与租金计算。
- IOPGPS 同步失败不能影响租金台账和付款逻辑。

## NocoBase 接入说明

当前 `package.json`、server 入口和 Collection 草案仍需在真实 NocoBase 工程中按目标版本校验。该插件依赖 rental-core 的车辆数据；同步失败只能写错误日志，不能影响租金台账和付款逻辑。

## 注册草案

`src/server/pluginRegistration.ts`、`actions/`、`schedules/` 仅描述后续接入项，不调用真实 IOPGPS 或 NocoBase API，也不表示数据库已经创建。
