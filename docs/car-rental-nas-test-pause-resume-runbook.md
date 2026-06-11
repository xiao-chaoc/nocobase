# Car Rental NAS 隔离 Collection 注册测试暂停/恢复 Runbook

> 当前状态：用户已暂停 Synology NAS 本地 Docker 测试。本文用于在暂停后恢复测试，并避免把测试数据库、测试 storage、mock 数据或临时请求带入生产。

## 1. 恢复前确认目录

在 NAS SSH 终端中先进入本次测试目录，例如：

```bash
cd /volume1/docker/nocobase_YG2
pwd
```

`pwd` 应显示当前完整 NocoBase v2.0.61 宿主工程目录，而不是单独的 `car-rental-nocobase` 插件骨架仓库。

## 2. 拉取最新代码

如果这是测试目录，且确认没有需要保留的本地修改，可以按团队流程拉取最新代码：

```bash
git pull origin main
```

拉取前后都建议检查本地未提交文件：

```bash
git status --short
```

不要提交以下本地测试产物：

- `.env.car-rental-collection-test`
- `backups-test/`
- `*.dump`
- `*.sql`
- `test-data/generated/real-collection-execute-request.filled.json` 等 filled request

## 3. 确认隔离测试环境文件

```bash
test -f .env.car-rental-collection-test && echo OK || echo MISSING
```

如果缺失，先复制模板后再按 NAS 测试库填写：

```bash
cp .env.car-rental-collection-test.example .env.car-rental-collection-test
```

脚本不会输出敏感值；不要把 `.env.car-rental-collection-test` 提交到 Git。

## 4. 确认 Docker Compose 版本

NAS 上可能只有旧版 `docker-compose`，例如 1.28.5：

```bash
docker-compose version
```

也可以检查新版插件是否存在：

```bash
docker compose version
```

老版 `docker-compose` 1.28.5 不支持 Compose 顶层 `name` 字段。因此测试 compose 文件不使用顶层 `name`，项目名由命令参数提供：

```bash
-p car-rental-collection-test
```

## 5. 确认 PostgreSQL 端口

隔离 PostgreSQL 的端口映射必须是：

```text
53240:5432
```

不能是：

```text
53240:53240
```

原因：容器内 PostgreSQL 仍监听标准端口 `5432`，`53240` 只是 NAS 宿主机暴露端口。

## 6. 运行 prepare-only（默认，不创建 Collection）

推荐使用一键 runner，不再手动逐步执行备份、request 生成、request 校验、dry-run 和 preflight：

```bash
bash scripts/car-rental/run-isolated-collection-registration-test.sh
```

prepare-only 会保持 `production_ready=false`，并且默认不真实创建 Collection、不执行 migration、不写数据库 schema、不注册服务、不注册权限、不创建页面、不导入真实数据、不调用真实 IOPGPS。

## 7. 运行 execute（仅隔离测试库）

只有在 prepare-only 成功、备份存在、request 校验通过、preflight 无 blockers 后，才允许在隔离测试库上执行：

```bash
CAR_RENTAL_COLLECTION_EXECUTE_ENABLED=true bash scripts/car-rental/run-isolated-collection-registration-test.sh --execute --confirm-real-collection-execute
```

execute 仍必须使用隔离测试库，并且 `IOPGPS_SYNC_ENABLED=false`。当前脚本仍不能标记 `production_ready`。

## 8. 确认报告

总报告路径固定为：

```text
test-data/generated/isolated-collection-registration-test-report.generated.json
```

可查看摘要：

```bash
node -e 'const fs=require("fs"); const p="test-data/generated/isolated-collection-registration-test-report.generated.json"; console.log(JSON.stringify(JSON.parse(fs.readFileSync(p,"utf8")), null, 2));'
```

报告必须保持：

```json
{
  "production_ready": false
}
```

## 9. 回滚隔离测试库

如果 runner 失败或 execute 后需要恢复，使用报告中的 `rollbackCommand`，或手动执行：

```bash
bash scripts/car-rental/restore-collection-test-db.sh backups-test/car-rental/pre-real-collection-register-20260610-235309.dump
```

也可以替换为 runner 本次输出的新备份文件。

## 10. 清理测试环境

停止并移除隔离测试容器与 network：

```bash
docker-compose -p car-rental-collection-test -f docker-compose.car-rental-collection-test.yml --env-file .env.car-rental-collection-test down
```

如 NAS 支持新版插件，也可使用：

```bash
docker compose -p car-rental-collection-test -f docker-compose.car-rental-collection-test.yml --env-file .env.car-rental-collection-test down
```

确认不再需要后，删除测试产物目录：

```bash
rm -rf storage-test/car-rental-postgres backups-test/car-rental logs-test test-runtime
```

## 11. 为什么 Docker 隔离不等于数据库安全

Docker 隔离只能隔离容器、network、volume 等运行时资源；数据库安全仍取决于 `.env`、端口、数据库名、备份恢复目标、脚本门禁和人工确认。如果误把测试 dump 恢复到生产库、复用测试 PostgreSQL volume、复用测试 `.env`，测试数据仍可能进入生产。因此脚本和人工流程都必须检查数据库名、安全标签、mock 开关和 IOPGPS 开关。

## 12. 为什么删除测试目录后重新 clone 可最小化影响

正式生产前，删除测试容器、测试 network、测试 `storage-test`、测试 `backups-test`、测试 `logs-test`、测试 `.env` 和整个测试源码目录，然后在新目录重新 clone，可最大限度降低测试残留文件、测试 volume、filled request、dump、mock 数据和临时配置被误用的概率。

生产部署必须使用：

- 新目录
- 新 `.env`
- 新 PostgreSQL 数据目录 / volume
- 新 storage
- 新生产数据库

当前隔离 runner 只服务 NAS 测试恢复流程，仍不能 production_ready。
