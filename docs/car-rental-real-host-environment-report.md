# car-rental 真实环境检测 Adapter 报告

## 1. 检测元信息

- 当前检测时间：2026-06-08T18:56:48.366Z（UTC，来自 `test-data/generated/real-host-environment-report.generated.json`）。
- 当前宿主工程路径：`/workspace/nocobase`。
- 检测范围：仅做文件系统与 package 元数据级别的只读环境检测；不读取 `.env` 真实密钥、不连接真实数据库、不调用真实 IOPGPS、不创建业务数据。
- 仓库扫描：已执行 `find . -maxdepth 6 -type f` 等效扫描，并排除了 `node_modules`、`.git`、`.test-dist`、`storage`、`storage-test`、`backups-test`、`logs-test`、`test-runtime`。
- 源码来源：从仓库根目录 `car-rental-nocobase-main.zip` 扫描确认后，解压到 `/tmp/car-rental-nocobase-extract`，仅复制三个 car-rental 插件与 `packages/shared/nocobase-automation`；未提交 ZIP 解压副本或 `/tmp` 内容。

## 2. 宿主工程与包管理器

- 当前 NocoBase 版本检测值：`2.0.61`。
- 期望 NocoBase 版本：`2.0.61`。
- 版本结论：匹配。
- 当前包管理器检测值：`yarn`。
- 期望包管理器：`yarn`。
- 包管理器结论：匹配。

## 3. car-rental 源码路径与复制结果

- ZIP 文件：`car-rental-nocobase-main.zip`。
- ZIP 内根目录：`car-rental-nocobase-main/`。
- 临时解压目录：`/tmp/car-rental-nocobase-extract/car-rental-nocobase-main`。
- ZIP 内已确认存在：
  - `car-rental-nocobase-main/packages/plugins/plugin-rental-core/`
  - `car-rental-nocobase-main/packages/plugins/plugin-contract-documents/`
  - `car-rental-nocobase-main/packages/plugins/plugin-iopgps/`
  - `car-rental-nocobase-main/packages/shared/nocobase-automation/`
- ZIP 禁止项扫描结论：未发现 `.env`、`.env.test`、`node_modules/`、`.git/`、`.test-dist/`、测试运行目录、付款截图目录、合同扫描目录、司机证件目录或 `*confirmed*.json` 等禁止项；`.env.example` 与 `.env.test.example` 仅存在于 ZIP 根目录，未复制到目标插件目录。
- 复制时已排除 `.env`、`.env.test`、`filled.json`、`node_modules`、`.git`、`.test-dist`、`storage-test`、`backups-test`、`logs-test`、`test-runtime`、`payment-screenshots`、`signed-contracts`、`driver-documents`、`driver-licenses`、`contract-scans`。

| 目标目录 | 检测结果 |
| --- | --- |
| `packages/plugins/plugin-rental-core` | 存在 |
| `packages/plugins/plugin-contract-documents` | 存在 |
| `packages/plugins/plugin-iopgps` | 存在 |
| `packages/shared/nocobase-automation` | 存在 |

## 4. 能力矩阵

| 能力 | 检测结果 |
| --- | --- |
| `is_nocobase_host` | 存在 |
| `target_version_v2_0_61` | 存在 |
| `package_manager_yarn` | 存在 |
| `database_target_postgresql` | 存在 |
| `app` | 存在 |
| `db` | 存在 |
| `logger` | 存在 |
| `storage` | 存在 |
| `plugin_manager` | 存在 |
| `acl` | 存在 |
| `ui_schema` | 存在 |
| `scheduler` | 存在 |
| `workflow` | 存在 |
| `i18n` | 存在 |
| `collection_manager` | 存在 |
| `file_storage` | 存在 |
| `template_printing` | 存在 |
| `car_rental_plugin_rental_core` | 存在 |
| `car_rental_plugin_contract_documents` | 存在 |
| `car_rental_plugin_iopgps` | 存在 |
| `shared_automation` | 存在 |

## 5. 是否缺少 NocoBase 基础能力

- 未检测到 app / db / collection manager / ACL / UI Schema / scheduler / workflow / storage / logger 等基础能力缺失。

## 6. 是否可以进入真实 Collection Adapter 实现

- 结论：可以进入真实 Collection Adapter 实现。
- 当前阻塞项：无。
- 安全状态：未读取 `.env`、未连接数据库、未调用 IOPGPS、未写业务数据。
- 当前阶段仍不得标记为 `production_ready`；本报告仅说明可进入下一阶段的真实 Collection Adapter 最小范围实现。

## 7. 下一步

- 下一步是实现真实 Collection Adapter 最小范围。
- 最小范围建议仅验证 NocoBase v2.0.61 中可确认的 collection 注册入口，并继续保持只读/受控策略：不真实创建业务数据、不执行 migration、不注册权限、不创建页面、不导入测试数据、不调用真实 IOPGPS。
- 在进入实现前，应基于宿主工程源码确认可用 API，不使用不确定 API 写成已验证。
