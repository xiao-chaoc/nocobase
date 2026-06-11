# Car Rental 项目当前进度总结

本文汇总正式版前的 car-rental 集成进度，作为后续一键隔离总测试和修改项补充的基线。

## 已完成内容

- NocoBase v2.0.61 目标版本已确认。
- 当前宿主工程包管理器基准为 yarn。
- car-rental 工作已接入完整 NocoBase 宿主工程，而不是单独插件骨架仓库。
- 三个插件已复制到宿主工程：
  - `packages/plugins/plugin-rental-core/`
  - `packages/plugins/plugin-contract-documents/`
  - `packages/plugins/plugin-iopgps/`
- shared automation 已复制到宿主工程：`packages/shared/nocobase-automation/`。
- real host environment detector 已完成，用于检测真实宿主工程环境。
- Collection adapter plan 已建立。
- Collection execute preflight 已建立。
- execute request 机制已建立，用于将真实执行参数显式化、可审计化。
- PostgreSQL 隔离测试库模板已建立：`docker-compose.car-rental-collection-test.yml`。
- backup / restore 脚本已建立：
  - `scripts/car-rental/backup-collection-test-db.sh`
  - `scripts/car-rental/restore-collection-test-db.sh`
- run-isolated collection test runner 已建立：`scripts/car-rental/run-isolated-collection-registration-test.sh`。

## 未完成内容

- Collection 真实 execute 尚未完成最终验证。
- Runtime 注册尚未真实执行。
- 权限初始化尚未真实执行。
- 页面 / 菜单初始化尚未真实执行。
- mock 数据导入尚未真实执行。
- 合同文件模块尚未真实测试。
- GPS mock 测试尚未真实执行。
- 完整 smoke test 尚未执行。
- UAT 尚未执行。
- 生产初始化脚本尚未完成。

## 当前 Docker 状态说明

`docker-compose.car-rental-collection-test.yml` 只启动 PostgreSQL 隔离测试库。当前 Docker 中只有 PostgreSQL 容器是正常现象。

该 compose 文件不是完整 NocoBase 应用部署，不会启动 NocoBase Web 应用、NocoBase server、IOPGPS 或业务服务。完整 NocoBase Web 应用部署需要后续单独的 compose 方案或源码运行方案，并且应与生产初始化阶段分开设计。

## 当前不能 production_ready 的原因

当前仍不能标记 `production_ready`，原因包括：

- Collection execute 尚未完成最终验证。
- Runtime / 服务 / 动作注册尚未执行。
- 权限、敏感字段、页面、菜单、区块、mock 数据导入均未完成隔离验证。
- 合同文件、GPS mock、核心业务 smoke test、备份 / 回滚演练和 UAT 均未完成。
- 生产初始化脚本尚未与测试初始化脚本完全分离。
- 当前不允许启用真实 IOPGPS，不允许使用真实司机证件、真实付款截图、真实合同扫描件。

## Codex-only 工作流更新（2026-06-11）

- 已确认本任务运行在完整 NocoBase v2.0.61 宿主工程中，目标仓库为 `xiao-chaoc/nocobase`，不是 car-rental 插件骨架仓库。
- local NAS paused：本地 NAS 测试已暂停，用户已删除本地 NAS 测试目录。
- Docker containers deleted by user：用户已删除本地 Docker 测试容器。
- current local test not required：后续改为 Codex-only 工作流，当前不要求用户启动 Docker、运行 PostgreSQL 测试库、运行 run-full、生成 backup dump 或生成 filled request。
- Codex 继续在 GitHub 仓库中维护测试脚本、dry-run 报告、mock 报告、修改项清单和 pre-release 路线图。
- `scripts/car-rental/run-full-isolated-system-test.sh` 继续保留，但现在仅作为未来 pre-release local execution 阶段的本地/NAS 总入口；当前 Codex-only 阶段不要求用户运行。
- 所有未完成阶段改由 Codex 继续生成脚本、报告和 modification_items，包括 Runtime、权限、页面、mock 数据、smoke test、合同文件、GPS mock、备份回滚、生产初始化脚本草案和生产防 mock 门禁。
- 正式版前才恢复本地/NAS 执行，并且必须重新 clone、使用新目录、新 `.env`、新 PostgreSQL volume、新 storage。
- 当前仍保持 production_ready=false；mock data cannot enter production。
