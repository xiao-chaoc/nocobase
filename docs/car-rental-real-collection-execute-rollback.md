# car-rental 真实 Collection execute 回滚方案（隔离测试库专用）

## 1. 适用范围与结论

- 本文档只适用于 `car-rental` 核心 Collection 真实 execute 前后的**隔离 PostgreSQL 测试库**回滚演练。
- 本文档不适用于生产、类生产、演示、联调或包含真实司机、车辆、合同、付款、押金、GPS 数据的环境。
- 本轮任务未能从当前宿主工程环境确认 `DB_DIALECT=postgres/postgresql`，也未能确认数据库名、连接名或安全标签属于隔离测试库；因此本轮没有生成可确认的真实测试库备份文件。
- 当前阶段不是 execute，不能据此创建 Collection、执行 migration、注册服务、注册权限、导入数据、创建页面或调用真实 IOPGPS。

## 2. 回滚目标

如果后续单独的 execute PR 在隔离 PostgreSQL 测试库中真实注册了最小 `car-rental` Collection 范围，回滚目标是将测试库恢复到 execute 之前的状态，并确认以下对象不存在或恢复为执行前状态：

- `drivers`
- `vehicles`
- `lease_contracts`
- `rent_daily_ledgers`
- `rent_payments`
- `rent_payment_allocations`
- `deposit_records`
- `operation_logs`

## 3. 回滚前提

执行任何恢复命令前必须同时满足：

1. 已人工确认数据库类型为 PostgreSQL。
2. 已人工确认数据库是隔离测试库，数据库名、连接名或安全标签必须明确包含 `test`、`car_rental_test`、`nocobase_car_lease_test` 或 `isolated` 等测试标识。
3. 已人工确认数据库名、连接名或环境标签不包含 `prod`、`production`、`live` 等生产特征。
4. 已拥有 execute 前生成的真实测试库备份文件或等价备份记录。
5. 备份文件不提交到 Git；`backups-test/`、`*.dump`、`*.sql` 均应保持未跟踪。
6. 回滚命令不得输出或记录 `DB_PASSWORD`、`APP_KEY`、`INIT_ROOT_PASSWORD`、`IOPGPS_LOGIN_KEY`、`access_token`、`login_key` 或任何密码字段。

## 4. 数据库备份文件引用

- 本轮 backup artifact：`未确认`。
- 原因：当前宿主工程没有可读取的 `.env` / `.env.test` 配置，当前进程环境也没有 `DB_DIALECT`、`DB_DATABASE`、`DATABASE_URL` 等变量；同时当前环境未发现可用 `pg_dump` 命令。因此不能确认隔离 PostgreSQL 测试库，也不能生成真实测试库备份。
- 后续 execute PR 进入审查前，必须将本节更新为真实存在的隔离测试库备份文件路径或真实备份记录，例如：`backups-test/car-rental/pre-real-collection-register-YYYYMMDD-HHmmss.dump`。

## 5. 恢复命令草案（不得直接用于生产）

以下命令仅为隔离测试库恢复草案。执行前必须由人工在本地 shell 中注入数据库连接参数，且不得在日志中打印密码值。

```bash
# 1) 停止测试进程后，先确认目标库是隔离测试库
printf '%s\n' "$DB_DIALECT" "$DB_DATABASE" | sed 's/.*/[redacted]/'

# 2) 使用自定义格式 dump 恢复（示例）
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --dbname="$DATABASE_URL" \
  backups-test/car-rental/pre-real-collection-register-YYYYMMDD-HHmmss.dump
```

如果宿主工程后续提供测试库专用恢复脚本，应优先使用该脚本，并在 execute PR 中记录脚本路径、输入备份 artifact、退出码和日志位置。

## 6. 停止 NocoBase 测试进程

在恢复隔离测试库前，应停止所有可能连接测试库的 NocoBase 测试进程：

1. 停止当前 shell 中运行的 `yarn dev`、`yarn start`、`yarn test` 或相关脚本。
2. 如果使用进程管理器或容器运行测试实例，停止对应的测试实例或测试容器。
3. 确认没有正在执行 Collection 注册、migration、数据导入、文件上传或 IOPGPS 同步的任务。
4. 保留停止前后的终端日志，不要覆盖 `logs-test/` 或其他测试日志目录。

## 7. 恢复测试库步骤

1. 再次确认当前数据库是隔离 PostgreSQL 测试库。
2. 再次确认备份 artifact 存在且未提交到 Git。
3. 停止 NocoBase 测试进程。
4. 使用 `pg_restore` 或宿主工程测试恢复脚本恢复 execute 前备份。
5. 记录恢复命令的退出码、恢复开始时间、结束时间和日志路径。
6. 恢复后只运行只读校验或 NocoBase 元数据检查，不导入业务数据。

## 8. Collection 回滚验证

恢复完成后，应通过只读方式验证：

1. 最小 `car-rental` Collection 范围不存在，或与 execute 前备份状态一致。
2. 没有新增 car-rental 业务表、字段、索引或 NocoBase Collection 元数据残留。
3. 没有执行新的 migration。
4. 没有新增服务、权限、页面或菜单。
5. `real-collection-execute-preflight` 仍记录本轮不是 production ready，且没有真实 execute 标记。

## 9. 真实业务数据安全确认

恢复后必须确认：

1. 测试库不包含真实司机资料、真实车辆资料、真实合同、真实付款截图、真实押金记录、真实 GPS 轨迹或真实上传文件。
2. 本轮没有写入业务数据，没有导入 mock 数据，也没有上传文件。
3. 如发现任何生产特征或真实业务数据，应立即停止后续 execute 流程，并将环境标记为不可用于本任务。

## 10. IOPGPS 禁用确认

恢复前后均必须确认：

1. `IOPGPS_SYNC_ENABLED` 未开启。
2. 没有配置真实 `IOPGPS_LOGIN_KEY`。
3. 没有调用真实 IOPGPS 登录、车辆、里程、轨迹或同步接口。
4. 日志中不得出现真实 IOPGPS token、login key 或外部接口响应载荷。

## 11. 日志保留

- 保留 preflight、request validation、apply dry-run、备份、恢复、只读校验的终端输出。
- 日志可以记录变量名是否存在，但不得记录任何密钥、密码、token 或 `.env` / `.env.test` 真实值。
- 如果生成备份或恢复日志，日志文件应放在测试日志位置并避免提交到 Git。

## 12. 本轮状态

- 本轮未确认 PostgreSQL 隔离测试库。
- 本轮未生成真实测试库备份。
- 本轮未生成可通过校验的 filled request。
- 本轮未创建 Collection。
- 本轮未写数据库。
- 本轮未执行 migration。
- 本轮未调用 IOPGPS。
