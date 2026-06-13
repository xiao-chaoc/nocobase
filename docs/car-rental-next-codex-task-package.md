# Car Rental Next Codex Task Package

## 1. Privacy data import guard stage

- 目标：建立隐私数据导入 guard，防止真实司机资料、付款截图、合同扫描件进入 Codex dry-run 或仓库。
- 输入：现有 mock guard、production init guard、权限敏感字段报告。
- 输出：计划、脚本、dry-run report、modification items、validation、tests。
- 禁止事项：不得读取或输出 .env 密钥，不得导入真实隐私数据。
- 是否需要用户本地/NAS：否；真实导入确认需要正式版前人工执行。
- 是否涉及隐私数据：是，但 Codex 阶段只做 guard，不处理真实数据。
- 是否阻塞 UAT：是。
- 是否阻塞生产：是。

## 2. Production deployment runbook stage

- 目标：编写生产部署 runbook。
- 输入：production init guard、test/production separation、mock data guard。
- 输出：部署、回滚、备份、密钥、storage、DB volume、人工确认 runbook。
- 禁止事项：不得创建生产容器，不得初始化生产库。
- 是否需要用户本地/NAS：否。
- 是否涉及隐私数据：间接涉及。
- 是否阻塞 UAT：是。
- 是否阻塞生产：是。

## 3. UAT checklist finalization stage

- 目标：将 UAT 前置清单扩展为可验收场景。
- 输入：business smoke、contract、GPS、permission、backup 报告。
- 输出：UAT checklist、角色矩阵、场景矩阵、验收标准。
- 禁止事项：不得伪造 UAT 通过。
- 是否需要用户本地/NAS：否，执行阶段需要用户环境。
- 是否涉及隐私数据：可能涉及 UAT 数据准备。
- 是否阻塞 UAT：是。
- 是否阻塞生产：是。

## 4. Pre-release local execution recovery package

- 目标：恢复正式版前本地/NAS 执行包。
- 输入：run-full、各阶段脚本、环境安全规则。
- 输出：恢复说明、执行顺序、报告收集模板。
- 禁止事项：不得要求用户当前本地运行；不得连接数据库。
- 是否需要用户本地/NAS：未来正式版前需要。
- 是否涉及隐私数据：否。
- 是否阻塞 UAT：是。
- 是否阻塞生产：是。

## 5. Real local/NAS pre-release report ingestion stage

- 目标：读取未来真实执行报告并更新 Go/No-Go。
- 输入：真实本地/NAS pre-release reports。
- 输出：ingestion script、validation、updated final report。
- 禁止事项：不得伪造本地/NAS真实执行通过。
- 是否需要用户本地/NAS：需要未来报告。
- 是否涉及隐私数据：不应包含隐私数据。
- 是否阻塞 UAT：是。
- 是否阻塞生产：是。
