# Car Rental UAT Prerequisite Checklist

当前 UAT: No-Go。当前不要求用户本地运行；正式版前才恢复本地/NAS。

- [ ] Collection 真实注册通过。
- [ ] Runtime 真实注册通过。
- [ ] 权限真实验证通过。
- [ ] 页面真实初始化通过。
- [ ] mock 数据导入测试通过。
- [ ] business smoke test 通过。
- [ ] contract document test 通过。
- [ ] GPS mock test 通过。
- [ ] backup rollback rehearsal 通过。
- [ ] production init guard 通过。
- [ ] 隐私数据导入 guard 通过。
- [ ] 生产部署 runbook 通过。
- [ ] 真实 IOPGPS 默认禁用。
- [ ] UAT 数据准备说明：仅使用经确认的 UAT 数据；不得提交真实司机资料、真实付款截图、真实合同扫描件到仓库。
- [ ] UAT 账号和角色准备说明：准备管理员、财务、运营、只读审计等角色并验证权限。
- [ ] UAT 场景准备说明：覆盖租约、付款、押金、欠款、合同、GPS mock、备份回滚和生产初始化 guard。

Codex 不自动置 production_ready=true。
