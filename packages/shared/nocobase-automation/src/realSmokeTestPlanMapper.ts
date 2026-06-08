/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  NocobaseAdapterEnvironment,
  RealCollectionRegistrationPlan,
  RealPageRegistrationPlan,
  RealRuntimeRegistrationPlan,
  RealSeedDataImportPlan,
  RealSmokeTestContext,
  RealSmokeTestPlan,
  RealSmokeTestPlanInput,
  RealSmokeTestStage,
  RealSmokeTestStepDraft,
} from './types';

const allStages: RealSmokeTestStage[] = [
  'environment_check',
  'plugin_installation_check',
  'collection_registration_check',
  'runtime_registration_check',
  'page_registration_check',
  'seed_data_import_check',
  'core_business_flow_check',
  'permission_check',
  'contract_document_check',
  'gps_mock_check',
  'failure_isolation_check',
  'rollback_check',
  'report_generation',
];

const disabledEnvironment: NocobaseAdapterEnvironment = {
  mode: 'dry_run',
  status: 'configured',
  hasNocobaseApp: false,
  hasDatabaseConnection: false,
  hasLogger: false,
  hasFileStorage: false,
  hasPluginManager: false,
  hasAcl: false,
  hasUiSchema: false,
  hasScheduler: false,
  hasWorkflow: false,
  warnings: ['当前 smoke test 草案不连接真实 NocoBase。'],
  errors: [],
};

export function createRealSmokeTestContext(context: Partial<RealSmokeTestContext> = {}): RealSmokeTestContext {
  return {
    mode: context.mode ?? 'plan_only',
    adapterEnvironment: context.adapterEnvironment ?? disabledEnvironment,
    allowRealExecution: context.allowRealExecution ?? false,
    requireBackup: context.requireBackup ?? true,
    requireRollbackPlan: context.requireRollbackPlan ?? true,
    requireIsolatedDatabase: context.requireIsolatedDatabase ?? true,
    requireMockDataOnly: context.requireMockDataOnly ?? true,
    requireIopgpsDisabled: context.requireIopgpsDisabled ?? true,
    operator: context.operator ?? 'codex-web-draft',
    notes: context.notes ?? ['只生成真实 Smoke Test 草案，不执行真实测试。'],
  };
}

function step(
  input: Omit<RealSmokeTestStepDraft, 'mode' | 'required' | 'canExecute' | 'warnings' | 'errors'> & {
    mode?: RealSmokeTestStepDraft['mode'];
    required?: boolean;
    canExecute?: boolean;
    warnings?: string[];
    errors?: string[];
  },
): RealSmokeTestStepDraft {
  return {
    mode: input.mode ?? 'plan_only',
    required: input.required ?? true,
    canExecute: input.canExecute ?? false,
    warnings: input.warnings ?? ['当前仅生成草案步骤，未连接真实 NocoBase。'],
    errors: input.errors ?? [],
    ...input,
  };
}

const smoke = (
  name: string,
  title: string,
  stage: RealSmokeTestStage,
  sourcePlan: string,
  plannedAction: string,
  expectedResult: string,
  verificationMethod = '读取草案计划并进行静态校验。',
  rollbackRequired = false,
): RealSmokeTestStepDraft =>
  step({ name, title, stage, sourcePlan, plannedAction, expectedResult, verificationMethod, rollbackRequired });

export function mapCollectionPlanToSmokeSteps(
  realCollectionPlan?: RealCollectionRegistrationPlan,
): RealSmokeTestStepDraft[] {
  const warnings = realCollectionPlan ? [] : ['缺少真实 Collection 注册计划，请先生成对应草案。'];
  return [
    smoke(
      'collection_required_collections',
      '检查关键 Collection 是否计划注册',
      'collection_registration_check',
      'real-collection-registration-plan',
      '核对司机、车辆、合同、每日租金台账、付款、押金、合同文件和 GPS mock 相关 Collection 草案。',
      '关键 Collection 均只处于计划注册状态，不创建真实 Collection。',
    ),
    smoke(
      'collection_unique_constraints',
      '检查唯一约束',
      'collection_registration_check',
      'real-collection-registration-plan',
      '核对车牌、合同编号、付款编号、日期台账等唯一约束草案。',
      '唯一约束存在且未执行真实 migration。',
    ),
    smoke(
      'collection_sensitive_fields',
      '检查敏感字段',
      'collection_registration_check',
      'real-collection-registration-plan',
      '核对证件、付款截图、押金、GPS 凭据、合同扫描件等敏感字段标记。',
      '敏感字段已在草案中标记并进入权限验证。',
    ),
    smoke(
      'collection_relations',
      '检查 relation',
      'collection_registration_check',
      'real-collection-registration-plan',
      '核对合同绑定具体车牌、台账绑定合同、付款分配到具体日期等 relation 草案。',
      'relation 只作为草案存在，不写数据库。',
    ),
    smoke(
      'collection_forbidden_business_boundary',
      '检查不含短租、司机登录、按车型出租',
      'collection_registration_check',
      'real-collection-registration-plan',
      '静态扫描 Collection 草案，确认不包含禁用业务。',
      '不出现短租预订、司机登录、按车型出租相关结构。',
    ),
  ].map((item) => ({ ...item, warnings: [...item.warnings, ...warnings] }));
}

export function mapRuntimePlanToSmokeSteps(realRuntimePlan?: RealRuntimeRegistrationPlan): RealSmokeTestStepDraft[] {
  const warnings = realRuntimePlan ? [] : ['缺少真实 Runtime 注册计划，请先生成对应草案。'];
  return [
    smoke(
      'runtime_core_services',
      '检查核心服务存在',
      'runtime_registration_check',
      'real-runtime-registration-plan',
      '核对合同、台账、付款、押金、GPS mock 和合同文件服务草案。',
      '核心服务存在但不注册真实服务。',
    ),
    smoke(
      'runtime_actions',
      '检查动作存在',
      'runtime_registration_check',
      'real-runtime-registration-plan',
      '核对创建合同、分配付款、冲正、押金处理、GPS 同步 mock、合同文件生成草案动作。',
      '动作只用于计划验证。',
    ),
    smoke(
      'runtime_six_roles',
      '检查六个角色',
      'runtime_registration_check',
      'real-runtime-registration-plan',
      '核对 admin、finance、operator、manager、gps_maintenance、auditor 六类角色策略。',
      '六类角色权限草案存在。',
    ),
    smoke(
      'runtime_i18n_three_languages',
      '检查 i18n 三语言',
      'runtime_registration_check',
      'real-runtime-registration-plan',
      '核对中文、英文、法文语言资源草案。',
      '三语言资源计划完整。',
    ),
    smoke(
      'runtime_iopgps_disabled',
      '检查 IOPGPS 定时任务默认不真实启用',
      'runtime_registration_check',
      'real-runtime-registration-plan',
      '核对 IOPGPS 同步任务在草案中默认禁用真实调用。',
      '不会调用真实 IOPGPS。',
    ),
    smoke(
      'runtime_sensitive_permission_policy',
      '检查权限敏感字段策略',
      'runtime_registration_check',
      'real-runtime-registration-plan',
      '核对总已付、未来应收、押金、付款截图、合同扫描件、GPS 凭据字段策略。',
      '敏感字段策略进入权限 smoke test。',
    ),
  ].map((item) => ({ ...item, warnings: [...item.warnings, ...warnings] }));
}

export function mapPagePlanToSmokeSteps(realPagePlan?: RealPageRegistrationPlan): RealSmokeTestStepDraft[] {
  const warnings = realPagePlan ? [] : ['缺少真实 Page 注册计划，请先生成对应草案。'];
  const pages = [
    ['page_drivers', '检查司机管理页面'],
    ['page_vehicles', '检查车辆管理页面'],
    ['page_contracts', '检查合同管理页面'],
    ['page_daily_ledgers', '检查每日租金台账页面'],
    ['page_collection_calendar', '检查收租日历页面'],
    ['page_payments', '检查付款页面'],
    ['page_deposits', '检查押金页面'],
    ['page_contract_documents', '检查合同文件页面'],
    ['page_gps', '检查 GPS 页面'],
    ['page_sensitive_visibility', '检查敏感字段页面可见性'],
  ];
  return pages
    .map(([name, title]) =>
      smoke(
        name,
        title,
        'page_registration_check',
        'real-page-registration-plan',
        `${title} 草案，确认只规划菜单、页面、区块、筛选器和动作。`,
        '页面草案可静态校验，但不创建真实页面。',
      ),
    )
    .map((item) => ({ ...item, warnings: [...item.warnings, ...warnings] }));
}

export function mapSeedDataPlanToSmokeSteps(realSeedDataPlan?: RealSeedDataImportPlan): RealSmokeTestStepDraft[] {
  const warnings = realSeedDataPlan ? [] : ['缺少真实 Seed Data Import 计划，请先生成对应草案。'];
  return [
    smoke(
      'seed_import_order',
      '检查导入顺序',
      'seed_data_import_check',
      'real-seed-data-import-plan',
      '核对司机、车辆、合同、台账、付款、分配、押金、GPS mock、合同文件的导入顺序。',
      '导入顺序符合引用依赖。',
    ),
    smoke(
      'seed_reference_integrity',
      '检查引用完整性',
      'seed_data_import_check',
      'real-seed-data-import-plan',
      '核对外键与业务引用完整性草案。',
      '引用完整性只在草案中验证。',
    ),
    smoke(
      'seed_unique_keys',
      '检查唯一键',
      'seed_data_import_check',
      'real-seed-data-import-plan',
      '核对 mock 数据唯一键计划。',
      '唯一键不会写入真实数据库。',
    ),
    smoke(
      'seed_no_daily_overpayment',
      '检查单日不可超付',
      'seed_data_import_check',
      'real-seed-data-import-plan',
      '核对付款分配数据不允许单日超付。',
      '发现单日超付时应阻断导入计划。',
    ),
    smoke(
      'seed_deposit_not_rent_income',
      '检查押金不计入租金收入',
      'seed_data_import_check',
      'real-seed-data-import-plan',
      '核对押金记录和租金付款边界。',
      '押金不进入租金收入和租金已付。',
    ),
    smoke(
      'seed_gps_not_rent_calculation',
      '检查 GPS 不参与租金计算',
      'seed_data_import_check',
      'real-seed-data-import-plan',
      '核对 GPS mock 数据只用于定位、里程、设备状态监控。',
      'GPS 数据不参与租金计算。',
    ),
    smoke(
      'seed_no_real_sensitive_data',
      '检查无真实敏感数据',
      'seed_data_import_check',
      'real-seed-data-import-plan',
      '核对无真实司机证件、付款截图、合同扫描件和 IOPGPS 凭据。',
      '只允许 TEST 或 MOCK 占位数据。',
    ),
  ].map((item) => ({ ...item, warnings: [...item.warnings, ...warnings] }));
}

export function buildCoreBusinessSmokeSteps(): RealSmokeTestStepDraft[] {
  return [
    ['core_fixed_term_full_ledger', '时限合同完整台账生成'],
    ['core_long_term_future_ledger', '长租合同未来台账生成'],
    ['core_default_free_days', '默认免租日生效'],
    ['core_payment_allocated_to_dates', '付款必须分配到具体日期'],
    ['core_no_single_day_overpayment', '单日不可超付'],
    ['core_payment_fails_when_any_date_overpaid', '任一日期超付则整个付款失败'],
    ['core_unpaid_reason_required', '未付原因必填'],
    ['core_partial_payment_remaining_status', '部分付款必须标记欠款、免除、待审批免除或争议'],
    ['core_payment_reversal_restore_ledger', '付款冲正恢复台账状态'],
    ['core_deposit_lifecycle', '押金收取、抵扣、退还'],
    ['core_deposit_not_rent_income', '押金不计入租金收入'],
    ['core_current_arrears_until_today', '当前欠款只统计截至当前日期'],
    ['core_future_receivable_not_current_arrears', '未来应收不计入当前欠款'],
  ].map(([name, title]) =>
    smoke(
      name,
      title,
      'core_business_flow_check',
      'business-rules',
      `规划 ${title} 的 smoke test 草案。`,
      `${title} 的预期结果符合业务规则。`,
      '基于计划和 mock 数据进行静态验证，不执行业务动作。',
      name.includes('overpayment') || name.includes('reversal'),
    ),
  );
}

export function buildPermissionSmokeSteps(): RealSmokeTestStepDraft[] {
  return [
    smoke(
      'permission_operator_payment_screenshot_hidden',
      'operator 不能看付款截图',
      'permission_check',
      'real-runtime-registration-plan',
      '核对 operator 对付款截图字段隐藏或脱敏。',
      'operator 不能查看付款截图。',
    ),
    smoke(
      'permission_gps_maintenance_financial_summary_hidden',
      'gps_maintenance 不能看财务汇总',
      'permission_check',
      'real-runtime-registration-plan',
      '核对 gps_maintenance 只能访问 GPS 运维数据。',
      'gps_maintenance 不能查看财务汇总。',
    ),
    smoke(
      'permission_sensitive_totals_controlled',
      '敏感金额字段权限控制',
      'permission_check',
      'real-runtime-registration-plan',
      '核对总已付、未来应收、押金字段权限。',
      '敏感金额字段按角色控制。',
    ),
  ];
}

export function buildGpsMockSmokeSteps(): RealSmokeTestStepDraft[] {
  return [
    smoke(
      'gps_iopgps_failure_not_affect_rent',
      'IOPGPS 失败不影响租金',
      'gps_mock_check',
      'real-runtime-registration-plan',
      '规划 IOPGPS mock 失败场景。',
      'IOPGPS 同步失败不影响租金台账和付款逻辑。',
    ),
  ];
}

export function buildContractDocumentSmokeSteps(): RealSmokeTestStepDraft[] {
  return [
    smoke(
      'contract_document_failure_not_affect_payment_ledger',
      '合同文件生成失败不影响付款和台账',
      'contract_document_check',
      'real-page-registration-plan',
      '规划合同文件生成失败场景。',
      '合同文件生成失败不影响付款和每日租金台账。',
    ),
  ];
}

export function buildFailureIsolationSmokeSteps(): RealSmokeTestStepDraft[] {
  return [
    smoke(
      'isolation_iopgps_failure',
      'IOPGPS 同步失败不影响租金台账',
      'failure_isolation_check',
      'failure-isolation',
      '规划 IOPGPS 同步失败隔离验证。',
      '租金台账和付款逻辑不受影响。',
    ),
    smoke(
      'isolation_contract_document_failure',
      '合同文件生成失败不影响付款和台账',
      'failure_isolation_check',
      'failure-isolation',
      '规划合同文件生成失败隔离验证。',
      '付款和台账不受影响。',
    ),
    smoke(
      'isolation_overpayment_rollback',
      '付款超付失败必须整体回滚',
      'failure_isolation_check',
      'failure-isolation',
      '规划付款超付失败事务边界。',
      '整笔付款失败并回滚。',
      '静态验证回滚计划。',
      true,
    ),
    smoke(
      'isolation_seed_import_rollback',
      '测试数据导入失败必须可回滚',
      'failure_isolation_check',
      'failure-isolation',
      '规划测试数据导入失败回滚。',
      '导入失败可回滚。',
      '静态验证回滚计划。',
      true,
    ),
    smoke(
      'isolation_page_init_no_pollution',
      '页面初始化失败不能污染核心数据结构',
      'failure_isolation_check',
      'failure-isolation',
      '规划页面初始化失败隔离。',
      '已成功注册的核心数据结构不被污染。',
      '静态验证隔离计划。',
      true,
    ),
  ];
}

export function buildRollbackSmokeSteps(): RealSmokeTestStepDraft[] {
  return [
    smoke(
      'rollback_payment_overpayment',
      '验证付款超付整体回滚',
      'rollback_check',
      'rollback-plan',
      '规划付款超付回滚验证。',
      '超付失败后台账恢复原状态。',
      '静态验证回滚步骤。',
      true,
    ),
    smoke(
      'rollback_seed_import',
      '验证测试数据导入失败回滚',
      'rollback_check',
      'rollback-plan',
      '规划 Seed Data 导入失败回滚验证。',
      '导入失败后 mock 数据不残留。',
      '静态验证回滚步骤。',
      true,
    ),
    smoke(
      'rollback_page_initialization',
      '验证页面初始化失败回滚',
      'rollback_check',
      'rollback-plan',
      '规划页面初始化失败回滚验证。',
      '页面失败不污染核心结构。',
      '静态验证回滚步骤。',
      true,
    ),
  ];
}

export function buildRealSmokeTestPlan(input: RealSmokeTestPlanInput): RealSmokeTestPlan {
  const context = createRealSmokeTestContext(input.context);
  const warnings: string[] = ['当前只生成真实 Smoke Test 草案，不连接 NocoBase、不写数据库、不执行业务动作。'];
  const errors: string[] = [];
  if (!input.realCollectionPlan) warnings.push('缺少真实 Collection 注册草案。');
  if (!input.realRuntimePlan) warnings.push('缺少真实 Runtime 注册草案。');
  if (!input.realPagePlan) warnings.push('缺少真实 Page 注册草案。');
  if (!input.realSeedDataPlan) warnings.push('缺少真实 Seed Data Import 草案。');
  if (context.mode === 'real') errors.push('当前仓库不允许真实执行 Smoke Test，real 模式必须被阻断。');
  const environmentChecks = [
    smoke(
      'environment_adapter_preflight',
      '真实环境前置检查草案',
      'environment_check',
      'adapter-environment',
      '检查 mode、adapterEnvironment、备份、回滚、隔离数据库、mock 数据和 IOPGPS 禁用要求。',
      '当前仅可生成计划，不能执行真实 Smoke Test。',
    ),
    smoke(
      'plugin_installation_result_check',
      '插件安装结果验证草案',
      'plugin_installation_check',
      'plugin-installation-plan',
      '规划读取真实插件安装结果的后续验证。',
      '当前不安装真实插件。',
    ),
  ];
  const steps = [
    ...environmentChecks,
    ...mapCollectionPlanToSmokeSteps(input.realCollectionPlan),
    ...mapRuntimePlanToSmokeSteps(input.realRuntimePlan),
    ...mapPagePlanToSmokeSteps(input.realPagePlan),
    ...mapSeedDataPlanToSmokeSteps(input.realSeedDataPlan),
    ...buildCoreBusinessSmokeSteps(),
    ...buildPermissionSmokeSteps(),
    ...buildContractDocumentSmokeSteps(),
    ...buildGpsMockSmokeSteps(),
    ...buildFailureIsolationSmokeSteps(),
    ...buildRollbackSmokeSteps(),
    smoke(
      'report_generation_draft',
      'Smoke Test 报告草案',
      'report_generation',
      'real-smoke-test-plan',
      '汇总阶段、步骤、阻塞项和下一步动作。',
      '报告明确 executed=false，不能声明真实测试成功。',
    ),
  ].map((item) => ({ ...item, mode: context.mode, canExecute: false }));
  return {
    mode: context.mode,
    stages: allStages,
    steps,
    environmentChecks,
    businessChecks: steps.filter((item) => item.stage === 'core_business_flow_check'),
    permissionChecks: steps.filter((item) => item.stage === 'permission_check'),
    rollbackChecks: steps.filter((item) => item.stage === 'rollback_check'),
    failureIsolationChecks: steps.filter((item) => item.stage === 'failure_isolation_check'),
    reportPlan: {
      format: 'json',
      artifacts: ['test-data/generated/real-smoke-test-plan.generated.json'],
      sections: [
        '环境检查',
        '注册验证',
        '业务流程',
        '权限',
        'GPS mock',
        '合同文件',
        '失败隔离',
        '回滚验证',
        '下一步动作',
      ],
      notes: ['报告为草案，executed=false，不代表真实 Smoke Test 成功。'],
    },
    warnings,
    errors,
    notes: [...context.notes, '不调用真实 NocoBase API，不调用 IOPGPS，不生成合同文件。'],
  };
}
