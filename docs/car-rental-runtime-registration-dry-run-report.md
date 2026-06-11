# Car Rental Runtime Registration Dry-run Report

- generated_at: 2026-06-11T21:37:24Z
- 当前阶段: runtime_registration
- 执行模式: codex_dry_run
- workflow_mode: codex_only
- production_ready: false
- pre-release local execution required: true

## 当前执行说明

当前为 Codex-only dry-run / codex_mock_report 阶段，当前不要求用户本地运行；正式版前才本地执行 run-full 入口和真实 runtime 验证。本报告不连接数据库、不真实注册 runtime、不写 schema、不执行 migration、不启用真实 IOPGPS，不使用真实司机资料、真实付款截图或真实合同扫描件，mock 数据不能进入生产。

## 检测到的 runtime 入口

| 状态 | 类型 | 插件/模块 | 文件 | 导出入口 |
| --- | --- | --- | --- | --- |
| existing | action | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/actions/actionRegistry.ts` | rentalCoreActionRegistry |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/contractBillingWeeks.ts` | contractBillingWeeksCollectionDraft |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/depositRecords.ts` | depositRecordsCollectionDraft |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/drivers.ts` | driversCollectionDraft |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/index.ts` | index |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/leaseContracts.ts` | leaseContractsCollectionDraft |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/operationLogs.ts` | operationLogsCollectionDraft |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/rentAdjustments.ts` | rentAdjustmentsCollectionDraft |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/rentDailyLedgers.ts` | rentDailyLedgersCollectionDraft |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/rentPaymentAllocations.ts` | rentPaymentAllocationsCollectionDraft |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/rentPayments.ts` | rentPaymentsCollectionDraft |
| existing | collection_resource | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/collections/vehicles.ts` | vehiclesCollectionDraft |
| existing | runtime_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/index.ts` | rentalCorePluginIntegrationPlan, rentalCoreI18nRegistrationNotes |
| existing | permission | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/permissions/permissionRegistry.ts` | rentalCoreSensitiveFields, rentalCorePermissionRegistry, rentalCorePermissionRegistryNotes |
| existing | plugin_registration | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/pluginRegistration.ts` | createRentalCorePluginRegistrationPlan, rentalCorePluginRegistration |
| existing | schedule | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/schedules/scheduleRegistry.ts` | rentalCoreScheduleRegistry |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/billingRuleService.ts` | validateWeeklyPayableDays, validateDefaultFreeWeekdays, isDefaultFreeWeekday, applyDefaultFreeDays |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/billingWeekService.ts` | generateContractBillingWeeks |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/businessNoService.ts` | generateBusinessNo |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/calendarDataService.ts` | getDriverCalendarData |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/contractAvailabilityService.ts` | checkVehicleContractAvailability |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/contractLifecycleService.ts` | createLeaseContractDraft, activateLeaseContract |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/dateBillingUtils.ts` | getNaturalWeekRange, eachDateBetween, getWeekday, addMonthsClamped, calculateFixedTermEndDate, addDaysForBilling, compareBillingDate |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/depositService.ts` | getDepositAvailableAmount, refreshDepositStatus, createDepositRecord, deductDeposit, refundDeposit, waiveDeposit |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/errors.ts` | throwBusinessError, rentalCoreErrorMessages, rentalCoreErrorCodes |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/index.ts` | index |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/ledgerGenerationService.ts` | buildDailyLedgerForDate, generateFixedTermDailyLedgerPreview, generateOpenEndedDailyLedgerPreview, summarizeLedgerPreview, generateFixedTermDailyLedgers, ensureOpenEndedDailyLedgers |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/ledgerStatusService.ts` | refreshLedgerPaymentStatus |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/manualAdjustmentService.ts` | manuallyAdjustRentDate |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/operationLogService.ts` | maskSensitiveLogValue, recordOperationLog, buildOperationLogForChange, operationActions |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/paymentAllocationService.ts` | createRentPaymentDraft, validateNoOverpayment, validatePaymentAllocations, confirmRentPayment, allocateRentPayment, createRentPayment |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/paymentReversalService.ts` | reverseRentPayment |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/permissionFilterService.ts` | canViewCalendarField, getCalendarFieldVisibility, filterCalendarSensitiveData, calendarSensitiveFields |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/shortfallService.ts` | markShortfallAsDebt, markShortfallAsDispute, markShortfallAsPendingWaiver, markShortfallDisposition |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/summaryService.ts` | refreshContractFinancialSummary, refreshDriverCalendarSummary |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/unpaidReasonService.ts` | validateUnpaidReason, markUnpaidReason |
| existing | service | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/services/waiverService.ts` | requestRentWaiver, approveRentWaiver, rejectRentWaiver |
| existing | server_export | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/commonTypes.ts` | commonTypes |
| existing | server_export | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/contractTypes.ts` | contractTypes |
| existing | server_export | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/depositTypes.ts` | depositTypes |
| existing | server_export | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/index.ts` | index |
| existing | server_export | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/ledgerTypes.ts` | ledgerTypes |
| existing | server_export | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/operationLogTypes.ts` | operationLogTypes |
| existing | server_export | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/paymentTypes.ts` | paymentTypes |
| existing | runtime_candidate | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/permissionTypes.ts` | permissionTypes |
| existing | server_export | plugin-rental-core | `packages/plugins/plugin-rental-core/src/server/types/summaryTypes.ts` | summaryTypes |
| existing | action | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/actions/actionRegistry.ts` | contractDocumentsActionRegistry |
| existing | collection_resource | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/collections/contractDocuments.ts` | contractDocumentsCollectionDraft |
| existing | collection_resource | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/collections/contractTemplates.ts` | contractTemplatesCollectionDraft |
| existing | collection_resource | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/collections/index.ts` | index |
| existing | server_export | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/index.ts` | contractDocumentsPluginIntegrationPlan, contractDocumentsI18nRegistrationNotes |
| existing | plugin_registration | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/pluginRegistration.ts` | createContractDocumentsPluginRegistrationPlan, contractDocumentsPluginRegistration |
| existing | service | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/contractDocumentService.ts` | buildContractRenderContext, buildContractDocumentDraft, generateContractDocuments, buildContractDocumentFileName, validateContractDocument, renderContractDocument |
| existing | service | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/contractDocumentStatusService.ts` | canTransitionContractDocumentStatus, assertContractDocumentStatusTransition, getContractSignatureStatusFromDocuments |
| existing | service | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/contractPrintService.ts` | validatePrintableDocument, buildPrintRecordPatch, markContractPrinted |
| existing | service | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/contractScanService.ts` | validateSignedScanUpload, uploadSignedContractScan, markContractSigned, voidContractDocument |
| existing | service | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/contractTemplateService.ts` | validateContractLanguage, getContractTemplateByLanguage, validateContractTemplate, selectTemplatesForLanguages, contractLanguages |
| existing | service | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/errors.ts` | throwContractDocumentError, contractDocumentErrorMessages |
| existing | service | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/services/index.ts` | index |
| existing | server_export | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/types/contractDocumentTypes.ts` | contractDocumentTypes |
| existing | server_export | plugin-contract-documents | `packages/plugins/plugin-contract-documents/src/server/types/index.ts` | index |
| existing | action | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/actions/actionRegistry.ts` | iopgpsActionRegistry |
| existing | collection_resource | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/collections/gpsDailyMileages.ts` | gpsDailyMileagesCollectionDraft |
| existing | collection_resource | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/collections/gpsDeviceBindings.ts` | gpsDeviceBindingsCollectionDraft |
| existing | collection_resource | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/collections/gpsDeviceStatusLogs.ts` | gpsDeviceStatusLogsCollectionDraft |
| existing | collection_resource | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/collections/gpsDevices.ts` | gpsDevicesCollectionDraft |
| existing | collection_resource | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/collections/gpsLocationSnapshots.ts` | gpsLocationSnapshotsCollectionDraft |
| existing | collection_resource | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/collections/index.ts` | index |
| existing | collection_resource | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/collections/iopgpsSettings.ts` | iopgpsSettingsCollectionDraft |
| existing | runtime_candidate | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/index.ts` | iopgpsPluginIntegrationPlan, iopgpsI18nRegistrationNotes |
| existing | plugin_registration | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/pluginRegistration.ts` | createIopgpsPluginRegistrationPlan, iopgpsPluginRegistration |
| existing | schedule | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/schedules/scheduleRegistry.ts` | iopgpsScheduleRegistry |
| existing | service | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/errors.ts` | throwIopgpsError, iopgpsErrorMessages |
| existing | service | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/index.ts` | index |
| existing | service | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/iopgpsDeviceStatusService.ts` | buildGpsDeviceStatusLog, buildVehicleGpsStatusPatch, syncIopgpsDeviceStatus |
| existing | service | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/iopgpsErrorLogService.ts` | maskIopgpsSensitiveValue, buildIopgpsErrorLog, safeIopgpsSyncWrapper, recordIopgpsError, iopgpsActions |
| existing | service | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/iopgpsLocationService.ts` | buildGpsLocationSnapshot, buildVehicleLocationPatch, syncIopgpsLocation |
| existing | service | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/iopgpsMileageService.ts` | buildMileageSyncKey, buildGpsDailyMileage, syncIopgpsDailyMileage |
| existing | service | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/iopgpsNormalizeService.ts` | mapNormalizedStatusToVehicleGpsStatus, normalizeIopgpsStatus |
| existing | service | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/services/iopgpsTokenService.ts` | isTokenExpired, shouldRefreshToken, buildTokenState, getIopgpsAccessToken |
| existing | server_export | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/types/index.ts` | index |
| existing | server_export | plugin-iopgps | `packages/plugins/plugin-iopgps/src/server/types/iopgpsTypes.ts` | iopgpsTypes |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/actionPlanNormalizer.ts` | normalizeActionPlan, normalizeActionPlans |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/adapterErrors.ts` | nocobaseAdapterErrorDefinitions, createNocobaseAdapterError |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/collectionPlanNormalizer.ts` | normalizeCollectionPlan, normalizeCollectionPlans, extractSensitiveFields, extractUniqueConstraints, extractRelations |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/collectionRegistrationExecutor.ts` | buildCollectionRegistrationPlanFromAutomatedPlan, dryRunRegisterCollections, summarizeCollectionRegistrationResult |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/collectionRegistrationValidator.ts` | CRITICAL_COLLECTIONS, CRITICAL_UNIQUE_CONSTRAINTS, REQUIRED_SENSITIVE_FIELDS, validateCriticalCollections, validateCriticalUniqueConstraints, validateSensitiveFields, validateCollectionRegistrationPlan |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/dryRunExecutor.ts` | dryRunAutomatedRegistration |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/goLiveReadinessEvaluator.ts` | buildGoLiveReadinessGates, evaluateGoLiveReadiness, summarizeGoLiveReadiness, getRequiredGoLiveReadinessGateNames, renderGoLiveReadinessMarkdown |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/i18nPlanNormalizer.ts` | requiredRuntimeLanguages, normalizeI18nPlan, normalizeI18nPlans |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/index.ts` | index |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/mockCollectionAdapter.ts` | mockCollectionAdapter |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/mockPageAdapter.ts` | mockPageAdapter |
| existing | runtime_automation | nocobase-automation | `packages/shared/nocobase-automation/src/mockRuntimeAdapter.ts` | mockRuntimeAdapter |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/mockSeedDataAdapter.ts` | mockSeedDataAdapter |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/nocobaseAdapterFactory.ts` | detectNocobaseAdapterMode, createNocobaseAutomationAdapter, assertRealAdapterReady |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/nocobaseEnvironmentInspector.ts` | inspectNocobaseEnvironment, summarizeNocobaseEnvironment |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/nocobaseRealAdapter.ts` | nocobaseRealAdapter |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/pageInitializationExecutor.ts` | dryRunInitializePages, summarizePageInitializationResult |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/pageInitializationPlan.ts` | buildDashboardPagePlan, buildDriverManagementPagePlan, buildVehicleManagementPagePlan, buildContractManagementPagePlan, buildRentLedgerPagePlan, buildRentCalendarPagePlan, buildPaymentPagePlan, buildDepositPagePlan, buildContractDocumentsPagePlan, buildGpsPagePlan, buildPageInitializationPlan |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/pageInitializationValidator.ts` | REQUIRED_PAGE_NAMES, REQUIRED_PAGE_ACTION_NAMES, validatePageInitializationPlan, validatePageForbiddenPatterns, validateSensitivePageFields, validateRequiredPageActions, validatePageInitialization |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/permissionPlanNormalizer.ts` | runtimeSensitiveFieldAliases, normalizePermissionPlan, normalizePermissionPlans, extractSensitiveFieldPermissionCoverage |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/realBackupRollbackAdapter.ts` | realBackupRollbackAdapter |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realBackupRollbackPlanBuilder.ts` | createRealBackupRollbackContext, buildRealBackupPlan, buildPostRollbackVerificationPlan, buildRealRollbackPlan, buildFailureRecoveryPlans, realBackupTargets, realRollbackTargets, realFailureTypes |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/realBackupRollbackSafetyChecker.ts` | validateRealBackupRollbackSafety, validateRealBackupPlan, validateRealRollbackPlan, validateFailureRecoveryPlans |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realCollectionRegistrationAdapter.ts` | createDraftAdapterEnvironment, createDefaultRealCollectionRegistrationContext |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/realCollectionSafetyChecker.ts` | validateRealCollectionSchemaDraft, validateRealCollectionRegistrationSafety |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/realCollectionSchemaMapper.ts` | mapRelationPlanToRealRelationDraft, mapIndexPlanToRealIndexDraft, mapFieldPlanToRealFieldSchemaDraft, mapCollectionPlanToRealSchemaDraft |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realPageRegistrationAdapter.ts` | createDefaultRealPageAdapterEnvironment, createDefaultRealPageRegistrationContext |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realPageSafetyChecker.ts` | validateRealPageSchemaDraft, validateRealPageRegistrationSafety |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realPageSchemaMapper.ts` | mapMenuPlanToRealPageSchemaDraft, mapPagePlanToRealPageSchemaDraft, mapBlockPlanToRealPageSchemaDraft, mapFilterPlanToRealPageSchemaDraft, mapPageActionPlanToRealPageSchemaDraft |
| existing | runtime_automation | nocobase-automation | `packages/shared/nocobase-automation/src/realRuntimeRegistrationAdapter.ts` | createDefaultRealRuntimeAdapterEnvironment, createDefaultRealRuntimeRegistrationContext |
| existing | runtime_automation | nocobase-automation | `packages/shared/nocobase-automation/src/realRuntimeSafetyChecker.ts` | validateRealRuntimeRegistrationSafety, validateRealRuntimeSchemaDraft |
| existing | runtime_automation | nocobase-automation | `packages/shared/nocobase-automation/src/realRuntimeSchemaMapper.ts` | mapServicePlanToRealSchemaDraft, mapActionPlanToRealSchemaDraft, mapPermissionPlanToRealSchemaDraft, mapSchedulePlanToRealSchemaDraft, mapI18nPlanToRealSchemaDraft |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realSeedDataImportAdapter.ts` | realSeedDataImportAdapter |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/realSeedDataSafetyChecker.ts` | validateRealSeedDataImportSafety, validateRealSeedDataSchemaDraft, validateRealSeedDataNoRealData |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realSeedDataSchemaMapper.ts` | extractFileFieldDrafts, extractRelationDrafts, mapSeedDataEntityPlanToRealSchemaDraft, mapSeedDataImportPlanToRealSchemaDraft |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/realSmokeTestAdapter.ts` | realSmokeTestAdapter |
| existing | runtime_candidate | nocobase-automation | `packages/shared/nocobase-automation/src/realSmokeTestPlanMapper.ts` | createRealSmokeTestContext, mapCollectionPlanToSmokeSteps, mapRuntimePlanToSmokeSteps, mapPagePlanToSmokeSteps, mapSeedDataPlanToSmokeSteps, buildCoreBusinessSmokeSteps, buildPermissionSmokeSteps, buildGpsMockSmokeSteps, buildContractDocumentSmokeSteps, buildFailureIsolationSmokeSteps, buildRollbackSmokeSteps, buildRealSmokeTestPlan |
| existing | server_export | nocobase-automation | `packages/shared/nocobase-automation/src/realSmokeTestSafetyChecker.ts` | validateRealSmokeTestSafety, validateRealSmokeTestPlan, validateRealSmokeTestReportDraft |

## Planned runtime 入口

| 状态 | runtime | 插件 | 业务规则 |
| --- | --- | --- | --- |
| planned | contract_creation_runtime | plugin-rental-core | 合同创建需校验司机、车辆、长租/时限合同规则，激活后才能生成台账。 |
| planned | natural_week_ledger_generation_runtime | plugin-rental-core | 按自然周生成租金台账，支持默认免租日；每日台账为唯一事实来源。 |
| planned | payment_daily_allocation_runtime | plugin-rental-core | 付款必须分配到具体日期，单日不可超付，整笔分配失败需整体失败。 |
| planned | deposit_lifecycle_runtime | plugin-rental-core | 押金收取、抵扣、退还与租金收入隔离。 |
| planned | shortfall_calculation_runtime | plugin-rental-core | 当前欠款不包含未来应收，并保留未付原因。 |
| planned | contract_document_generation_runtime | plugin-contract-documents | 只在后续真实执行中生成合同文件，本阶段不生成真实合同。 |
| planned | iopgps_mock_sync_runtime | plugin-iopgps | IOPGPS 真实同步默认禁用，仅允许 mock sync 与错误日志隔离。 |
| planned | operation_log_runtime | plugin-rental-core | 关键动作写 operation logs，并对敏感字段脱敏。 |
| planned | permission_check_runtime_placeholder | plugin-rental-core | 权限和敏感字段阶段补齐真实权限校验。 |
| planned | page_action_runtime_placeholder | plugin-rental-core | 页面、菜单、区块初始化阶段补齐页面动作绑定。 |

## 缺失 runtime 入口

- 本次扫描未发现必须失败的缺失项；真实 runtime 仍需后续 pre-release local execution 验证。

## Blockers

- 无 Codex-only dry-run blocker；仍不代表 production_ready。

## Warnings

- 当前 Codex-only 阶段不要求用户本地运行；正式版前才进行本地/NAS 隔离执行。
- 本 dry-run 不连接数据库、不注册真实 runtime、不写 schema、不执行 migration。

## modification_items

- 将 Codex-only planned runtime 转换为真实 NocoBase service/action/permission 注册前，需增加本地 pre-release 验证。
- 权限与敏感字段测试阶段需继续验证 permission placeholder。
- 页面动作 runtime placeholder 需在页面 / 菜单 / 区块阶段绑定。
