# Car Rental Contract Document Test Plan

## 1. 阶段目标

Contract document test stage 用于在 Codex-only workflow 下补齐合同文档离线检查路线：扫描 `plugin-contract-documents`、`plugin-rental-core`、`nocobase-automation` 和 `test-data/mock/car-rental/` 中合同文档相关入口，验证三语合同模板/占位 metadata、线下签署扫描件 placeholder、司机/车辆/押金/租金/免租日等业务字段覆盖情况，并输出 JSON / Markdown 报告和修改项清单。

本阶段只做离线 dry-run / smoke analysis，不真实连接数据库、不真实生成合同文件、不上传文件、不写 schema、不执行 migration、不启用真实 IOPGPS。

## 2. 当前 Codex-only 执行模式

- workflow_mode: `codex_only`
- stage: `contract_document_test`
- execution_mode: `codex_dry_run`
- production_ready=false
- local_execution_required_pre_release=true
- 当前不要求用户本地运行。
- 正式版前才本地执行真实合同模板、打印、扫描件上传和权限验证。
- mock 数据不得进入生产，mock 数据不能进入生产。

## 3. 当前不真实生成合同文件的原因

1. 合同为线下签署，正式合同可能包含真实司机资料、真实车辆信息、押金与付款记录。
2. 当前不能使用真实司机资料、真实付款截图、真实合同扫描件或真实 GPS / IOPGPS 凭据。
3. 当前不能真实上传文件，也不能提交真实合同扫描件。
4. 本轮不能写 schema 或执行 migration，不能把 mock 数据导入生产。
5. 因此本阶段只检查 placeholder metadata，不生成真实 DOCX/PDF，不输出真实合同文件。

## 4. 已发现合同文档 / 模板 / 打印 / 下载入口

| 入口 | 状态 | 说明 | 证据 |
| --- | --- | --- | --- |
| contract document collection draft | existing | `contract_documents` 草案包含合同、模板、语言、生成文件引用、打印时间、签署时间、扫描件引用和状态字段。 | `packages/plugins/plugin-contract-documents/src/server/collections/contractDocuments.ts` |
| contract template collection draft | existing | `contract_templates` 草案包含模板编号、语言、版本、模板文件引用、默认模板和状态。 | `packages/plugins/plugin-contract-documents/src/server/collections/contractTemplates.ts` |
| three-language template selection | existing | 合同语言枚举包含 `zh-CN`、`en-US`、`fr-FR`。 | `packages/plugins/plugin-contract-documents/src/server/services/contractTemplateService.ts` |
| document generation draft | existing | 生成服务当前构建合同文档草稿和 render context，但不写数据库，不生成真实文件。 | `packages/plugins/plugin-contract-documents/src/server/services/contractDocumentService.ts` |
| print status record | existing | 打印服务记录 printed metadata；真实打印动作不在本轮处理。 | `packages/plugins/plugin-contract-documents/src/server/services/contractPrintService.ts` |
| signed scan file reference | existing | 扫描件服务将 `signed_scan_file` 作为敏感文件引用；本轮仅允许 placeholder。 | `packages/plugins/plugin-contract-documents/src/server/services/contractScanService.ts` |
| lease contract driver/vehicle binding | existing | 租赁合同草案和 fixture 包含 `driver_id`、`vehicle_id`。 | `packages/plugins/plugin-rental-core/src/server/collections/leaseContracts.ts`, `test-data/mock/car-rental/lease-contracts.mock.json` |
| placeholder document fixture | existing | 合同文档 mock 使用 `placeholder://`，且 `real_file_attached=false`。 | `test-data/mock/car-rental/contract-documents.mock.json` |

## 5. 缺失合同文档项

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 真实 DOCX/PDF 文件生成 | missing | 当前没有真实文件生成，本阶段禁止生成真实合同文件。 |
| 真实合同扫描件上传 | missing | 当前仅保留 signed scan placeholder；真实扫描件上传必须在 pre-release local execution 验证。 |
| 下载真实合同文件 | missing | 本阶段不生成真实文件，因此没有真实下载验证。 |
| 完整法律合同正文内容校对 | missing | 当前只做 metadata 和 placeholder dry-run，不伪造三语法律文本已完成。 |

## 6. Planned 合同文档项

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| real DOCX/PDF renderer | planned | 正式版前在隔离环境接入真实模板渲染器。 |
| printable trilingual template content parity review | planned | 正式版前人工校对中文 / 英文 / 法文合同字段一致性。 |
| real signed scan upload workflow | planned | 正式版前验证线下签署扫描件上传、权限和存储策略。 |
| download permission check | planned | 正式版前验证内部员工下载权限和敏感文件保护。 |

## 7. Pending verification 合同文档项

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 模板法务文本准确性 | pending_verification | 需要业务/法务在正式版前确认。 |
| 打印版分页和样式 | pending_verification | 本轮不生成真实文件，无法验证分页、字体和打印布局。 |
| 真实文件存储权限 | pending_verification | 本轮不上传文件，需要 pre-release local execution 验证。 |
| 下载审计日志 | pending_verification | 当前只识别入口，真实审计日志需后续验证。 |

## 8. 合同文档必须覆盖的业务规则

- Chinese contract version。
- English contract version。
- French contract version。
- language field consistency：三语合同内容字段一致。
- contract driver binding：合同对象为司机。
- contract vehicle binding：合同绑定车辆。
- deposit clause：合同包含押金。
- long-term contract clause：合同包含长租合同说明。
- time-bound contract clause：合同包含时限合同说明，时限合同超过 6 个月仍是时限合同。
- natural week rent calculation clause：合同包含自然周租金计算说明。
- selected free-rent days clause：合同包含合同生成时选择的默认免租日说明。
- payment allocation by date clause：合同包含付款按日分配说明。
- deposit collect / offset / refund clause：合同包含押金收取 / 抵扣 / 退还说明。
- deposit not counted as rent income clause：合同包含押金不计入租金收入说明。
- offline signing clause：合同包含线下签署说明，系统不做在线签名。
- no online payment clause：合同不包含在线支付入口，系统不接在线支付。
- no driver login clause：合同不包含司机登录入口。
- document metadata placeholder：合同文档 metadata 使用 placeholder。
- signed scan placeholder：合同扫描件使用 placeholder。
- no real scan files：不提交真实扫描件。

## 9. 禁止事项

- 不真实连接数据库。
- 不真实生成合同文件。
- 不上传文件。
- 不写 schema。
- 不执行 migration。
- 不启用真实 IOPGPS。
- 不使用真实司机资料。
- 不使用真实付款截图。
- 不使用真实合同扫描件。
- 不标记 production_ready。
- mock 数据不得进入生产，mock 数据不能进入生产。
