# Car Rental 本地 NAS 测试暂停记录

## 暂停原因

- local NAS paused：用户已删除本地 NAS 测试目录。
- Docker containers deleted by user：用户已删除本地 Docker 容器。
- 用户不再进行本地中间测试。
- 项目仍处于设计和 Codex 自动化开发阶段，current local test not required。

## 当前本地状态

- 无本地测试目录。
- 无本地测试 PostgreSQL 容器。
- 无本地 backup dump。
- 无本地 filled request。
- 无本地 mock 数据导入。
- 无生产数据。

## 影响

- 无法在本地验证真实 Docker / PostgreSQL execute。
- Codex 只能维护脚本、文档、静态测试、dry-run、mock 报告和修改项清单。
- 真实本地/NAS 执行推迟到正式版前的 pre-release local execution 阶段。

## 恢复条件

- 正式版前。
- 需要配置生产 `.env`。
- 需要导入真实隐私数据。
- 需要执行最终上线前测试。
- 用户明确要求重新拉取。

## 恢复步骤摘要

- 重新 clone `xiao-chaoc/nocobase`。
- 使用新目录。
- 使用新 `.env`。
- 使用新 PostgreSQL volume。
- 使用新 storage。
- 不复用测试目录。
- 不复用旧 dump。
- 不复用 filled request。
- 不把 mock 数据导入生产，mock data cannot enter production。
- 恢复后仍需确认 `production_ready=false`，直到正式上线门禁全部通过。
