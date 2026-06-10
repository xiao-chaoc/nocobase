# car-rental 隔离 PostgreSQL 测试库准备说明

## 1. 为什么需要隔离 PostgreSQL 测试库

car-rental 真实 Collection execute 会验证 NocoBase v2.0.61 在 PostgreSQL 上注册最小 Collection 范围的能力。该验证必须使用隔离测试库，以便在出现元数据或表结构问题时可以用测试备份回滚，并确保不会影响真实司机、车辆、合同、付款、押金、GPS 或上传文件。

## 2. 为什么不能使用生产库

生产库或类生产库可能包含真实业务数据、真实文件和真实外部集成配置。任何 Collection 注册、migration 或恢复操作都可能改变生产元数据或业务表结构。因此本准备包通过测试库名称、安全标签、mock-only 标志、IOPGPS 禁用标志和 execute 禁用标志阻断生产环境使用。

## 3. 为什么不能用 SQLite 作为真实 execute 验证

SQLite 适合部分单元测试，但不能覆盖 PostgreSQL 方言、索引、schema、事务和 NocoBase 生产目标数据库行为。真实 Collection execute 的最终验证必须在隔离 PostgreSQL 测试库中完成。

## 4. 创建本地测试 env

复制可提交模板为本地不可提交配置：

```bash
cp .env.car-rental-collection-test.example .env.car-rental-collection-test
```

`.env.car-rental-collection-test.example` 可以提交；`.env.car-rental-collection-test` 不可提交。

如果在宿主机上执行 `backup-collection-test-db.sh` / `restore-collection-test-db.sh`，并通过本 Compose 文件暴露的 `5432:5432` 连接容器，请在本地 `.env.car-rental-collection-test` 中将 `DB_HOST` 调整为 `127.0.0.1` 或 `localhost`；`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD` 仍用于容器初始化。不要把这个本地 env 提交到 Git。

## 5. 需要修改哪些测试密码

在 `.env.car-rental-collection-test` 中仅替换测试占位密码：

- `DB_PASSWORD=TEST_ONLY_CHANGE_ME`
- `POSTGRES_PASSWORD=TEST_ONLY_CHANGE_ME`

两个值应保持一致，且必须是隔离测试库专用密码。不要加入 `APP_KEY`、`IOPGPS_LOGIN_KEY`、真实 token 或任何生产密码。

## 6. 启动 PostgreSQL 测试库

```bash
docker compose -f docker-compose.car-rental-collection-test.yml --env-file .env.car-rental-collection-test up -d postgres
```

该 Compose 草案只启动 `postgres:16`，数据目录为 `./storage-test/car-rental-postgres`，网络为 `car-rental-collection-test`。它不启动真实 IOPGPS、不挂载真实业务文件、不挂载生产 storage，也不执行 Collection 注册。

## 7. 确认数据库方言和测试库名称

在本地 shell 中只确认变量名和值是否符合测试要求，不要输出密码：

```bash
printf 'DB_DIALECT=%s\n' "$DB_DIALECT"
printf 'DB_DATABASE=%s\n' "$DB_DATABASE"
```

必须满足：

- `DB_DIALECT=postgres` 或 `DB_DIALECT=postgresql`
- `DB_DATABASE=nocobase_car_rental_collection_test` 或其他明显包含 `test` / `car_rental` / `collection_test` 的测试库名
- 数据库名不得包含 `prod`、`production`、`live`

## 8. 确认 IOPGPS 禁用和 mock-only

必须满足：

- `IOPGPS_SYNC_ENABLED=false`
- `CAR_RENTAL_MOCK_DATA_ONLY=true`
- `CAR_RENTAL_DATABASE_SAFETY_LABEL=isolated_test_database`
- `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false`

可运行安全校验脚本；该脚本不连接数据库、不写数据库、不输出 `DB_PASSWORD`：

```bash
TS_NODE_SKIP_PROJECT=1 TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node","target":"ES2020","ignoreDeprecations":"6.0"}' npx ts-node --transpile-only scripts/car-rental/validate-collection-test-db-safety.ts
```

## 9. 生成测试库备份

启动隔离测试库并确认安全校验通过后运行：

```bash
scripts/car-rental/backup-collection-test-db.sh
```

脚本会使用 `pg_dump` 生成：

```text
backups-test/car-rental/pre-real-collection-register-YYYYMMDD-HHmmss.dump
```

脚本输出的 `backup_artifact_reference` 必须作为后续 request 的备份引用。不要手写假的备份引用，不要提交 dump。

## 10. 生成 filled request 草案

有真实备份文件后运行：

```bash
TS_NODE_SKIP_PROJECT=1 TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node","target":"ES2020","ignoreDeprecations":"6.0"}' npx ts-node --transpile-only scripts/car-rental/generate-real-collection-execute-request-from-test-db.ts --backup backups-test/car-rental/pre-real-collection-register-YYYYMMDD-HHmmss.dump
```

该脚本会先运行 safety check，并确认 backup 文件存在。生成的 `test-data/generated/real-collection-execute-request.filled.json` 不可提交，且 `allow_real_execution=false`。

## 11. 停止测试库

```bash
docker compose -f docker-compose.car-rental-collection-test.yml --env-file .env.car-rental-collection-test down
```

## 12. 清理测试库

如需清理隔离测试库数据目录，先停止容器，然后仅删除测试目录：

```bash
rm -rf storage-test/car-rental-postgres
```

不要删除或挂载生产 storage。

## 13. 避免提交本地文件

必须保持以下文件未提交：

- `.env.car-rental-collection-test`
- `backups-test/`
- `*.dump`
- `*.sql`
- `test-data/generated/real-collection-execute-request.filled.json`

## 14. 当前仍不创建 Collection

本准备包只创建模板、脚本和文档。它不创建 Collection、不执行 migration、不注册服务、不注册权限、不创建页面、不导入数据、不调用真实 IOPGPS。
