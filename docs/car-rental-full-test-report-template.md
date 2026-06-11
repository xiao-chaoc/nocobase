# Car Rental 正式版前完整测试报告模板

> 本模板用于正式版前集中测试总结。默认 `production_ready=false`，只有 UAT、备份回滚和生产初始化门禁全部完成后才允许重新评估。

## 1. 测试环境

- 测试目录：
- 执行人 / 执行方式：Codex 自动化 / 人工确认
- Docker / Compose 版本：
- Node / yarn / npm 版本：
- 是否隔离测试库：是 / 否

## 2. 版本

- NocoBase 目标版本：v2.0.61
- car-rental 插件版本：
- shared automation 版本：

## 3. 数据库

- 数据库类型：PostgreSQL
- 数据库名：
- 安全标签：`isolated_test_database`
- 是否复用生产库：否
- 是否使用测试 dump：

## 4. storage

- storage 路径：
- 是否复用生产 storage：否
- 是否包含真实司机资料 / 付款截图 / 合同扫描件：否

## 5. 插件版本

| 插件 | 路径 | 版本 | 状态 |
| --- | --- | --- | --- |
| rental-core | `packages/plugins/plugin-rental-core/` |  |  |
| contract-documents | `packages/plugins/plugin-contract-documents/` |  |  |
| iopgps | `packages/plugins/plugin-iopgps/` |  |  |

## 6. 每阶段执行结果

| 阶段 | 脚本 | 结果 | 报告 | 备注 |
| --- | --- | --- | --- | --- |
| Collection 注册 | `run-isolated-collection-registration-test.sh` |  |  |  |
| Runtime / 服务 / 动作 | `run-isolated-runtime-registration-test.sh` |  |  |  |
| 权限和敏感字段 | `run-isolated-permission-test.sh` |  |  |  |
| 页面 / 菜单 / 区块 | `run-isolated-page-initialization-test.sh` |  |  |  |
| mock 数据导入 | `run-isolated-mock-data-import-test.sh` |  |  |  |
| 核心业务 smoke test | `run-isolated-business-smoke-test.sh` |  |  |  |
| 合同文件 | `run-isolated-contract-document-test.sh` |  |  |  |
| GPS mock | `run-isolated-gps-mock-test.sh` |  |  |  |
| 备份 / 回滚 | `run-isolated-backup-rollback-test.sh` |  |  |  |

## 7. 失败项

| 编号 | 阶段 | 失败描述 | 日志 / 报告 | 是否阻塞 |
| --- | --- | --- | --- | --- |

## 8. 阻塞项

| 编号 | 阻塞项 | 影响 | 处理建议 |
| --- | --- | --- | --- |

## 9. 修改项

请同步维护 `docs/car-rental-modification-backlog-template.md`。

## 10. 风险项

- 生产初始化脚本尚未完成时，不得生产部署。
- mock 数据不得进入生产。
- 真实 IOPGPS 不得在测试阶段启用。

## 11. 回滚情况

- 备份文件：
- 回滚命令：
- 回滚演练结果：

## 12. 是否可以进入 UAT

- 当前结论：否 / 是
- 前置条件：

## 13. 是否可以生产部署

- 当前结论：否
- 原因：生产初始化、UAT、备份回滚和真实接口门禁未全部完成。

## 14. production_ready

```json
{
  "production_ready": false
}
```

## Codex-only / 本地 NAS 测试暂停补充（2026-06-11）

- local NAS paused：用户已删除本地 NAS 测试目录。
- Docker containers deleted by user：用户已删除本地 Docker 测试容器。
- current local test not required：当前 Codex-only 模式下不再要求用户执行本地 Docker、PostgreSQL、run-full、backup dump 或 filled request 步骤。
- Codex 继续在 GitHub 仓库中维护测试脚本、dry-run 报告、mock 报告、报告模板和 modification_items。
- run-full retained for future pre-release execution：`scripts/car-rental/run-full-isolated-system-test.sh` 保留为未来正式版前本地/NAS 执行入口，当前不要求用户运行。
- 这些脚本保留用于正式版前恢复本地/NAS 测试；真实执行移动到 pre-release local execution 阶段。
- 生产初始化仍必须与测试初始化分离。
- 正式生产部署前必须重新 clone、使用新目录、新 `.env`、新 PostgreSQL volume、新 storage。
- 生产前重新 clone 不会带测试数据库数据，前提是不复用测试 volume、storage、dump、filled request 或 env。
- production_ready=false；mock data cannot enter production。
