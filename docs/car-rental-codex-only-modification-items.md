# Car Rental Codex-only 修改项清单

## 当前立即由 Codex 继续补齐的项目

- Runtime / 服务 / 动作注册阶段：已建立 dry-run 阶段，仍需后续实现真实 runtime。
- Permission / sensitive field test stage：已建立 dry-run 阶段，仍需后续实现真实权限注册和本地 pre-release 验证。
- Page / menu / block 阶段：已建立 dry-run 阶段，仍需后续实现真实页面/菜单/区块初始化和本地 pre-release 验证。
- Mock data import 阶段：已建立 dry-run 阶段，已添加安全 mock fixtures 和生产防 mock 门禁，仍需后续实现真实 pre-release 导入验证。
- Business smoke test stage.
- Contract document test stage.
- GPS mock test stage.
- Backup/rollback rehearsal stage.
- Production init guard stage.
- 完整 pre-release 总报告。

## 下一优先级

1. Business smoke test stage.
2. Contract document test stage.
3. GPS mock test stage.
4. Backup/rollback rehearsal stage.
5. Production init guard stage.

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
  - Business smoke test stage.
  - Contract document test stage.
  - GPS mock test stage.
  - Backup/rollback rehearsal stage.
  - Production init guard stage.
