# car-rental 真实环境检测 Adapter 第一阶段报告

## 1. 检测元信息

- 当前检测时间：2026-06-07T02:18:20.783Z（UTC，来自 `test-data/generated/real-host-environment-report.generated.json`）。
- 当前宿主工程路径：`/workspace/nocobase`。
- 检测范围：仅做文件系统与 package 元数据级别的只读环境检测；不读取 `.env` 真实密钥、不连接真实数据库、不调用真实 IOPGPS、不创建业务数据。
- 仓库扫描：已执行 `find . -maxdepth 6 -type f` 等效扫描，并排除了 `node_modules`、`.git`、`.test-dist`、`storage`、`storage-test`、`backups-test`、`logs-test`、`test-runtime`。

## 2. 关键文件与目录扫描结果

| 项目 | 结果 | 证据 / 说明 |
| --- | --- | --- |
| `package.json` | 存在 | 根目录 `package.json` |
| lock 文件 | `yarn.lock` 存在，`pnpm-lock.yaml` 不存在 | 当前仓库声明 package manager 为 yarn |
| `packages/` | 存在 | 根目录 `packages/` |
| `storage/` | 存在 | 根目录 `storage/` |
| 插件目录结构 | 存在 | `packages/plugins/@nocobase/*` |
| 服务端插件入口示例 | 存在 | `packages/plugins/@nocobase/plugin-workflow/src/server/index.ts` 等 |
| 客户端插件入口示例 | 存在 | 多个插件含 `client.js` / `src/client` 入口 |
| Collection 定义示例 | 存在 | `packages/plugins/@nocobase/plugin-workflow/src/common/collections/workflows.ts` 等 |
| ACL / 权限源码或插件 | 存在 | `packages/core/acl/src/acl.ts`、`packages/plugins/@nocobase/plugin-acl` |
| UI Schema / 页面配置源码或插件 | 存在 | `packages/plugins/@nocobase/plugin-ui-schema-storage`、`packages/core/client`、`packages/core/client-v2` |
| i18n 相关源码或插件 | 存在 | `packages/plugins/@nocobase/plugin-localization`、`examples/app/i18n.ts` |
| scheduler / workflow 相关源码或插件 | 存在 | `packages/plugins/@nocobase/plugin-workflow`、`packages/plugins/@nocobase/plugin-workflow-delay` |
| file storage 相关源码或插件 | 存在 | `packages/plugins/@nocobase/plugin-file-manager` |
| template print / 文件生成能力 | 存在 | `packages/plugins/@nocobase/plugin-action-print`、`packages/plugins/@nocobase/plugin-block-template` |

## 3. 项目文档读取情况

以下 car-rental-nocobase 文档尚未复制到当前宿主工程，未伪造其内容：

- `docs/nocobase-v2.0.61-host-integration-task.md`：缺失。
- `docs/task-real-environment-adapter-v2.0.61.md`：缺失。
- `docs/nocobase-v2.0.61-plugin-copy-plan.md`：缺失。
- `docs/real-nocobase-host-requirements.md`：缺失。
- `docs/nocobase-source-api-verification-plan.md`：缺失。
- `docs/nocobase-real-adapter-plan.md`：缺失。

## 4. 当前 NocoBase 版本判断

- 检测值：`2.0.61`。
- 期望值：`2.0.61`。
- 结论：版本匹配，可以确认当前源码内容具备 NocoBase v2.0.61 的基础版本特征。

## 5. 当前包管理器判断

- 检测值：`yarn`。
- 期望值：`pnpm`。
- 结论：不匹配。当前宿主工程根目录存在 `yarn.lock`，未发现 `pnpm-lock.yaml`，根 `package.json` 的 `packageManager` 声明为 yarn。

## 6. 能力矩阵

| 能力 | 检测结果 |
| --- | --- |
| 完整 NocoBase 宿主工程 | 存在 |
| 目标版本 v2.0.61 | 存在 |
| 包管理器 pnpm | 缺失（当前为 yarn） |
| 数据库目标 PostgreSQL | 存在 |
| App 能力 | 存在 |
| DB / Database 能力 | 存在 |
| Logger 能力 | 存在 |
| Storage 能力 | 存在 |
| Plugin Manager 能力 | 存在 |
| ACL / 权限能力 | 存在 |
| UI Schema / 页面配置能力 | 存在 |
| Scheduler 能力 | 存在 |
| Workflow 能力 | 存在 |
| i18n 能力 | 存在 |
| Collection Manager / Repository 能力 | 存在 |
| File Storage 能力 | 存在 |
| Template Print / 文件生成能力 | 存在 |
| `packages/plugins/plugin-rental-core` | 缺失 |
| `packages/plugins/plugin-contract-documents` | 缺失 |
| `packages/plugins/plugin-iopgps` | 缺失 |
| `packages/shared/nocobase-automation` | 缺失 |

## 7. 缺失能力与缺失接入物

当前 NocoBase 基础能力中未发现阻塞真实 Collection Adapter 的 DB / Collection Manager 缺口；但存在以下接入阻塞或前置缺失：

1. 包管理器期望为 pnpm，但当前宿主工程检测为 yarn。
2. car-rental 三个插件尚未复制到宿主工程：
   - `packages/plugins/plugin-rental-core`
   - `packages/plugins/plugin-contract-documents`
   - `packages/plugins/plugin-iopgps`
3. shared automation 尚未复制到宿主工程：
   - `packages/shared/nocobase-automation`
4. car-rental-nocobase 相关集成文档尚未复制到 `docs/`。

## 8. 是否可以开始真实 Collection Adapter

结论：暂不能开始真实 Collection Adapter 实现。

原因：虽然当前目录可确认为完整 NocoBase v2.0.61 宿主工程，且 DB / Collection Manager 能力已存在，但 car-rental 插件和 shared automation 尚未复制，且包管理器检测结果与任务期望 pnpm 不一致。本轮仅完成真实环境检测 Adapter 的第一阶段接入验证，不进行真实业务注册。

## 9. 阻塞项

- 包管理器不是 pnpm，当前检测为 yarn。
- car-rental 三个插件尚未完整复制到宿主工程。
- shared automation 尚未复制到宿主工程。

## 10. 下一步建议

1. 确认当前 NocoBase v2.0.61 宿主工程是否应继续使用 yarn，或是否需要提供 pnpm 版宿主工程 / lock 文件。
2. 从 car-rental-nocobase 复制 `packages/shared/nocobase-automation` 到宿主工程对应路径。
3. 从 car-rental-nocobase 复制以下插件目录到宿主工程：
   - `packages/plugins/plugin-rental-core`
   - `packages/plugins/plugin-contract-documents`
   - `packages/plugins/plugin-iopgps`
4. 复制并复核 car-rental-nocobase 集成文档。
5. 保持下一阶段仍使用安全策略：不使用生产库、不调用真实 IOPGPS、不写真实司机/合同/租赁业务数据。

## 11. 生成文件

- JSON 报告：`test-data/generated/real-host-environment-report.generated.json`。
- 检测模块：`scripts/car-rental/realHostEnvironmentDetector.ts`。
- 检测脚本：`scripts/car-rental/check-real-host-environment.ts`。
- 最小测试：`scripts/car-rental/__tests__/realHostEnvironmentDetector.test.ts`。
