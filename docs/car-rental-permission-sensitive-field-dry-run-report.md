# Car Rental Permission / Sensitive Field Dry-run Report

- generated_at: 2026-06-11T22:42:15Z
- 当前阶段: permission_sensitive_field
- 执行模式: codex_dry_run
- workflow_mode: codex_only
- production_ready: false
- pre-release local execution required: true

## 当前执行说明

当前为 Codex-only dry-run / codex_mock_report 阶段，当前不要求用户本地运行；正式版前才本地执行 run-full 入口和真实权限注册验证。本报告不连接数据库、不真实注册权限、不创建角色、不真实创建页面、不导入数据、不写 schema、不执行 migration、不启用真实 IOPGPS，不使用真实司机资料、真实付款截图或真实合同扫描件，mock 数据不能进入生产。

## Detected permission entries

| 状态 | 类型 | 插件/模块 | 文件 | 导出/角色/权限入口 |
| --- | --- | --- | --- | --- |
| existing | resource_action | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/actions/actionRegistry.ts` | rentalCoreActionRegistry, ActionDraft, requiredRoles: system_admin, manager, requiredRoles: system_admin, manager, requiredRoles: system_admin, manager, requiredRoles: system_admin, manager, accountant, requiredRoles: system_admin, manager, accountant, requiredRoles: system_admin, manager, accountant, operator, requiredRoles: system_admin, manager, accountant, requiredRoles: system_admin, manager, requiredRoles: system_admin, manager, accountant, requiredRoles: system_admin, manager, accountant |
| existing | collection_resource_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/index.ts` | index.ts |
| existing | collection_resource_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/operationLogs.ts` | operationLogsCollectionDraft |
| existing | visibility_or_acl_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/index.ts` | rentalCorePluginIntegrationPlan, rentalCoreI18nRegistrationNotes |
| existing | permission_registry | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/permissions/permissionRegistry.ts` | rentalCoreSensitiveFields, rentalCorePermissionRegistry, rentalCorePermissionRegistryNotes, RolePermissionDraft |
| existing | plugin_registration_permission_notes | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/pluginRegistration.ts` | createRentalCorePluginRegistrationPlan, rentalCorePluginRegistration, PluginRegistrationDescription |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/billingWeekService.ts` | generateContractBillingWeeks |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/businessNoService.ts` | generateBusinessNo |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/calendarDataService.ts` | getDriverCalendarData, DriverCalendarFilters, GetDriverCalendarDataInput |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/contractAvailabilityService.ts` | checkVehicleContractAvailability |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/depositService.ts` | getDepositAvailableAmount, refreshDepositStatus, createDepositRecord, deductDeposit, refundDeposit, waiveDeposit |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/errors.ts` | throwBusinessError, rentalCoreErrorMessages, rentalCoreErrorCodes, RentalCoreErrorCode |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/index.ts` | index.ts |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/manualAdjustmentService.ts` | manuallyAdjustRentDate |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/operationLogService.ts` | maskSensitiveLogValue, recordOperationLog, buildOperationLogForChange, operationActions |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/permissionFilterService.ts` | canViewCalendarField, getCalendarFieldVisibility, filterCalendarSensitiveData, calendarSensitiveFields |
| existing | service_policy_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/summaryService.ts` | refreshContractFinancialSummary, refreshDriverCalendarSummary |
| existing | visibility_or_acl_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/commonTypes.ts` | ServiceContext, ServiceResult, DateRange, TodoTransactionOptions, ID, Weekday, WeekStartDay |
| existing | visibility_or_acl_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/index.ts` | index.ts |
| existing | filter_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/operationLogTypes.ts` | OperationLog, RecordOperationLogInput, OperationAction |
| existing | permission_plan_automation | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/permissionTypes.ts` | CurrentUserContext, PermissionFilterResult, CurrentUserPermissionContext, CalendarVisibleFields, UserRole, CalendarSensitiveField, CalendarPermissionConfig, CalendarFieldVisibility, RentalRole |
| existing | visibility_or_acl_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/summaryTypes.ts` | SummaryContractLike, ContractFinancialSummary, DriverCalendarSummary, DriverCalendarDay, DriverCalendarData, DriverCalendarDateRange |
| existing | resource_action | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/actions/actionRegistry.ts` | contractDocumentsActionRegistry, ContractDocumentActionDraft, requiredRoles: system_admin, manager, operator, requiredRoles: system_admin, manager, operator, requiredRoles: system_admin, manager, operator, requiredRoles: system_admin, manager |
| existing | collection_resource_candidate | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/collections/contractDocuments.ts` | contractDocumentsCollectionDraft |
| existing | visibility_or_acl_candidate | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/index.ts` | contractDocumentsPluginIntegrationPlan, contractDocumentsI18nRegistrationNotes |
| existing | plugin_registration_permission_notes | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/pluginRegistration.ts` | createContractDocumentsPluginRegistrationPlan, contractDocumentsPluginRegistration, permissions: system_admin/manager/operator 可触发合同文件动作；generated_docx_file、generated_pdf_file、signed_scan_file 必须做服务端权限控制。, |
| existing | service_policy_candidate | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/contractDocumentService.ts` | buildContractRenderContext, buildContractDocumentDraft, generateContractDocuments, buildContractDocumentFileName, validateContractDocument, renderContractDocument |
| existing | service_policy_candidate | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/contractScanService.ts` | validateSignedScanUpload, uploadSignedContractScan, markContractSigned, voidContractDocument |
| existing | service_policy_candidate | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/contractTemplateService.ts` | validateContractLanguage, getContractTemplateByLanguage, validateContractTemplate, selectTemplatesForLanguages, contractLanguages |
| existing | visibility_or_acl_candidate | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/types/contractDocumentTypes.ts` | ContractTemplate, ContractDocument, ContractDocumentGenerationInput, ContractTemplateRenderContext, ContractDocumentGenerationResult, MarkContractPrintedInput, UploadSignedContractScanInput, VoidContractDocumentInput, BuildContractRenderContextInput, TemplateSelectionResult, GenerateContractDocumentsInput, ID |
| existing | resource_action | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/actions/actionRegistry.ts` | iopgpsActionRegistry, IopgpsActionDraft, requiredRoles: system_admin, manager, gps_maintenance, requiredRoles: system_admin, manager, gps_maintenance, requiredRoles: system_admin, manager, gps_maintenance, requiredRoles: system_admin, manager |
| existing | collection_resource_candidate | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/collections/iopgpsSettings.ts` | iopgpsSettingsCollectionDraft |
| existing | visibility_or_acl_candidate | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/index.ts` | iopgpsPluginIntegrationPlan, iopgpsI18nRegistrationNotes |
| existing | plugin_registration_permission_notes | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/pluginRegistration.ts` | createIopgpsPluginRegistrationPlan, iopgpsPluginRegistration, permissions: system_admin/manager/gps_maintenance 可操作 GPS 同步；财务和运营默认不查看 token。 |
| existing | service_policy_candidate | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/errors.ts` | throwIopgpsError, iopgpsErrorMessages, IopgpsErrorCode |
| existing | service_policy_candidate | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/iopgpsErrorLogService.ts` | maskIopgpsSensitiveValue, buildIopgpsErrorLog, safeIopgpsSyncWrapper, recordIopgpsError, iopgpsActions, BuildIopgpsErrorLogInput |
| existing | service_policy_candidate | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/iopgpsTokenService.ts` | isTokenExpired, shouldRefreshToken, buildTokenState, getIopgpsAccessToken |
| existing | visibility_or_acl_candidate | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/types/iopgpsTypes.ts` | IopgpsSettings, IopgpsTokenState, IopgpsRawDeviceStatus, NormalizedGpsStatusResult, GpsLocationSnapshot, GpsDailyMileage, IopgpsErrorLog, IopgpsSyncResult, IopgpsDeviceRef, GpsDeviceStatusLogDraft, VehicleGpsStatusPatch, ID |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/actionPlanNormalizer.ts` | normalizeActionPlan, normalizeActionPlans |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/adapterErrors.ts` | nocobaseAdapterErrorDefinitions, createNocobaseAdapterError, NocobaseAdapterErrorDefinition, NocobaseAdapterErrorCode |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/collectionPlanNormalizer.ts` | normalizeCollectionPlan, normalizeCollectionPlans, extractSensitiveFields, extractUniqueConstraints, extractRelations |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/collectionRegistrationValidator.ts` | CRITICAL_COLLECTIONS, CRITICAL_UNIQUE_CONSTRAINTS, REQUIRED_SENSITIVE_FIELDS, validateCriticalCollections, validateCriticalUniqueConstraints, validateSensitiveFields, validateCollectionRegistrationPlan |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/dryRunExecutor.ts` | dryRunAutomatedRegistration |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/goLiveReadinessEvaluator.ts` | buildGoLiveReadinessGates, evaluateGoLiveReadiness, summarizeGoLiveReadiness, getRequiredGoLiveReadinessGateNames, renderGoLiveReadinessMarkdown, GoLiveReadinessContext |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/index.ts` | index.ts |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/mockCollectionAdapter.ts` | mockCollectionAdapter.ts |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/mockPageAdapter.ts` | mockPageAdapter.ts |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/mockRuntimeAdapter.ts` | mockRuntimeAdapter.ts |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/mockSeedDataAdapter.ts` | mockSeedDataAdapter.ts |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/nocobaseAdapterFactory.ts` | detectNocobaseAdapterMode, createNocobaseAutomationAdapter, assertRealAdapterReady, NocobaseAdapterModeDetectionResult |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/nocobaseEnvironmentInspector.ts` | inspectNocobaseEnvironment, summarizeNocobaseEnvironment |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/nocobaseRealAdapter.ts` | NocobaseRealAdapter |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/pageInitializationExecutor.ts` | dryRunInitializePages, summarizePageInitializationResult |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/pageInitializationPlan.ts` | buildDashboardPagePlan, buildDriverManagementPagePlan, buildVehicleManagementPagePlan, buildContractManagementPagePlan, buildRentLedgerPagePlan, buildRentCalendarPagePlan, buildPaymentPagePlan, buildDepositPagePlan, buildContractDocumentsPagePlan, buildGpsPagePlan, buildPageInitializationPlan, requiredRoles: system_admin, manager, accountant, operator |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/pageInitializationValidator.ts` | REQUIRED_PAGE_NAMES, REQUIRED_PAGE_ACTION_NAMES, validatePageInitializationPlan, validatePageForbiddenPatterns, validateSensitivePageFields, validateRequiredPageActions, validatePageInitialization |
| existing | permission_plan_automation | nocobase-automation | `packages/shared/nocobase-automation/src/permissionPlanNormalizer.ts` | runtimeSensitiveFieldAliases, normalizePermissionPlan, normalizePermissionPlans, extractSensitiveFieldPermissionCoverage |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realBackupRollbackAdapter.ts` | realBackupRollbackAdapter.ts |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realBackupRollbackPlanBuilder.ts` | createRealBackupRollbackContext, buildRealBackupPlan, buildPostRollbackVerificationPlan, buildRealRollbackPlan, buildFailureRecoveryPlans, realBackupTargets, realRollbackTargets, realFailureTypes |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realCollectionRegistrationAdapter.ts` | createDraftAdapterEnvironment, createDefaultRealCollectionRegistrationContext |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realCollectionSchemaMapper.ts` | mapRelationPlanToRealRelationDraft, mapIndexPlanToRealIndexDraft, mapFieldPlanToRealFieldSchemaDraft, mapCollectionPlanToRealSchemaDraft |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realPageRegistrationAdapter.ts` | createDefaultRealPageAdapterEnvironment, createDefaultRealPageRegistrationContext |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realPageSafetyChecker.ts` | validateRealPageSchemaDraft, validateRealPageRegistrationSafety |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realPageSchemaMapper.ts` | mapMenuPlanToRealPageSchemaDraft, mapPagePlanToRealPageSchemaDraft, mapBlockPlanToRealPageSchemaDraft, mapFilterPlanToRealPageSchemaDraft, mapPageActionPlanToRealPageSchemaDraft, requiredRoles: ...menu.requiredRoles, requiredRoles: ...page.requiredRoles, requiredRoles: ...block.requiredRoles, requiredRoles: ...filter.requiredRoles, requiredRoles: ...action.requiredRoles |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realRuntimeRegistrationAdapter.ts` | createDefaultRealRuntimeAdapterEnvironment, createDefaultRealRuntimeRegistrationContext |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realRuntimeSafetyChecker.ts` | validateRealRuntimeRegistrationSafety, validateRealRuntimeSchemaDraft |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realRuntimeSchemaMapper.ts` | mapServicePlanToRealSchemaDraft, mapActionPlanToRealSchemaDraft, mapPermissionPlanToRealSchemaDraft, mapSchedulePlanToRealSchemaDraft, mapI18nPlanToRealSchemaDraft, permissions: ...normalized.permissions |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realSeedDataImportAdapter.ts` | realSeedDataImportAdapter.ts |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realSeedDataSafetyChecker.ts` | validateRealSeedDataImportSafety, validateRealSeedDataSchemaDraft, validateRealSeedDataNoRealData |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realSeedDataSchemaMapper.ts` | extractFileFieldDrafts, extractRelationDrafts, mapSeedDataEntityPlanToRealSchemaDraft, mapSeedDataImportPlanToRealSchemaDraft |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realSmokeTestAdapter.ts` | realSmokeTestAdapter.ts |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realSmokeTestPlanMapper.ts` | createRealSmokeTestContext, mapCollectionPlanToSmokeSteps, mapRuntimePlanToSmokeSteps, mapPagePlanToSmokeSteps, mapSeedDataPlanToSmokeSteps, buildCoreBusinessSmokeSteps, buildPermissionSmokeSteps, buildGpsMockSmokeSteps, buildContractDocumentSmokeSteps, buildFailureIsolationSmokeSteps, buildRollbackSmokeSteps, buildRealSmokeTestPlan |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realSmokeTestSafetyChecker.ts` | validateRealSmokeTestSafety, validateRealSmokeTestPlan, validateRealSmokeTestReportDraft |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/registrationPlan.ts` | sortPluginRegistrations, buildCollectionPlansFromRegistrations, buildPagePlans, buildSmokeTestPlans, buildAutomatedRegistrationPlan, RawPluginRegistration, requiredRoles: system_admin, manager, accountant, requiredRoles: system_admin, manager, accountant, requiredRoles: system_admin, manager, gps_maintenance, requiredRoles: system_admin, manager, gps_maintenance, requiredRoles: system_admin, manager, operator, requiredRoles: system_admin, manager, operator |
| existing | visibility_or_acl_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/registrationValidator.ts` | validateCollectionUniquenessRules, validateSensitiveFieldCoverage, validateAutomatedRegistrationPlan |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/runtimeRegistrationExecutor.ts` | buildRuntimeRegistrationPlanFromAutomatedPlan, dryRunRegisterRuntime, summarizeRuntimeRegistrationResult, permissions: 后续接入真实 NocoBase 服务端权限 |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/runtimeRegistrationValidator.ts` | CORE_SERVICE_NAMES, CORE_ACTION_NAMES, CORE_ROLE_NAMES, validateCoreServiceCoverage, validateCoreActionCoverage, validateRolePermissionCoverage, validateRuntimeForbiddenPatterns, validateRuntimeRegistrationPlan |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/seedDataImportPlan.ts` | seedDataFileByEntity, getDefaultSeedDataImportOrder, buildSeedDataDependencyPlan, buildSeedDataUniqueKeyPlan, buildSeedDataSensitiveFieldPlan, buildSeedDataImportPlan |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/seedDataImportValidator.ts` | validateSeedDataImportPlan, validateSeedDataFilesExist, validateSeedDataReferences, validateSeedDataUniqueKeys, validateNoSensitiveRealData, validateRentLedgerBusinessRules, validatePaymentAllocationBusinessRules, validateDepositBusinessRules, validateGpsMockRules, validateSeedDataForImport, validateSeedDataImportResultBoundaries, SeedDataByEntity |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/servicePlanNormalizer.ts` | normalizeServicePlan, normalizeServicePlans, extractTransactionalServices, coreTransactionalServiceNames |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/smokeTestOrchestrator.ts` | buildSmokeTestPlan, createSmokeTestStepResult, summarizeSmokeTestResult, buildSmokeTestReport, validateSmokeTestPrerequisites |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/types.ts` | RegistrationStep, PluginPlanSummary, CollectionRelationPlan, CollectionFieldPlan, CollectionIndexPlan, NocobaseCollectionPlan, NocobaseServicePlan, NocobasePermissionPlan, NocobaseActionPlan, NocobaseSchedulePlan, NocobaseMenuPlan, NocobaseFilterPlan |
| existing | filter_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/unconfiguredRealAdapter.ts` | createUnconfiguredNocobaseRealAdapter |

## Planned permission entries

| 状态 | permission / visibility | 插件 | 业务规则 |
| --- | --- | --- | --- |
| planned | finance_sensitive_totals_visibility | plugin-rental-core | 总收入、总付款额、未来应收只对财务和管理员可见，普通操作员不可见。 |
| planned | payment_attachment_visibility | plugin-rental-core | 完整付款截图仅财务和管理员可访问，其他角色只可见脱敏状态。 |
| planned | contract_scan_visibility | plugin-contract-documents | 合同扫描件为敏感文件，仅授权业务管理角色可访问。 |
| planned | driver_document_visibility | plugin-rental-core | 司机证件字段必须脱敏，非授权角色不得查看。司机不登录系统。 |
| planned | iopgps_secret_never_exposed | plugin-iopgps | IOPGPS 登录凭据、系统密钥和 token 永不在 UI/API/operation logs 中明文暴露。 |
| planned | gps_raw_track_visibility | plugin-iopgps | 车辆 GPS 原始轨迹仅管理员和 GPS 维护角色可访问；财务默认不可见。 |
| planned | operation_log_redaction_policy | plugin-rental-core/plugin-iopgps/plugin-contract-documents | operation logs 可审计，但必须过滤系统密钥、凭据、真实文件内容和令牌。 |

## Missing permission entries

- 总收入隐藏规则 (plugin-rental-core): 未在当前 server/shared automation 扫描中找到明确真实权限入口；本阶段只记录修改项，不失败退出。
- 系统密钥永不暴露规则 (all): 未在当前 server/shared automation 扫描中找到明确真实权限入口；本阶段只记录修改项，不失败退出。
- online payment 禁止规则 (plugin-rental-core): 未在当前 server/shared automation 扫描中找到明确真实权限入口；本阶段只记录修改项，不失败退出。

## Pending verification entries

- NocoBase ACL API exact registration point: 正式实现前需在完整宿主工程确认 v2.0.61 ACL / resource action / field permission API。
- owner scoped access exact policy: 如后续引入业务 owner 维度，需确认 record permissions 具体接入点。

## Role matrix

| 角色 | 允许 | 禁止 |
| --- | --- | --- |
| operator | 必要操作字段、合同基础状态、车辆基础状态 | 总收入、总付款额、未来应收、完整付款截图、合同扫描件、司机证件、系统密钥、GPS 原始轨迹 |
| finance | 收款、欠款、押金、付款分配状态 | 系统密钥、IOPGPS 登录凭据、车辆 GPS 原始轨迹、司机证件原文 |
| manager | 业务敏感数据、合同扫描件授权查看、司机证件脱敏查看 | 系统密钥明文、IOPGPS 登录凭据明文 |
| system_admin | 业务敏感数据、权限配置后续执行、审计配置 | UI/API 中暴露系统密钥明文、operation logs 中泄露凭据 |
| driver | 无 | 系统登录、司机端权限、customer portal、online payment permission |

## Sensitive field rules

- 非授权角色不得查看总收入。
- 非授权角色不得查看总付款额。
- 非授权角色不得查看未来应收。
- 非授权角色不得查看完整付款截图。
- 非授权角色不得查看合同扫描件。
- 非授权角色不得查看司机证件。
- 非授权角色不得查看 IOPGPS 登录凭据。
- 非授权角色不得查看车辆 GPS 原始轨迹。
- 普通操作员只能看到必要操作字段。
- 财务角色可以查看收款、欠款、押金，但仍不得查看系统密钥。
- 管理员可以查看业务敏感数据，但不得在 UI/API 中暴露系统密钥。
- 司机不登录系统，没有司机端权限。
- 没有 customer portal。
- 没有 online payment permission。
- 押金不计入租金收入。
- 当前欠款不包含未来应收。
- operation logs 可审计，但不得泄露密钥。

## Blockers

- 无 Codex-only dry-run blocker；仍不代表 production_ready。

## Warnings

- 当前不要求用户本地运行；正式版前才本地执行真实权限注册和本地/NAS 隔离验证。
- 本 dry-run 不连接数据库、不真实注册权限、不创建角色、不写 schema、不执行 migration、不启用真实 IOPGPS。
- missing_permission_entries 只记录为修改项，不导致 Codex-only dry-run 失败。
- mock 数据不能进入生产，真实司机资料、真实付款截图、真实合同扫描件均不得用于本阶段。

## modification_items

- 补齐 总收入隐藏规则 的真实权限/字段可见性规则。
- 补齐 系统密钥永不暴露规则 的真实权限/字段可见性规则。
- 补齐 online payment 禁止规则 的真实权限/字段可见性规则。
- 将 planned 权限项 finance_sensitive_totals_visibility 接入真实 ACL / field visibility / resource action。
- 将 planned 权限项 payment_attachment_visibility 接入真实 ACL / field visibility / resource action。
- 将 planned 权限项 contract_scan_visibility 接入真实 ACL / field visibility / resource action。
- 将 planned 权限项 driver_document_visibility 接入真实 ACL / field visibility / resource action。
- 将 planned 权限项 iopgps_secret_never_exposed 接入真实 ACL / field visibility / resource action。
- 将 planned 权限项 gps_raw_track_visibility 接入真实 ACL / field visibility / resource action。
- 将 planned 权限项 operation_log_redaction_policy 接入真实 ACL / field visibility / resource action。
- 正式版前本地/NAS 执行前，需把本 Codex-only dry-run 结果转为真实权限注册验证。
- 继续保持 production_ready=false，直到所有 local_pre_release 权限验证通过。
