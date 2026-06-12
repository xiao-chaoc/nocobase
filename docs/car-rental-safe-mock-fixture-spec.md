# Car Rental Safe Mock Fixture Spec

## 1. Fixture 命名规范

- 文件名使用 `<business-domain>.mock.json`。
- manifest 使用 `mock-manifest.json`。
- 所有 record `id` 必须使用 `MOCK-` 前缀。
- 所有业务 case 字段必须使用明显 mock 描述，便于 dry-run 和 smoke test 扫描。

## 2. Fixture 文件位置

所有 car-rental mock data 文件固定放在：

```text
test-data/mock/car-rental/
```

当前不要求用户本地运行；正式版前才本地执行真实导入验证。

## 3. Fixture 数据格式

- JSON UTF-8。
- 顶层必须包含 `mock_data_only=true` 等价布尔值。
- 顶层必须包含 `not_for_production=true` 等价布尔值。
- 顶层建议包含 `fixture_scope`。
- 明细数据放在 `records` 数组或 manifest 的 `fixture_files` / `business_case_coverage` 数组中。

## 4. 允许字段

- mock id、mock display name、mock plate number。
- mock contract type、mock date、mock amount。
- placeholder payment screenshot references。
- placeholder contract scan references。
- mock GPS status。
- mock IOPGPS sync record id，但不得包含真实 credential。
- operation log placeholder actor/action/target。

## 5. 禁止字段

- 真实司机姓名。
- 真实手机号、真实地址、真实身份证 / 驾照 / 护照号码。
- 真实付款截图路径。
- 真实合同扫描件路径。
- 真实银行卡或支付账号。
- 真实 GPS 原始轨迹。
- 真实 GPS / IOPGPS credentials。
- secret、token、password、生产 DB 连接内容。

## 6. 假数据标识规则

- 所有 mock data 文件必须包含 `mock_data_only=true`。
- 所有 mock data 文件必须包含 `not_for_production=true`。
- 所有 mock driver 必须使用明显假名，例如 `Mock Driver A` / `Mock Driver B`。
- 所有 mock phone 必须使用 `000` 或 `555` 样式。
- 所有 mock document numbers 必须使用 `MOCK-` 前缀。
- 所有 mock payment screenshot references 必须使用 `placeholder://`，不得指向真实文件。
- 所有 mock contract scan references 必须使用 `placeholder://`，不得指向真实文件。
- 所有 mock GPS / IOPGPS records 不得包含真实 credential。

## 7. 生产安全说明

- mock 数据不能进入生产；mock data cannot enter production。
- production init must not call mock import。
- fixture 可以提交到仓库，但只允许安全假数据。
- generated filled request / dump / SQL 不得提交。
