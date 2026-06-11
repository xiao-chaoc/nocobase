# Car Rental 正式版前一键隔离总测试路线图

本文定义正式版前集中总结测试路线图。目标是不再让用户逐个手工执行细小门禁，而是由 Codex / 脚本组织隔离测试、汇总报告和修改项清单。

## 阶段 1：Collection 注册隔离测试

- 输入：`.env.car-rental-collection-test`、`docker-compose.car-rental-collection-test.yml`、Collection execute request、测试库备份。
- 自动脚本：`scripts/car-rental/run-isolated-collection-registration-test.sh`。
- 输出报告：`test-data/generated/isolated-collection-registration-test-report.generated.json`。
- 成功标准：隔离 PostgreSQL ready，备份成功，request 生成 / 校验 / dry-run / preflight 成功；execute 仅在显式门禁下通过。
- 失败处理：使用报告中的 rollback 命令恢复测试库。
- 是否允许 mock 数据：允许，仅限隔离测试库。
- 是否允许生产执行：不允许。

## 阶段 2：Runtime / 服务 / 动作注册隔离测试

- 输入：Runtime / service / action 注册计划、隔离测试库、Collection 测试报告。
- 自动脚本：`scripts/car-rental/run-isolated-runtime-registration-test.sh`。
- 输出报告：Runtime 注册隔离报告。
- 成功标准：服务、动作、runtime 元数据仅在隔离库内完成并可回滚。
- 失败处理：记录 blockers，回滚隔离库。
- 是否允许 mock 数据：允许。
- 是否允许生产执行：不允许。

## 阶段 3：权限和敏感字段隔离测试

- 输入：角色权限矩阵、敏感字段清单、隔离测试库。
- 自动脚本：`scripts/car-rental/run-isolated-permission-test.sh`。
- 输出报告：权限和敏感字段隔离报告。
- 成功标准：司机证件、付款凭证、合同文件等敏感字段满足最小可见范围。
- 失败处理：生成权限修改项。
- 是否允许 mock 数据：允许，但不得包含真实司机资料、真实付款截图或真实合同扫描件。
- 是否允许生产执行：不允许。

## 阶段 4：页面 / 菜单 / 区块初始化测试

- 输入：页面初始化计划、菜单计划、区块计划、隔离测试库。
- 自动脚本：`scripts/car-rental/run-isolated-page-initialization-test.sh`。
- 输出报告：页面初始化报告。
- 成功标准：核心页面、菜单入口、列表 / 表单 / 看板区块可初始化且不覆盖生产配置。
- 失败处理：生成页面 / 菜单修改项。
- 是否允许 mock 数据：允许。
- 是否允许生产执行：不允许。

## 阶段 5：mock 数据导入测试

- 输入：mock fixture、隔离测试库、mock 数据门禁。
- 自动脚本：`scripts/car-rental/run-isolated-mock-data-import-test.sh`。
- 输出报告：mock 导入报告。
- 成功标准：仅在 `isolated_test_database` 且 `CAR_RENTAL_MOCK_DATA_ONLY=true` 时导入。
- 失败处理：删除或回滚测试数据，生成 fixture 修改项。
- 是否允许 mock 数据：允许。
- 是否允许生产执行：不允许。

## 阶段 6：核心业务 smoke test

- 输入：已初始化的隔离测试库、mock 数据、业务 smoke test 用例。
- 自动脚本：`scripts/car-rental/run-isolated-business-smoke-test.sh`。
- 输出报告：核心业务 smoke test 报告。
- 成功标准：以下业务规则全部通过：
  - 合同创建。
  - 时限合同台账生成。
  - 长租合同台账生成。
  - 默认免租日。
  - 付款必须分配到日期。
  - 单日不可超付。
  - 未付原因。
  - 欠款 / 免除 / 争议。
  - 押金收取 / 抵扣 / 退还。
  - 押金不计入租金收入。
  - 当前欠款不包含未来应收。
- 失败处理：记录阻塞 UAT / 阻塞生产的问题并生成修改项。
- 是否允许 mock 数据：允许。
- 是否允许生产执行：不允许。

## 阶段 7：合同文件测试

- 输入：合同文件模块、测试合同文件 fixture、隔离 storage。
- 自动脚本：`scripts/car-rental/run-isolated-contract-document-test.sh`。
- 输出报告：合同文件测试报告。
- 成功标准：合同生成、上传、关联、权限、删除 / 回滚策略均通过；不得使用真实合同扫描件。
- 失败处理：清理测试文件并生成修改项。
- 是否允许 mock 数据：允许，仅允许 mock 文件。
- 是否允许生产执行：不允许。

## 阶段 8：GPS mock 测试

- 输入：plugin-iopgps、GPS mock fixture、隔离测试库。
- 自动脚本：`scripts/car-rental/run-isolated-gps-mock-test.sh`。
- 输出报告：GPS mock 测试报告。
- 成功标准：`IOPGPS_SYNC_ENABLED=false`，不调用真实 IOPGPS，仅验证 mock 数据映射和业务联动。
- 失败处理：生成 GPS 映射 / 同步策略修改项。
- 是否允许 mock 数据：允许。
- 是否允许生产执行：不允许。

## 阶段 9：备份 / 回滚演练

- 输入：隔离测试库、备份文件、回滚脚本。
- 自动脚本：`scripts/car-rental/run-isolated-backup-rollback-test.sh`。
- 输出报告：备份 / 回滚演练报告。
- 成功标准：备份可恢复、恢复后核心校验通过、报告记录回滚命令。
- 失败处理：阻塞 UAT 和生产，必须先修复。
- 是否允许 mock 数据：允许。
- 是否允许生产执行：不允许。

## 阶段 10：完整测试报告和修改项清单

- 输入：所有阶段报告。
- 自动脚本：`scripts/car-rental/run-full-isolated-system-test.sh`。
- 输出报告：
  - `test-data/generated/car-rental-full-isolated-system-test-report.generated.json`
  - `docs/car-rental-full-isolated-system-test-report.md`
- 成功标准：所有已实现阶段通过，未实现阶段明确 skipped，并进入 modification_items。
- 失败处理：集中生成 blockers、warnings、modification_items，交给 Codex 后续批量修复。
- 是否允许 mock 数据：允许，仅限测试。
- 是否允许生产执行：不允许。
