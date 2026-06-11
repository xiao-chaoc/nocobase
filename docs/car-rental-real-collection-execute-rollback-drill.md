# car-rental 真实 Collection execute rollback 演练说明

> 本文只用于隔离 NocoBase 2.0.61 PostgreSQL 测试库的 execute 回滚演练；不生产部署，不使用生产库。

## 1. 何时需要回滚

出现以下任一情况时，应停止后续操作并执行回滚演练：

- 8 个最小 Collection 创建后结构与计划不一致。
- 唯一约束、relation、敏感字段保留规则与预期不一致。
- 出现短租 Collection、`driver_login`、`vehicle_category_rental` 等本阶段禁止对象。
- GPS 被纳入租金计算，或押金被计入租金收入。
- execute 脚本、NocoBase API 或运行环境返回不确定状态。
- 人工确认发现目标库不是隔离测试库，或存在生产/类生产风险。

## 2. 使用哪个备份文件

使用执行前备份：

```bash
backups-test/car-rental/pre-real-collection-register-20260610-235309.dump
```

该文件不得提交到 Git。恢复前必须人工确认该文件存在、可读，且对应本次 execute 前的隔离测试库。

## 3. 使用哪个 restore 脚本

使用：

```bash
scripts/car-rental/restore-collection-test-db.sh
```

该脚本恢复前必须人工输入 `YES`，且只能面向隔离测试库。

## 4. 恢复前如何停止测试进程

- 停止正在连接隔离测试库的 NocoBase 测试进程、后台 worker、定时任务和手工脚本。
- 确认没有 execute、post-validate、导入脚本或 psql 会话仍在写入测试库。
- 保留当前终端输出、NocoBase 日志和 execute 日志，不要覆盖。

## 5. 恢复命令草案

```bash
scripts/car-rental/restore-collection-test-db.sh backups-test/car-rental/pre-real-collection-register-20260610-235309.dump
```

执行时按脚本提示人工输入 `YES`。不得在生产库或类生产库运行该命令。

## 6. 恢复后如何验证

恢复后应运行只读验证，确认以下对象不存在或已恢复到 execute 前状态：

- `drivers`
- `vehicles`
- `lease_contracts`
- `rent_daily_ledgers`
- `rent_payments`
- `rent_payment_allocations`
- `deposit_records`
- `operation_logs`

同时确认唯一约束、relation、敏感字段保留规则、禁止 Collection、GPS 租金隔离和押金收入隔离均恢复到执行前状态。若真实查询 API 尚未完成验证，应在 post-validate 输出中标记 `pending_real_api_verification`，不得伪造成功。

## 7. 如何保留日志

- 保存 execute 命令、参数、执行窗口、operator 和终端输出。
- 保存 restore 命令输出和人工确认时间。
- 保存 post-validate 或只读验证输出。
- 日志中不得包含 `DB_PASSWORD`、`APP_KEY`、`IOPGPS_LOGIN_KEY` 或真实司机数据。

## 8. 如何确认没有影响生产库

- 再次确认 `database_safety_label = isolated_test_database`。
- 再次确认数据库名称、连接目标和执行环境均指向隔离测试库。
- 检查没有生产库备份、生产库连接串、生产 storage 或生产环境变量参与本流程。
- 若发现生产/类生产标识，立即停止，不执行 restore。

## 9. 如何确认 IOPGPS 仍然禁用

- 确认 `IOPGPS_SYNC_ENABLED = false`。
- 确认没有真实 `IOPGPS_LOGIN_KEY`。
- 确认 execute、post-validate、restore 均不调用真实 IOPGPS。

## 10. 如何记录回滚结果

记录以下信息：

- rollback reason
- backup artifact
- restore command
- operator
- rollback start/end time
- restore output location
- post-rollback validation result
- 是否确认未影响生产库
- 是否确认 IOPGPS 仍禁用
