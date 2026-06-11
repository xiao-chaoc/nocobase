# Car Rental Codex-only 修改项清单

## 当前立即由 Codex 继续补齐的项目

- Runtime / 服务 / 动作注册测试脚本。
- Permission / 权限与敏感字段测试脚本。
- Page / 页面 / 菜单 / 区块初始化测试脚本。
- mock data import / mock 数据导入测试脚本。
- business smoke test / 核心业务 smoke test 脚本。
- 合同文件测试脚本。
- GPS mock 测试脚本。
- 备份 / 回滚演练脚本。
- 完整 pre-release 总报告。
- 生产初始化脚本草案。
- production init guard / 生产防 mock 门禁。

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
- run-full retained for future pre-release execution。
