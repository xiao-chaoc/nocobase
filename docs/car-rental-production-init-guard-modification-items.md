# Car Rental Production Init Guard Modification Items

当前不要求用户本地运行；正式版前才本地执行。production_ready=false。

| 编号 | 生产门禁项 | 状态 pass / warning / blocker / missing / pending_verification | 规则 | 涉及文件 | 是否阻塞 UAT | 是否阻塞生产 | Codex 修改建议 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PIG-001 | production env example exists | pass | 必须存在 example 文件 | `.env.car-rental-production.example` | 否 | 是 | 保持模板无真实 secret | 文件存在 | 已完成 |
| PIG-002 | production DB name does not contain test/mock/demo/sample | pass | DB_DATABASE 不得包含测试标识 | `.env.car-rental-production.example` | 否 | 是 | 使用 prod 命名 | 名称安全 | 已完成 |
| PIG-003 | CAR_RENTAL_MOCK_DATA_ONLY=false | pass | 生产禁止 mock only | `.env.car-rental-production.example` | 否 | 是 | 保持 false | false | 已完成 |
| PIG-004 | CAR_RENTAL_IMPORT_MOCK_DATA=false | pass | 生产禁止 mock import | `.env.car-rental-production.example` | 否 | 是 | 保持 false | false | 已完成 |
| PIG-005 | IOPGPS_SYNC_ENABLED=false | pass | 生产初始化默认不启用真实 IOPGPS | `.env.car-rental-production.example` | 否 | 是 | 单独启用真实 IOPGPS | false | 已完成 |
| PIG-006 | production init disabled by default | pass | 默认不初始化生产 | `.env.car-rental-production.example` | 否 | 是 | 人工确认后启用 | false | 已完成 |
| PIG-007 | privacy data import disabled by default | pass | 隐私数据单独流程 | `.env.car-rental-production.example` | 是 | 是 | 建立隐私数据 guard | false | 已完成 |
| PIG-008 | no APP_KEY in example | pass | example 不含 APP_KEY | `.env.car-rental-production.example` | 否 | 是 | 不提交 APP_KEY | 无 APP_KEY | 已完成 |
| PIG-009 | no DB_PASSWORD real value in example | pass | example 只用占位值 | `.env.car-rental-production.example` | 否 | 是 | 不提交真实密码 | CHANGE_ME | 已完成 |
| PIG-010 | no IOPGPS_LOGIN_KEY in example | pass | example 不含 login key | `.env.car-rental-production.example` | 否 | 是 | 不提交 login key | 无 IOPGPS_LOGIN_KEY | 已完成 |
| PIG-011 | production does not read backups-test | pass | 生产不读取测试备份目录 | guard docs/scripts | 否 | 是 | 保持隔离 | 文档和脚本声明 | 已完成 |
| PIG-012 | production does not read filled request | pass | 生产不读取 filled request | guard docs/scripts | 否 | 是 | 保持隔离 | 文档和脚本声明 | 已完成 |
| PIG-013 | production does not import mock data | pass | 生产不导入 mock 数据 | guard docs/scripts | 否 | 是 | 保持 mock import false | 文档和脚本声明 | 已完成 |
| PIG-014 | production does not reuse test storage | pass | 生产必须新 storage | boundary docs | 否 | 是 | 新建 storage | 文档声明 | 已完成 |
| PIG-015 | production does not reuse test PostgreSQL volume | pass | 生产必须新 DB volume | boundary docs | 否 | 是 | 新建 volume | 文档声明 | 已完成 |
| PIG-016 | production uses new directory | pass | 正式生产新目录 | boundary docs | 否 | 是 | 新 clone | 文档声明 | 已完成 |
| PIG-017 | production uses new .env | pass | 不复用测试 env | boundary docs | 否 | 是 | 人工确认 env | 文档声明 | 已完成 |
| PIG-018 | production uses new storage | pass | 新 NocoBase storage | boundary docs | 否 | 是 | 新 storage | 文档声明 | 已完成 |
| PIG-019 | production uses new DB volume | pass | 新 PostgreSQL volume | boundary docs | 否 | 是 | 新 volume | 文档声明 | 已完成 |
| PIG-020 | production_ready remains false | pass | 当前不能标记 ready | all reports | 是 | 是 | 完成后续验证 | false | 已完成 |
| PIG-021 | UAT required before production_ready | pending_verification | UAT 通过前不得 ready | roadmap | 是 | 是 | 下一阶段补 UAT checklist | UAT 通过 | 待验证 |
| PIG-022 | backup rollback validation required before production_ready | pending_verification | 备份回滚需正式版前验证 | roadmap | 是 | 是 | 本地/NAS 执行 | 验证通过 | 待验证 |
| PIG-023 | permission validation required before production_ready | pending_verification | 权限验证需通过 | roadmap | 是 | 是 | UAT 前复核 | 验证通过 | 待验证 |
