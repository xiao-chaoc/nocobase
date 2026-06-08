# plugin-rental-core

租赁核心插件骨架，负责司机、车辆、合同、自然周账期、每日租金台账、付款、付款分配、押金、欠款、免除、权限过滤和操作日志。

当前目录只包含 TypeScript 类型、服务签名、Collection 草案、多语言 key 和 TODO 注释，不包含真实 NocoBase 注册、真实数据库读写、前端页面或完整业务逻辑。

## 后续入口

- 服务入口：`src/server/index.ts`
- 服务骨架：`src/server/services/`
- 类型定义：`src/server/types/`
- Collection 草案：`src/server/collections/`
- 多语言：`src/locale/`

## 必须保持的业务边界

- 司机不登录系统。
- 不做短租预订。
- 不按车型出租，每份合同必须绑定具体车牌。
- 每日租金台账是唯一事实来源。
- 付款必须分配到具体日期，单日不可超付。
- 普通运营不能查看全部敏感财务数据。

## NocoBase 接入说明

当前 `package.json`、server 入口和 Collection 草案仍需在真实 NocoBase 工程中按目标版本校验。接入时应先启用本核心插件，再启用合同文件插件和 IOPGPS 插件。

## 注册草案

`src/server/pluginRegistration.ts`、`actions/`、`schedules/`、`permissions/` 仅描述后续接入项，不调用真实 NocoBase API，也不表示数据库已经创建。
