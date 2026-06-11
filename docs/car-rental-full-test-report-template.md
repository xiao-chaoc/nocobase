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
