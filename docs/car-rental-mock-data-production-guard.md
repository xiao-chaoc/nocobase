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
