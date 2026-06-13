# Car Rental Codex-only 修改项清单

## 当前立即由 Codex 继续补齐的项目

- Runtime / 服务 / 动作注册阶段：已建立 dry-run 阶段，仍需后续实现真实 runtime。
- Permission / sensitive field test stage：已建立 dry-run 阶段，仍需后续实现真实权限注册和本地 pre-release 验证。
- Page / menu / block 阶段：已建立 dry-run 阶段，仍需后续实现真实页面/菜单/区块初始化和本地 pre-release 验证。
- Mock data import 阶段：已建立 dry-run 阶段，已添加安全 mock fixtures 和生产防 mock 门禁，仍需后续实现真实 pre-release 导入验证。
- Business smoke test 阶段：已建立 dry-run 阶段，仍需后续真实 pre-release 本地验证。
- Contract document test 阶段：已建立 dry-run 阶段，仍需后续真实 pre-release 本地验证。
- GPS mock test 阶段：已建立 dry-run 阶段，仍需后续真实 pre-release 本地验证。
- Backup/rollback rehearsal 阶段：已建立 dry-run 阶段，仍需后续真实 pre-release 本地验证。
- Production init guard 阶段：已建立 dry-run 阶段，仍需正式版前本地/NAS 验证和人工生产配置确认。
- 完整 pre-release 总报告。

## 下一优先级

1. Pre-release final report aggregation.
2. UAT checklist.
3. Production deployment runbook.
4. Privacy data import guard.

## 当前不由用户执行的项目

- 本地 Docker 测试。
- 本地 PostgreSQL 测试库。
- 本地 backup dump。
- 本地 filled request。
- 当前不要求用户现在运行 run-full，本地测试已暂停，current local test not required。

## 正式版前用户再执行的项目

- clone `xiao-chaoc/nocobase`。
- 配置生产 env。
- 导入真实隐私数据前检查。
- 最终 UAT。
- 生产备份和回滚检查。
- 进入 pre-release local execution 前必须使用新目录、新 `.env`、新 PostgreSQL volume、新 storage。

## 不变门禁

- production_ready=false。
- mock data cannot enter production。
- mock 数据不能进入生产。
- production init must not call mock import。
- run-full retained for future pre-release execution。
- 当前不启用真实 IOPGPS。

## Page / menu / block 阶段更新（2026-06-11）

- Page / menu / block 阶段已建立 dry-run 阶段，仍需后续实现真实页面/菜单/区块初始化和本地 pre-release 验证。

## Mock data import 阶段更新（2026-06-12）

- Mock data import 阶段标记为 codex_dry_run 已建立。
- 已添加 `test-data/mock/car-rental/` 安全 mock fixtures。
- 已添加 `scripts/car-rental/run-isolated-mock-data-import-test.sh` dry-run 脚本。
- 已添加 mock import JSON / Markdown 报告和修改项清单。
- 已添加生产防 mock 门禁校验脚本。
- Mock data import 真实执行仍为 local_pre_release。
- 当前不要求用户本地运行。
- 下一优先级：
  - Pre-release final report aggregation.
  - UAT checklist.
  - Production deployment runbook.
  - Privacy data import guard.

## Business smoke test 阶段更新（2026-06-12）

- Business smoke test 阶段标记为 codex_dry_run 已建立。
- 已添加业务 smoke test plan、dry-run 脚本、JSON/Markdown 报告、修改项清单、校验脚本和测试。
- Business smoke test 真实执行仍为 local_pre_release，仍需后续真实 pre-release 本地验证。
- 当前不要求用户本地运行。
- production_ready=false。
- 不启用真实 IOPGPS，mock 数据不得进入生产。
- 下一优先级：
  - Pre-release final report aggregation.
  - UAT checklist.
  - Production deployment runbook.
  - Privacy data import guard.


## Contract document test 阶段更新（2026-06-12）

- Contract document test 阶段标记为 codex_dry_run 已建立。
- 已添加合同文档 test plan、dry-run 脚本、JSON/Markdown 报告、修改项清单、校验脚本和测试。
- Contract document test 真实执行仍为 local_pre_release，仍需后续真实 pre-release 本地验证。
- 当前不要求用户本地运行。
- production_ready=false。
- 不启用真实 IOPGPS，mock 数据不得进入生产，mock 数据不能进入生产。
- 下一优先级：
  - Pre-release final report aggregation.
  - UAT checklist.
  - Production deployment runbook.
  - Privacy data import guard.


## GPS mock test 阶段更新（2026-06-12）

- GPS mock test 阶段标记为 codex_dry_run 已建立。
- 已添加 GPS mock test plan、dry-run 脚本、JSON/Markdown 报告、修改项清单、校验脚本和测试。
- GPS mock test 真实执行仍为 local_pre_release，仍需后续真实 pre-release 本地验证。
- 当前不要求用户本地运行。
- production_ready=false。
- 不启用真实 IOPGPS，mock 数据不得进入生产，mock 数据不能进入生产。
- GPS 不参与租金计算，GPS 失败不影响租金台账、付款分配、押金或合同文档。
- 下一优先级：
  - Pre-release final report aggregation.
  - UAT checklist.
  - Production deployment runbook.
  - Privacy data import guard.


## Backup / rollback rehearsal 阶段更新（2026-06-12）

- Backup/rollback rehearsal 阶段标记为 codex_dry_run 已建立。
- 已添加备份/回滚演练 plan、dry-run 脚本、JSON/Markdown 报告、修改项清单、校验脚本和测试。
- Backup/rollback rehearsal 真实执行仍为 local_pre_release，正式版前才本地执行真实 backup dump、restore 和 rollback drill。
- 当前不要求用户本地运行。
- 当前没有有效本地 dump，不得引用已删除的本地 NAS dump 作为当前有效备份。
- dump / SQL / filled request 不得提交。
- production_ready=false。
- 下一优先级：
  - Pre-release final report aggregation.
  - UAT checklist.
  - Production deployment runbook.
  - Privacy data import guard.

## Production init guard 阶段更新（2026-06-13）

- Production init guard 阶段已建立 dry-run 阶段，仍需正式版前本地/NAS 验证和人工生产配置确认。
- 已添加生产初始化门禁计划、生产 env example、生产部署边界文档、dry-run guard 脚本、生产防 mock 校验、JSON / Markdown 报告、修改项清单、阶段校验脚本和测试。
- 生产初始化真实执行仍为 local_pre_release。
- 当前不要求用户本地运行，不要求配置真实生产 env，不启动生产容器，不初始化生产库。
- production_ready=false。
- 下一优先级：
  - Pre-release final report aggregation.
  - UAT checklist.
  - Production deployment runbook.
  - Privacy data import guard.
