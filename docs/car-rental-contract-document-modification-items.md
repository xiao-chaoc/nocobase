# Car Rental Contract Document Modification Items

- workflow_mode: `codex_only`
- stage: `contract_document_test`
- execution_mode: `codex_dry_run`
- production_ready=false
- 当前不要求用户本地运行。
- 正式版前才本地执行真实合同模板、打印、扫描件上传、权限和文件存储验证。
- 当前不启用真实 IOPGPS。
- mock 数据不得进入生产，mock 数据不能进入生产。

| 编号 | 合同文档规则项 | 状态 pass / warning / blocker / missing / pending_verification | 业务规则 | 涉及 fixture | 涉及插件 | 是否阻塞 UAT | 是否阻塞生产 | Codex 修改建议 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CD-001 | Chinese contract version | pass | 必须支持中文合同版本。 | `contract-documents.mock.json` | `plugin-contract-documents` | 否 | 是 | 保留 `zh-CN` template metadata，正式版前补真实模板内容校对。 | JSON report 中 `zh-CN` language coverage 为 true。 | open |
| CD-002 | English contract version | pass | 必须支持英文合同版本。 | `contract-documents.mock.json` | `plugin-contract-documents` | 否 | 是 | 保留 `en-US` template metadata，正式版前补真实模板内容校对。 | JSON report 中 `en-US` language coverage 为 true。 | open |
| CD-003 | French contract version | pass | 必须支持法文合同版本。 | `contract-documents.mock.json` | `plugin-contract-documents` | 否 | 是 | 保留 `fr-FR` template metadata，正式版前补真实模板内容校对。 | JSON report 中 `fr-FR` language coverage 为 true。 | open |
| CD-004 | language field consistency | pending_verification | 三语合同内容字段必须一致。 | `contract-documents.mock.json` | `plugin-contract-documents` | 是 | 是 | 正式版前增加三语模板字段映射校对表。 | 中文 / 英文 / 法文模板字段逐项一致。 | open |
| CD-005 | contract driver binding | pass | 合同对象是司机。 | `lease-contracts.mock.json` | `plugin-rental-core`, `plugin-contract-documents` | 否 | 是 | 保留 `driver_id` 绑定检查。 | 每个合同 fixture 均有 `driver_id`。 | open |
| CD-006 | contract vehicle binding | pass | 合同必须绑定车辆。 | `lease-contracts.mock.json` | `plugin-rental-core`, `plugin-contract-documents` | 否 | 是 | 保留 `vehicle_id` 绑定检查。 | 每个合同 fixture 均有 `vehicle_id`。 | open |
| CD-007 | deposit clause | pass | 合同需要押金。 | `deposit-records.mock.json`, `lease-contracts.mock.json` | `plugin-rental-core` | 否 | 是 | 正式模板中补押金条款全文。 | dry-run field coverage 包含 deposit。 | open |
| CD-008 | long-term contract clause | pass | 支持长租合同。 | `lease-contracts.mock.json` | `plugin-rental-core` | 否 | 是 | 正式模板中保留长租合同说明。 | fixture 覆盖 `open_ended_long_term`。 | open |
| CD-009 | time-bound contract clause | pass | 支持时限合同，超过 6 个月仍为时限合同。 | `lease-contracts.mock.json` | `plugin-rental-core` | 否 | 是 | 正式模板中明确固定期限逻辑。 | fixture 覆盖 `fixed_term`。 | open |
| CD-010 | natural week rent calculation clause | pass | 所有合同按自然周计算租金。 | `rent-daily-ledgers.mock.json` | `plugin-rental-core` | 是 | 是 | 正式模板中增加自然周租金计算描述。 | 模板文本和 dry-run coverage 均覆盖 rent / weekly rule。 | open |
| CD-011 | selected free-rent days clause | pass | 默认免租日来自合同生成时选择。 | `lease-contracts.mock.json`, `rent-daily-ledgers.mock.json` | `plugin-rental-core` | 是 | 是 | 正式模板中列出选择的免租日。 | dry-run coverage 包含 free_rent_day。 | open |
| CD-012 | payment allocation by date clause | pass | 付款按日分配。 | `rent-payment-allocations.mock.json` | `plugin-rental-core` | 是 | 是 | 正式模板中补付款按日分配说明。 | fixture 覆盖 allocation date。 | open |
| CD-013 | deposit collect / offset / refund clause | pass | 押金可收取 / 抵扣 / 退还。 | `deposit-records.mock.json` | `plugin-rental-core` | 是 | 是 | 正式模板中补三类押金事件说明。 | fixture 覆盖 collect / offset / refund。 | open |
| CD-014 | deposit not counted as rent income clause | pass | 押金不计入租金收入。 | `deposit-records.mock.json` | `plugin-rental-core` | 是 | 是 | 正式模板中明确押金不计租金收入。 | deposit records 中 `rent_income=false`。 | open |
| CD-015 | offline signing clause | pass | 合同线下签署，系统不做在线签名。 | `contract-documents.mock.json` | `plugin-contract-documents` | 否 | 是 | 正式模板和流程中保留线下签署说明。 | dry-run coverage 包含 offline_signing。 | open |
| CD-016 | no online payment clause | pass | 系统不接在线支付，合同不包含在线支付入口。 | `mock-manifest.json` | `plugin-contract-documents`, `plugin-rental-core` | 是 | 是 | 继续扫描并阻断在线支付入口。 | dry-run blockers 中无 online payment finding。 | open |
| CD-017 | no driver login clause | pass | 合同不包含司机登录入口。 | `mock-manifest.json` | `plugin-contract-documents`, `plugin-rental-core` | 是 | 是 | 继续扫描并阻断司机登录入口。 | dry-run blockers 中无 driver login finding。 | open |
| CD-018 | document metadata placeholder | pass | 合同文档 metadata 使用 placeholder。 | `contract-documents.mock.json` | `plugin-contract-documents` | 否 | 是 | 保留 `placeholder://` 约束。 | `generated_file_reference` 使用 placeholder。 | open |
| CD-019 | signed scan placeholder | pass | 合同扫描件使用 placeholder。 | `contract-documents.mock.json` | `plugin-contract-documents` | 否 | 是 | 保留 `scan_reference` placeholder。 | `scan_reference` 使用 placeholder。 | open |
| CD-020 | no real scan files | pass | 不提交真实扫描件。 | `contract-documents.mock.json` | `plugin-contract-documents` | 是 | 是 | 继续阻断 `.pdf/.jpg/.png/.docx` 等真实路径。 | `real_file_attached=false` 且无真实文件路径。 | open |
| CD-021 | no real driver private data | pass | 不使用真实司机资料。 | `drivers.mock.json` | `plugin-rental-core` | 是 | 是 | 保持 `MOCK-*` 身份字段和 privacy note。 | fixture 仅包含 mock 司机资料。 | open |
| CD-022 | production guard | pass | production_ready=false，mock 数据不得进入生产。 | `mock-manifest.json` | `nocobase-automation` | 是 | 是 | 保留生产防 mock 门禁，正式版前不得解除。 | dry-run report 中 `production_ready=false`。 | open |
