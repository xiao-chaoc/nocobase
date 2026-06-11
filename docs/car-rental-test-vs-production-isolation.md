# Car Rental 测试 / 生产隔离策略

本文定义 car-rental NAS 测试目录与未来生产目录之间的隔离边界，避免 mock 数据、测试 dump、测试 storage 或 filled request 进入生产。

## 测试数据不会自动进入生产的条件

测试数据不会自动进入生产，但前提是同时满足以下条件：

- 不复用测试 PostgreSQL volume。
- 不复用测试 storage。
- 不复用测试 `.env`。
- 不恢复测试 dump 到生产。
- 不执行 mock import 到生产。
- 不提交 dump / filled request / env。

只要违反其中任一条件，Docker 隔离就不能保证数据库安全。

## 推荐目录与库名

推荐测试目录：

```text
/volume1/docker/nocobase-car-rental-test
```

推荐生产目录：

```text
/volume1/docker/nocobase-car-rental-prod
```

测试库名示例：

```text
nocobase_car_rental_collection_test
```

生产库名示例：

```text
nocobase_car_rental_prod
```

## 安全标签

测试安全标签：

```text
isolated_test_database
```

生产安全标签：

```text
production_database
```

测试环境可导入 mock 数据；生产初始化禁止导入 mock 数据。

## IOPGPS 策略

生产初期建议：

```text
IOPGPS_SYNC_ENABLED=false
```

在 UAT、权限、回滚演练、数据映射和真实接口限流策略全部确认前，不启用真实 IOPGPS 同步。

## 正式上线前建议删除

正式上线前建议删除：

- 测试容器
- 测试 network
- 测试 `storage-test`
- 测试 `backups-test`
- 测试 `logs-test`
- 测试 `.env`
- 测试源码目录

然后在生产新目录重新 clone，并使用生产专用 `.env`、生产 PostgreSQL 数据目录 / volume、生产 storage 和生产数据库。删除测试目录后重新 clone 生产目录可以最小化测试影响，但不能替代生产备份、UAT 和回滚演练。
