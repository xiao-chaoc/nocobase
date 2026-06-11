# Car Rental mock 数据生产门禁

## 门禁规则

1. mock 数据只能用于 `isolated_test_database`。
2. mock 导入脚本必须拒绝 `production_database`。
3. mock 导入脚本必须要求 `CAR_RENTAL_MOCK_DATA_ONLY=true`。
4. 生产脚本必须要求 `CAR_RENTAL_MOCK_DATA_ONLY=false`。
5. 生产脚本不得调用 mock import。
6. 如果 `DB_DATABASE` 包含 `test` / `demo` / `mock`，则生产初始化拒绝。
7. 如果 `DB_DATABASE` 不包含 `prod` 或正式标识，则生产初始化要求人工确认。

## 真实资料禁止进入测试 fixture / Git

- 不允许真实司机资料进入测试 fixture。
- 不允许真实付款截图进入 Git。
- 不允许真实合同扫描件进入 Git。
- 不允许把真实 IOPGPS 响应、真实登录密钥或真实接口凭证写入测试文件。

## 生产初始化原则

生产初始化必须使用独立脚本、独立 `.env`、独立 PostgreSQL volume 和独立 storage。生产脚本不得导入 mock 数据，不得读取 filled request，不得读取 `backups-test`，不得标记 `production_ready`，直到 UAT 和备份回滚完成。

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
