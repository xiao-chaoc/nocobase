# Car Rental 修改项清单模板

正式版前一键隔离总测试后，所有失败项、skipped 阶段、风险项和需要 Codex 补充实现的内容都应进入本清单。

| 编号 | 来源阶段 | 问题描述 | 严重程度 | 是否阻塞 UAT | 是否阻塞生产 | 建议修改方式 | 涉及文件 | 是否需要 Codex 修改 | 是否需要人工确认 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CR-001 | 示例 | 示例问题 | High / Medium / Low | 是 / 否 | 是 / 否 | 示例修改方式 | 示例文件 | 是 / 否 | 是 / 否 | 示例验收标准 | Open |

## 状态说明

- Open：待处理。
- In Progress：处理中。
- Fixed：已修改，待验证。
- Verified：已验证。
- Deferred：延期，但必须说明原因。

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
