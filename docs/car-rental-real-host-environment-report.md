# car-rental 真实环境检测 Adapter 报告

## 1. 检测元信息

- 当前检测时间：2026-06-07T16:11:30.113Z（UTC，来自 `test-data/generated/real-host-environment-report.generated.json`）。
- 当前宿主工程路径：`/workspace/nocobase`。
- 检测范围：仅做文件系统与 package 元数据级别的只读环境检测；不读取 `.env` 真实密钥、不连接真实数据库、不调用真实 IOPGPS、不创建业务数据。
- 仓库扫描：已执行 `find . -maxdepth 6 -type f` 等效扫描，并排除了 `node_modules`、`.git`、`.test-dist`、`storage`、`storage-test`、`backups-test`、`logs-test`、`test-runtime`。

## 2. 宿主工程与包管理器

- 当前 NocoBase 版本检测值：`2.0.61`。
- 期望 NocoBase 版本：`2.0.61`。
- 版本结论：匹配。
- 当前包管理器检测值：`yarn`。
- 期望包管理器：`yarn`。
- 包管理器结论：匹配。

## 3. car-rental 源码路径与复制结果

- 已搜索候选路径：`/workspace/car-rental-nocobase`、`../car-rental-nocobase`，并在 `/workspace` 及受限系统路径范围内搜索 `car-rental-nocobase`、`plugin-rental-core`、`nocobase-automation`。
- 结论：当前环境未发现 car-rental-nocobase 源码目录；因此未编造路径、未伪造插件源码、未执行目录复制。
- 已确认未复制 `.env`、`.env.test`、`filled.json`、`node_modules`、真实文件目录或测试运行目录。

| 目标目录 | 检测结果 |
| --- | --- |
| `packages/plugins/plugin-rental-core` | 缺失 |
| `packages/plugins/plugin-contract-documents` | 缺失 |
| `packages/plugins/plugin-iopgps` | 缺失 |
| `packages/shared/nocobase-automation` | 缺失 |

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
| `car_rental_plugin_rental_core` | 缺失 |
| `car_rental_plugin_contract_documents` | 缺失 |
| `car_rental_plugin_iopgps` | 缺失 |
| `shared_automation` | 缺失 |

## 5. 是否缺少 NocoBase 基础能力

- 未检测到 app / db / collection manager / acl / ui schema 等基础能力缺失。

## 6. 是否可以进入真实 Collection Adapter 实现

- 结论：暂不能进入真实 Collection Adapter 实现。
- 当前阻塞项：
  - 未检测到 packages/shared/nocobase-automation；需要先复制 shared automation。
  - 未检测到完整 car-rental 三个插件；需要先复制插件目录。
- 安全状态：未读取 `.env`、未连接数据库、未调用 IOPGPS、未写业务数据。
- 当前阶段不得标记为 `production_ready`。

## 7. 下一步

- 需要先提供或放置 car-rental-nocobase 源码目录，然后复制三个插件和 shared automation。
- 从 car-rental-nocobase 复制 packages/shared/nocobase-automation 到宿主工程对应路径。
- 复制 packages/plugins/plugin-rental-core。
- 复制 packages/plugins/plugin-contract-documents。
- 复制 packages/plugins/plugin-iopgps。
- 保持只读检测策略：不读取 .env 密钥、不连接真实数据库、不调用真实 IOPGPS、不写入业务数据。
