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
