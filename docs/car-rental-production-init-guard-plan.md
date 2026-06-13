# Car Rental Production Init Guard Plan

## 1. 阶段目标

Production init guard stage 用于在正式版前建立生产初始化门禁、模板、dry-run 报告和修改项清单，确保生产初始化与隔离测试、mock 数据、测试 storage、测试 PostgreSQL volume、测试 dump、filled request 完全分离。

## 2. 当前 Codex-only 执行模式

- workflow_mode=codex_only。
- execution_mode=codex_dry_run。
- 当前不要求用户本地运行。
- 当前不要求用户配置生产 `.env`。
- 当前不要求用户启动生产容器。
- 当前只生成模板和门禁。
- 正式版前用户才重新 clone 到本地/NAS，并在新目录中人工确认生产配置。

## 3. 当前不真实初始化生产库的原因

当前用户已删除本地 NAS 测试目录和 Docker 容器；本轮禁止真实连接数据库、真实初始化生产库、创建生产容器、写 schema、执行 migration、导入数据或调用真实 IOPGPS。因此本阶段只做静态模板、文档、dry-run guard 和报告。

## 4. 生产初始化与测试初始化边界

生产初始化脚本必须独立于测试脚本。生产环境不得调用 mock import，不得读取 `test-data/generated/*.filled.json`、`backups-test`、`storage-test`，不得复用测试 dump、filled request、storage 或 PostgreSQL volume。

## 5. 生产环境允许项

- 使用新的生产部署目录。
- 使用新的人工确认后的 `.env.car-rental-production`。
- 使用新的 PostgreSQL volume。
- 使用新的 NocoBase storage。
- 使用 `CAR_RENTAL_DATABASE_SAFETY_LABEL=production_database` 或明确生产安全标签。
- 生产初始化前检查数据库为空，或明确记录迁移策略。
- 生成 production init report。

## 6. 生产环境禁止项

- 禁止 `DB_DATABASE` 包含 `test` / `mock` / `demo` / `sample`。
- 禁止 `CAR_RENTAL_MOCK_DATA_ONLY=true`。
- 禁止 `isolated_test_database` 标签。
- 禁止生产默认启用 `IOPGPS_SYNC_ENABLED`。
- 禁止导入 mock 数据。
- 禁止自动导入真实隐私数据。
- 禁止复用测试目录、测试 env、测试 dump、测试 storage、测试 PostgreSQL volume。

## 7. mock 数据生产门禁

生产不得导入 mock 数据；生产初始化不得调用 mock import；mock 数据只能留在 Codex-only fixture 或隔离测试库中。`CAR_RENTAL_IMPORT_MOCK_DATA=false` 和 `CAR_RENTAL_MOCK_DATA_ONLY=false` 是生产模板默认值。

## 8. 隐私数据导入边界

真实司机资料、真实付款截图、真实合同扫描件必须单独走隐私数据导入流程，且必须由用户人工确认。生产初始化不能自动导入真实隐私数据，`CAR_RENTAL_PRIVACY_DATA_IMPORT_ENABLED=false` 是默认值。

## 9. IOPGPS 启用边界

真实 IOPGPS 必须单独启用，不能在生产初始化默认开启。生产模板默认 `IOPGPS_SYNC_ENABLED=false`，当前不能使用真实 IOPGPS。

## 10. storage / PostgreSQL volume 隔离要求

生产必须使用新 NocoBase storage 和新 PostgreSQL volume。生产不得复用 `storage-test`、测试 PostgreSQL volume、测试 dump 或测试源码目录中的临时文件。

## 11. 生产初始化前检查清单

- 确认使用新目录。
- 确认使用新 `.env`。
- 确认使用新 PostgreSQL volume。
- 确认使用新 NocoBase storage。
- 确认 DB name 不包含 test/mock/demo/sample。
- 确认 production_database 安全标签。
- 确认 mock import 关闭。
- 确认 IOPGPS 关闭。
- 确认隐私数据导入关闭。
- 确认数据库为空或明确迁移策略。

## 12. 生产初始化后检查清单

- 生成 production init report。
- 核对未导入 mock 数据。
- 核对未复用测试 dump / filled request / storage / PostgreSQL volume / env。
- 核对真实隐私数据未自动导入。
- 核对真实 IOPGPS 未默认启用。
- 继续保持 production_ready=false，直到 UAT、权限验证、备份回滚验证、隐私数据流程验证都通过。

## 13. 当前 production_ready=false 的原因

当前仍未完成正式版前本地/NAS 真实执行、UAT、权限验证、备份回滚验证、隐私数据流程验证和真实生产配置人工确认，因此 production_ready=false。

## 14. 正式生产部署前必须补齐

- Pre-release final report aggregation。
- Pre-release UAT checklist。
- Production deployment runbook。
- Privacy data import guard。
- Real local/NAS pre-release execution。
- 用户人工确认生产配置。
- 用户人工确认生产隐私数据。
