# Car Rental Production Deployment Boundary

当前不是生产部署；当前只维护 Codex-only 模板、门禁和 dry-run 报告。当前不要求用户本地运行，不要求配置真实生产 env，不初始化生产库。

## 生产部署边界

1. 生产部署必须使用新目录。
2. 生产部署必须使用新 `.env`。
3. 生产部署必须使用新 PostgreSQL volume。
4. 生产部署必须使用新 storage。
5. 生产部署不得复用测试目录。
6. 生产部署不得复用测试 dump。
7. 生产部署不得复用 filled request。
8. 生产部署不得导入 mock 数据。
9. 生产部署不得默认启用 IOPGPS，`IOPGPS_SYNC_ENABLED=false`。
10. GitHub 重新 clone 不会自动携带 PostgreSQL 测试数据。
11. 测试数据进入生产的唯一风险是人为复用测试 volume / storage / dump / env / mock import。
12. 正式生产前删除测试容器、测试目录、测试源码可最小化测试影响。
13. 生产初始化前必须检查空库或明确迁移策略。
14. 生产初始化后仍不等于 production_ready。
15. production_ready=false，直到 UAT、权限验证、备份回滚验证、隐私数据流程验证都通过。

## 禁止复用项

生产不导入 mock 数据；生产不复用测试 dump；生产不复用 filled request；生产不复用测试 storage；生产不复用测试 PostgreSQL volume；生产不读取 backups-test 或 storage-test。
