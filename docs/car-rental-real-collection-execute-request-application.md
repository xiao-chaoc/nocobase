# car-rental 真实 Collection execute request 申请记录（本轮 Docker unavailable）

## 1. 本轮结论

本轮在 `/workspace/nocobase` 完整 NocoBase v2.0.61 宿主工程中，基于已创建的隔离 PostgreSQL 测试库准备包进行了实际启动前置尝试：已创建本地 ignored 测试 env，并通过 safety check；但当前 Codex 环境没有 `docker` 命令，无法启动隔离 PostgreSQL 测试库。同时当前环境也没有可用 `pg_dump` / `pg_restore`，因此本轮没有生成真实 backup dump、没有生成 filled request，也没有执行 request 校验、apply dry-run 或 preflight with request。

- 当前阶段：`blocked_by_missing_docker_runtime`
- 是否 production ready：否
- 是否 execute：否
- 是否真实创建 Collection：否
- 是否写数据库 schema：否
- 是否执行 migration：否
- 是否注册服务：否
- 是否注册权限：否
- 是否创建页面：否
- 是否导入数据：否
- 是否调用真实 IOPGPS：否

## 2. 宿主工程扫描

已按任务要求执行宿主工程全盘扫描命令，并确认关键路径存在：

```bash
find . -maxdepth 6 -type f \( -path './node_modules/*' -o -path './.git/*' -o -path './.test-dist/*' -o -path './storage/*' -o -path './storage-test/*' -o -path './backups-test/*' -o -path './logs-test/*' -o -path './test-runtime/*' \) -prune -o -type f -print | sort
```

扫描结果写入本地临时文件 `/tmp/nocobase-full-scan-3.txt`，共扫描到 6132 个文件路径。以下关键路径均存在：

- `package.json`
- `yarn.lock`
- `.env.car-rental-collection-test.example`
- `docker-compose.car-rental-collection-test.yml`
- `scripts/car-rental/backup-collection-test-db.sh`
- `scripts/car-rental/restore-collection-test-db.sh`
- `scripts/car-rental/validate-collection-test-db-safety.ts`
- `scripts/car-rental/generate-real-collection-execute-request-from-test-db.ts`
- `scripts/car-rental/validate-real-collection-execute-request.ts`
- `scripts/car-rental/apply-real-collection-execute-request.ts`
- `scripts/car-rental/preflight-real-collection-execute.ts`
- `docs/car-rental-collection-test-db-setup.md`
- `docs/car-rental-real-collection-execute-preflight.md`
- `docs/car-rental-real-collection-execute-rollback.md`

## 3. Compose 与 env 模板检查

已读取 `.env.car-rental-collection-test.example`、`docker-compose.car-rental-collection-test.yml` 和 `docs/car-rental-collection-test-db-setup.md`，确认：

| 检查项 | 结果 |
| --- | --- |
| `DB_DIALECT` | `postgres` |
| `DB_DATABASE` | `nocobase_car_rental_collection_test`，明显是测试库 |
| `CAR_RENTAL_DATABASE_SAFETY_LABEL` | `isolated_test_database` |
| `CAR_RENTAL_MOCK_DATA_ONLY` | `true` |
| `IOPGPS_SYNC_ENABLED` | `false` |
| `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED` | `false` |
| Compose service | 只定义 `postgres` |
| Compose image | `postgres:16` |
| 数据目录 | `./storage-test/car-rental-postgres` |
| 生产 storage | 未挂载 |
| IOPGPS | 未启动 |
| Collection 注册 | 未执行 |

Compose 暴露宿主端口 `5432:5432`。本轮本地 ignored env 将 `DB_HOST` 调整为 `127.0.0.1`，以便宿主机执行的 backup/restore 脚本通过映射端口连接容器；该本地 env 不提交。

## 4. 本地测试 env

已执行：

```bash
cp .env.car-rental-collection-test.example .env.car-rental-collection-test
```

并将本地 ignored 文件中的测试密码替换为随机测试值，同时保持：

- `DB_DIALECT=postgres`
- `DB_DATABASE=nocobase_car_rental_collection_test`
- `CAR_RENTAL_DATABASE_SAFETY_LABEL=isolated_test_database`
- `CAR_RENTAL_MOCK_DATA_ONLY=true`
- `IOPGPS_SYNC_ENABLED=false`
- `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false`

未输出数据库密码，未写入 `APP_KEY`，未写入 `IOPGPS_LOGIN_KEY`。`.env.car-rental-collection-test` 被 `.gitignore` 忽略，不能提交。

## 5. safety check

已执行：

```bash
TS_NODE_SKIP_PROJECT=1 TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"node","target":"ES2020","ignoreDeprecations":"6.0"}' npx ts-node --transpile-only scripts/car-rental/validate-collection-test-db-safety.ts
```

结果：通过。

通过项包括：

- `DB_DIALECT` 是 `postgres/postgresql`。
- `DB_DATABASE` 包含 `test/car_rental/collection_test` 测试标识。
- `CAR_RENTAL_DATABASE_SAFETY_LABEL=isolated_test_database`。
- `CAR_RENTAL_MOCK_DATA_ONLY=true`。
- `IOPGPS_SYNC_ENABLED=false`。
- `CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=false`。

脚本同时提示 `backups-test/car-rental` 尚不存在，会在 backup 脚本运行时创建。该脚本没有连接数据库、没有写数据库、没有创建 Collection、没有执行 migration。

## 6. Docker Compose 与 PostgreSQL 测试库启动

已执行：

```bash
docker compose version && docker compose -f docker-compose.car-rental-collection-test.yml --env-file .env.car-rental-collection-test up -d
```

结果：失败，当前 Codex 环境没有 `docker` 命令：

```text
/bin/bash: line 1: docker: command not found
```

因此本轮没有启动隔离 PostgreSQL 测试库，也没有执行 `docker compose ps`。

## 7. 备份与 backup_artifact_reference

- 是否生成真实测试库备份：否。
- `backup_artifact_reference`：未生成。
- 原因：当前环境无法启动 Docker Compose PostgreSQL 测试库，且未发现可用 `pg_dump`。
- 未创建或提交 `backups-test/`、`*.dump` 或 `*.sql`。

不得编造 backup artifact。下一轮必须在支持 Docker Compose 和 PostgreSQL client 的 NAS / 本地宿主环境中运行 `scripts/car-rental/backup-collection-test-db.sh`，并使用脚本真实输出的 `backup_artifact_reference`。

## 8. rollback_command_reference

- 本轮未生成 filled request，因此没有最终 request 内的 `rollback_command_reference`。
- 预期格式仍为：`scripts/car-rental/restore-collection-test-db.sh <backup-file>`。
- 回滚说明文档仍为：`docs/car-rental-real-collection-execute-rollback.md`。

## 9. filled request、validate、apply dry-run、preflight with request

| 步骤 | 结果 | 说明 |
| --- | --- | --- |
| 生成 filled request | 未执行 | 没有真实 backup dump，不能生成。 |
| filled request 是否未提交 | 是 | 文件不存在，且被 `.gitignore` 忽略。 |
| validate request | 未执行 | 没有合法 filled request。 |
| apply dry-run | 未执行 | validate request 未通过前不得执行。 |
| preflight with request | 未执行 | 没有合法 filled request；不得伪造通过态报告。 |

## 10. 当前 blockers

1. 当前 Codex 环境没有 `docker` 命令，不能启动隔离 PostgreSQL 测试库。
2. 当前环境未发现可用 `pg_dump` / `pg_restore`。
3. 未生成真实测试库 backup dump。
4. 未生成合法 filled request。
5. 未执行 validate request、apply dry-run、preflight with request。

## 11. 是否可以进入真实 Collection execute PR 审查阶段

当前不能进入真实 Collection execute PR 审查阶段。进入前必须在 NAS / 本地宿主环境完成：

1. 保留本地 `.env.car-rental-collection-test`，不要提交。
2. 启动隔离 PostgreSQL：`docker compose -f docker-compose.car-rental-collection-test.yml --env-file .env.car-rental-collection-test up -d`。
3. 确认 `docker compose ... ps` 显示 `postgres:16` 正常运行。
4. 确认可用 `pg_dump`。
5. 运行 `scripts/car-rental/backup-collection-test-db.sh` 生成真实 backup dump。
6. 用真实 backup path 运行 `scripts/car-rental/generate-real-collection-execute-request-from-test-db.ts --backup <backup-file>`。
7. 运行 validate request、apply dry-run 和 preflight with request。
8. 确认 `.env.car-rental-collection-test`、filled request、dump、SQL 文件均未提交。

## 12. 本轮不是 execute

本轮只创建了本地 ignored env，并完成 safety check；由于当前环境缺少 Docker，未启动 PostgreSQL、未备份、未生成 filled request。本轮仍不是 execute，未创建 Collection、未写数据库 schema、未执行 migration、未注册服务、未注册权限、未创建页面、未导入数据、未调用真实 IOPGPS。
