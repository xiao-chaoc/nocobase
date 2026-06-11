# Car Rental 测试初始化与生产初始化隔离策略

## 基本隔离规则

1. 测试初始化脚本和生产初始化脚本必须分开。
2. 测试脚本可以导入 mock 数据。
3. 生产脚本不得导入 mock 数据。
4. 生产脚本不得读取 `test-data/generated/*.filled.json`。
5. 生产脚本不得读取 `backups-test`。
6. 生产脚本不得使用 `DB_DATABASE` 包含 `test` / `mock` / `demo` 的数据库。
7. 生产脚本默认 `IOPGPS_SYNC_ENABLED=false`。
8. 正式生产部署应重新 clone 项目。
9. 正式生产应使用新目录、新 `.env`、新 PostgreSQL volume、新 storage。
10. 删除测试容器、测试目录、测试源码可最小化测试影响。

## 测试数据不会自动进入生产

从 GitHub 拉取源码不会自动带 PostgreSQL 测试数据。Git 只拉取源码和已提交文件，不会自动携带 NAS 本地 PostgreSQL volume、storage、dump、`.env` 或 ignored 测试产物。

只有复用测试 volume / storage / dump / env 才会带入测试数据。例如：

- 把测试 PostgreSQL volume 挂到生产。
- 把测试 storage 目录作为生产 storage。
- 把测试 dump 恢复到生产库。
- 把测试 `.env` 复制成生产 `.env`。

因此生产前推荐删除测试容器、测试目录和测试源码，并在生产新目录重新 clone，然后配置新的生产 `.env`、生产 PostgreSQL volume 和生产 storage。
