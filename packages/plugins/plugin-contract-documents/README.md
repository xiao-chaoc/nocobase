# plugin-contract-documents

合同文件插件骨架，负责中文、英文、法文合同模板、合同文件生成、打印状态和线下签署扫描件上传状态管理。

当前目录只包含骨架，不生成真实合同文件，不创建真实扫描件，不实现前端页面。

## 后续入口

- 服务入口：`src/server/index.ts`
- 服务骨架：`src/server/services/`
- Collection 草案：`src/server/collections/`
- 多语言：`src/locale/`

## 业务边界

- 合同文件必须来源于具体合同和具体车牌。
- 合同文件生成不得重新计算租金。
- `signed_scan_file` 必须作为敏感字段进行权限控制。

## NocoBase 接入说明

当前 `package.json`、server 入口和 Collection 草案仍需在真实 NocoBase 工程中按目标版本校验。该插件依赖 rental-core 的合同、司机和车辆数据；合同文件失败不能影响租金台账和付款逻辑。

## 注册草案

`src/server/pluginRegistration.ts` 与 `actions/` 仅描述后续接入项，不调用真实 NocoBase API，不生成真实合同文件，也不表示数据库已经创建。
