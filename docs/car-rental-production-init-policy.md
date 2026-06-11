# Car Rental 生产初始化防 mock 策略草案

本文是未来生产初始化脚本的策略草案。当前 NAS 隔离测试 runner 不得用于生产初始化，也不得标记 `production_ready`。

## 基本原则

1. 生产初始化脚本未来必须独立于测试脚本。
2. 生产脚本不得调用 import mock data。
3. 生产脚本不得读取 `test-data/generated/*.filled.json`。
4. 生产脚本不得读取 `backups-test`。
5. 生产脚本必须拒绝 `DB_DATABASE` 包含 `test` / `mock` / `demo`。
6. 生产脚本必须拒绝 `CAR_RENTAL_MOCK_DATA_ONLY=true`。
7. 生产脚本默认 `IOPGPS_SYNC_ENABLED=false`。
8. 生产脚本必须生成 production init report。
9. 生产脚本必须先检查空库或明确允许迁移。
10. 生产脚本仍不得 `production_ready`，直到 UAT 和备份回滚完成。

## 生产初始化报告建议

未来 production init report 至少应记录：

- 生产目录路径。
- 生产数据库名。
- 生产安全标签 `production_database`。
- mock 导入检查结果。
- IOPGPS 初始关闭状态。
- 空库检查或迁移授权结果。
- 备份文件引用。
- 回滚命令。
- UAT 状态。
- `production_ready=false`，直到 UAT 与备份回滚演练完成。
