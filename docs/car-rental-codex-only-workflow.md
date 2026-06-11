# Car Rental Codex-only 开发与测试工作流

## 当前策略

- local NAS paused：用户已删除本地 NAS 测试目录。
- Docker containers deleted by user：用户已删除本地 Docker 测试容器。
- current local test not required：用户当前不再运行本地测试，不再被要求现在启动 Docker、PostgreSQL 测试库或 run-full 脚本。
- Codex 在 GitHub 仓库中继续生成、修改、维护测试脚本、dry-run 报告、mock 数据、报告模板和修改项清单。
- 用户只负责审查 Codex PR、合并 PR，并在必要时提供业务规则确认。
- pre-release local execution：正式版前才重新 clone 到本地/NAS，并在新目录、新 `.env`、新 PostgreSQL volume、新 storage 中恢复真实本地执行。

## Codex 后续负责

- 维护测试脚本。
- 维护 dry-run 报告。
- 维护 mock 数据。
- 维护修改项清单。
- 维护 pre-release 总测试路线图。
- 生成生产初始化计划。
- 生成生产防 mock 门禁。
- 生成隐私数据导入前检查清单。
- 生成正式部署 runbook。
- 继续在 GitHub 仓库中维护所有测试文件、脚本、报告、修改项、mock 数据和 dry-run 结果。

## 用户后续负责

- 审查 Codex PR。
- 合并 PR。
- 确认业务规则。
- 正式版前重新 clone `xiao-chaoc/nocobase`。
- 使用新目录、新 `.env`、新 PostgreSQL volume、新 storage 配置生产前环境。
- 配置生产 `.env`。
- 提供真实隐私数据前确认。
- 执行最终上线前人工检查。

## 当前不再要求

- 不要求用户现在启动 Docker。
- 不要求用户现在运行 PostgreSQL 测试库。
- 不要求用户现在运行 run-full 脚本。
- 不要求用户现在生成 backup dump。
- 不要求用户现在生成 filled request。
- run-full retained for future pre-release execution：`scripts/car-rental/run-full-isolated-system-test.sh` 保留为未来正式版前本地/NAS 执行入口，但当前 Codex-only 阶段只维护脚本和报告模板。

## 当前仍禁止

- production_ready=false，当前不允许标记 `production_ready`。
- 不允许真实 IOPGPS。
- 不允许真实司机资料。
- 不允许真实付款截图。
- 不允许真实合同扫描件。
- mock data cannot enter production，mock 数据不能进入生产。
- 不允许把测试 dump、filled request、`.env.car-rental-collection-test`、SQL 文件或生产密钥提交到 Git。
