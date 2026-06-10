# car-rental 真实 Collection execute request 操作人清单

## 1. 复制 template 为 filled.json

1. 运行模板生成脚本：
   `TS_NODE_SKIP_PROJECT=1 TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node","target":"ES2020","ignoreDeprecations":"6.0"}' npx ts-node --transpile-only scripts/car-rental/generate-real-collection-execute-request-template.ts`
2. 复制模板：
   `cp test-data/generated/real-collection-execute-request.template.json test-data/generated/real-collection-execute-request.filled.json`
3. 只编辑 `filled.json`，不要编辑模板。

## 2. 填写数据库安全字段

- `database_dialect` 必须保持 `postgresql`。
- `database_safety_label` 必须保持 `isolated_test_database`。
- `is_isolated_database` 必须是 `true`。
- `is_production_like_database` 必须是 `false`。
- 只允许隔离 PostgreSQL 测试库，不允许生产库或类生产库。

## 3. 填写 backup artifact reference

- `backup_plan_confirmed` 必须是 `true`。
- `backup_artifact_reference` 填写测试库备份文件路径、备份编号或备份工单引用。
- 不要填写数据库密码、连接串、token 或密钥。

## 4. 填写 rollback command reference

- `rollback_plan_confirmed` 必须是 `true`。
- `rollback_command_reference` 填写回滚文档、回滚命令引用或工单编号。
- 不要填写数据库密码、连接串、token 或密钥。

## 5. 确认 IOPGPS 禁用

- `iopgps_real_sync_allowed` 必须是 `false`。
- 不得调用真实 IOPGPS。
- 不得填写 `IOPGPS_LOGIN_KEY` 或任何 IOPGPS token。

## 6. 确认只使用 mock 数据

- `mock_data_only` 必须是 `true`。
- 不使用真实司机资料。
- 不使用真实付款截图。
- 不使用真实合同扫描件。

## 7. 运行 validate request

```bash
TS_NODE_SKIP_PROJECT=1 TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node","target":"ES2020","ignoreDeprecations":"6.0"}' npx ts-node --transpile-only scripts/car-rental/validate-real-collection-execute-request.ts --file test-data/generated/real-collection-execute-request.filled.json
```

## 8. 运行 apply request dry-run

```bash
TS_NODE_SKIP_PROJECT=1 TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node","target":"ES2020","ignoreDeprecations":"6.0"}' npx ts-node --transpile-only scripts/car-rental/apply-real-collection-execute-request.ts --file test-data/generated/real-collection-execute-request.filled.json
```

## 9. 运行 preflight with request

```bash
TS_NODE_SKIP_PROJECT=1 TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node","target":"ES2020","ignoreDeprecations":"6.0"}' npx ts-node --transpile-only scripts/car-rental/preflight-real-collection-execute.ts --request test-data/generated/real-collection-execute-request.filled.json --allow-blockers-for-report
```

## 10. 确认 filled.json 没有提交

- 运行 `git status --short`。
- 确认没有 `test-data/generated/real-collection-execute-request.filled.json`。
- `.gitignore` 应忽略 `filled` 和 `secret` 变体。

## 11. 确认没有密钥

- request 不得包含 `APP_KEY`、`DB_PASSWORD`、`INIT_ROOT_PASSWORD`、`IOPGPS_LOGIN_KEY`、`access_token`、`login_key` 或 `password` 字段。
- 不提交 `.env` 或 `.env.test`。

## 12. 确认仍未创建 Collection

- 本阶段不执行真实 Collection 创建。
- 不执行 migration。
- 不写数据库。
- 不注册服务、权限或页面。

## 13. 下一步如何发起 execute PR

- 另起 PR。
- 在 PR 中说明 execute reason、target database、backup artifact、rollback command、operator、execution time 和 expected result。
- 附上 validate request、apply request dry-run 和 preflight with request 的输出摘要。

## 14. 使用隔离测试库准备包预填 request

1. 复制 `.env.car-rental-collection-test.example` 为 `.env.car-rental-collection-test`，只填写测试库占位密码，不加入 `APP_KEY` 或 `IOPGPS_LOGIN_KEY`。
2. 启动 `docker-compose.car-rental-collection-test.yml` 中的 PostgreSQL 测试库。
3. 运行 `scripts/car-rental/validate-collection-test-db-safety.ts`；不得跳过 safety check。
4. 运行 `scripts/car-rental/backup-collection-test-db.sh`，并复制其输出的 `backup_artifact_reference`。
5. 运行 `scripts/car-rental/generate-real-collection-execute-request-from-test-db.ts --backup <backup_artifact_reference>` 生成本地 `filled.json`。
6. 确认 `rollback_command_reference` 引用 `scripts/car-rental/restore-collection-test-db.sh <backup-file>`。
7. 不允许手写假的备份引用、不允许 production DB、不允许真实 IOPGPS、不允许提交 filled request。
