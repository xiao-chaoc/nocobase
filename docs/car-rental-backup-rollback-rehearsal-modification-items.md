# Car Rental Backup / rollback rehearsal modification items

当前不要求用户本地运行；正式版前才本地执行真实 backup / restore / rollback rehearsal。当前没有有效本地 dump，不得引用已删除的本地 NAS dump 作为当前有效备份。dump / SQL / filled request 不得提交。production_ready=false。

| 编号 | 备份/回滚规则项 | 状态 pass / warning / blocker / missing / pending_verification | 业务规则 | 涉及脚本 | 涉及文档 | 是否阻塞 UAT | 是否阻塞生产 | Codex 修改建议 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BRR-001 | backup script exists | pass | Collection 注册前必须可生成隔离测试库备份。 | `scripts/car-rental/backup-collection-test-db.sh` | `docs/car-rental-collection-test-db-setup.md` | 否 | 是 | 保持脚本并纳入 rehearsal dry-run 扫描。 | dry-run report 检测到 backup entry。 | done |
| BRR-002 | restore script exists | pass | 回滚必须有隔离测试库 restore 入口。 | `scripts/car-rental/restore-collection-test-db.sh` | `docs/car-rental-real-collection-execute-rollback.md` | 否 | 是 | 保持脚本并纳入 rehearsal dry-run 扫描。 | dry-run report 检测到 restore entry。 | done |
| BRR-003 | backup uses isolated_test_database | pass | 备份只允许隔离测试库。 | `backup-collection-test-db.sh` | `.env.car-rental-collection-test.example` | 否 | 是 | 保持 `CAR_RENTAL_DATABASE_SAFETY_LABEL=isolated_test_database`。 | 缺失该标识时脚本失败。 | done |
| BRR-004 | restore uses isolated_test_database | pass | 恢复只允许隔离测试库。 | `restore-collection-test-db.sh` | `.env.car-rental-collection-test.example` | 否 | 是 | 保持恢复脚本 safety label 校验。 | 缺失该标识时脚本失败。 | done |
| BRR-005 | backup rejects production database | pass | 生产库禁止备份演练。 | `backup-collection-test-db.sh` | 本文档 | 是 | 是 | 保持 prod/production/live 拒绝规则。 | 生产标识触发停止。 | done |
| BRR-006 | restore rejects production database | pass | 生产库禁止恢复演练。 | `restore-collection-test-db.sh` | 本文档 | 是 | 是 | 保持 prod/production/live 拒绝规则。 | 生产标识触发停止。 | done |
| BRR-007 | backup artifact is ignored by Git | pass | backup dump 不得提交。 | `.gitignore` | 本文档 | 否 | 是 | 保持 `backups-test/` 和 `*.dump` ignore。 | Git ignore 覆盖备份 artifact。 | done |
| BRR-008 | SQL dump is ignored by Git | pass | SQL dump 不得提交。 | `.gitignore` | 本文档 | 否 | 是 | 保持 `*.sql` ignore。 | Git ignore 覆盖 SQL dump。 | done |
| BRR-009 | filled request is ignored by Git | pass | filled request 可能含本地路径和人工确认，不得提交。 | `.gitignore` | `docs/car-rental-real-collection-execute-request-checklist.md` | 否 | 是 | 保持 filled request ignore。 | filled request 不进入 Git。 | done |
| BRR-010 | restore requires manual YES | pass | 恢复必须人工确认，避免误恢复。 | `restore-collection-test-db.sh` | `docs/car-rental-real-collection-execute-rollback.md` | 是 | 是 | 保持 `YES` prompt。 | 未输入 YES 时恢复停止。 | done |
| BRR-011 | rollback drill document exists | pass | 回滚演练必须有人工 runbook。 | - | `docs/car-rental-real-collection-execute-rollback-drill.md` | 否 | 是 | 维护并链接到新 rehearsal plan。 | 文档存在并被校验脚本检查。 | done |
| BRR-012 | collection registration failure rollback | pass | Collection 注册失败必须恢复到备份点。 | `execute-real-collection-registration.ts`, `restore-collection-test-db.sh` | `docs/car-rental-real-collection-execute-rollback.md` | 是 | 是 | 保持 rollback command reference。 | 报告包含场景覆盖。 | done |
| BRR-013 | post-validate failure rollback | pass | post-validate 失败必须停止并回滚。 | `post-validate-real-collection-registration.ts` | `docs/car-rental-real-collection-execute-rollback-drill.md` | 是 | 是 | 在正式版前本地执行时补充真实验证结果。 | 报告包含场景覆盖。 | done |
| BRR-014 | runtime registration failure rollback | warning | Runtime 注册失败必须恢复测试库和 runtime registry。 | `run-isolated-runtime-registration-test.sh` | `docs/car-rental-runtime-registration-plan.md` | 是 | 是 | 正式版前接入真实 Runtime 回滚验证。 | local_pre_release 有真实验证结果。 | planned |
| BRR-015 | permission initialization failure rollback | warning | 权限初始化失败必须恢复。 | `run-isolated-permission-sensitive-field-test.sh` | `docs/car-rental-permission-sensitive-field-test-plan.md` | 是 | 是 | 正式版前接入真实权限回滚验证。 | local_pre_release 有真实验证结果。 | planned |
| BRR-016 | page initialization failure rollback | warning | 页面/菜单/区块初始化失败必须恢复。 | `run-isolated-page-menu-block-test.sh` | `docs/car-rental-page-menu-block-initialization-plan.md` | 是 | 是 | 正式版前接入真实页面回滚验证。 | local_pre_release 有真实验证结果。 | planned |
| BRR-017 | mock data import failure rollback | warning | mock 导入失败必须恢复，mock 数据不能进入生产。 | `run-isolated-mock-data-import-test.sh` | `docs/car-rental-mock-data-import-plan.md` | 是 | 是 | 正式版前接入真实 mock 导入回滚验证。 | local_pre_release 有真实验证结果。 | planned |
| BRR-018 | business smoke failure rollback | warning | 业务 smoke 失败必须恢复并保留报告。 | `run-isolated-business-smoke-test.sh` | `docs/car-rental-business-smoke-test-plan.md` | 是 | 是 | 正式版前接入真实业务 smoke 回滚验证。 | local_pre_release 有真实验证结果。 | planned |
| BRR-019 | contract document failure rollback | warning | 合同文档失败不得留下真实扫描件或测试残留。 | `run-isolated-contract-document-test.sh` | `docs/car-rental-contract-document-test-plan.md` | 是 | 是 | 正式版前使用安全本地文件验证。 | local_pre_release 有真实验证结果。 | planned |
| BRR-020 | GPS mock failure rollback | warning | GPS mock 失败不得启用真实 IOPGPS。 | `run-isolated-gps-mock-test.sh` | `docs/car-rental-gps-mock-test-plan.md` | 是 | 是 | 正式版前接入 GPS mock 回滚验证。 | local_pre_release 有真实验证结果。 | planned |
| BRR-021 | IOPGPS unexpected enabled rollback | pass | `IOPGPS_SYNC_ENABLED=true` 时必须停止并回滚。 | backup / restore / run-full | `docs/car-rental-gps-mock-test-plan.md` | 是 | 是 | 保持 `IOPGPS_SYNC_ENABLED=false` 门禁。 | 意外启用时停止。 | done |
| BRR-022 | privacy data exposure stop condition | warning | 发现真实隐私数据时停止。 | future pre-release checker | `docs/car-rental-safe-mock-fixture-spec.md` | 是 | 是 | Production init guard 阶段补充隐私数据导入前检查。 | 真实隐私数据不会进入 Git 或 mock fixture。 | planned |
| BRR-023 | production database stop condition | pass | 发现生产库标识时停止。 | backup / restore / run-full | 本文档 | 是 | 是 | 保持 prod/production/live 拒绝规则。 | 生产库标识触发停止。 | done |
| BRR-024 | production_ready remains false | pass | 当前仍不是 production_ready。 | all Codex reports | all Codex docs | 是 | 是 | 保持报告 `production_ready=false`。 | 所有新报告均为 false。 | done |

## 当前结论

- Backup/rollback rehearsal 阶段已建立 dry-run 阶段，仍需后续真实 pre-release 本地验证。
- 当前不要求用户本地运行。
- 正式版前才本地执行真实 backup dump 生成、restore 和 rollback drill。
- 当前没有有效本地 dump。
- dump / SQL / filled request 不得提交。
- 下一优先级：Production init guard stage。
