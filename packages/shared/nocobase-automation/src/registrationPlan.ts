/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  AutomatedGoLiveRegistrationPlan,
  NocobaseActionPlan,
  NocobaseCollectionPlan,
  NocobaseI18nPlan,
  NocobasePagePlan,
  NocobasePermissionPlan,
  NocobaseSchedulePlan,
  NocobaseServicePlan,
  PluginPlanSummary,
  SeedDataPlan,
  SmokeTestPlan,
} from './types';

export type RawPluginRegistration = {
  pluginName: string;
  pluginTitle?: string;
  dependencies?: readonly string[];
  collections?: readonly unknown[];
  services?: readonly string[];
  permissions?: readonly unknown[];
  i18nNamespaces?: readonly string[];
  scheduledTasks?: readonly unknown[];
  actions?: readonly unknown[];
  notes?: readonly string[];
};

const pluginOrder = ['plugin-rental-core', 'plugin-contract-documents', 'plugin-iopgps'];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function asStringMatrix(value: unknown): string[][] {
  return Array.isArray(value) ? value.map((item) => asStringArray(item)) : [];
}

function findRegistration(
  registrations: readonly RawPluginRegistration[],
  pluginName: string,
): RawPluginRegistration | undefined {
  return registrations.find((registration) => registration.pluginName === pluginName);
}

export function sortPluginRegistrations(registrations: readonly RawPluginRegistration[]): RawPluginRegistration[] {
  return [...registrations].sort((a, b) => pluginOrder.indexOf(a.pluginName) - pluginOrder.indexOf(b.pluginName));
}

export function buildCollectionPlansFromRegistrations(
  registrations: readonly RawPluginRegistration[],
): NocobaseCollectionPlan[] {
  const plans: NocobaseCollectionPlan[] = [];
  for (const registration of sortPluginRegistrations(registrations)) {
    for (const collection of registration.collections ?? []) {
      const draft = asRecord(collection);
      plans.push({
        name: String(draft.name ?? ''),
        title: String(draft.title ?? draft.name ?? ''),
        fields: asStringArray(draft.fields),
        indexes: asStringArray(draft.indexes),
        uniqueConstraints: asStringMatrix(draft.uniqueConstraints),
        sensitiveFields: asStringArray(draft.sensitiveFields),
        relations: Array.isArray(draft.relations) ? draft.relations : [],
        sourcePlugin: registration.pluginName,
        notes: asStringArray(draft.notes),
      });
    }
  }
  return plans;
}

function buildServicePlans(registrations: readonly RawPluginRegistration[]): NocobaseServicePlan[] {
  const plans: NocobaseServicePlan[] = [];
  for (const registration of sortPluginRegistrations(registrations)) {
    for (const service of registration.services ?? []) {
      const [handlerNameRaw, descriptionRaw] = String(service).split(':');
      const handlerName = handlerNameRaw.trim();
      plans.push({
        name: `${registration.pluginName}.${handlerName}`,
        sourcePlugin: registration.pluginName,
        handlerName,
        permissions: ['后续接入真实 NocoBase 服务端权限'],
        transactional: ['payment', 'deposit', 'ledger', 'waiver', 'contract'].some((keyword) =>
          handlerName.toLowerCase().includes(keyword),
        ),
        notes: [descriptionRaw?.trim() || '服务注册计划；本轮 dry-run 不调用真实服务。'],
      });
    }
  }
  return plans;
}

function buildPermissionPlans(
  registrations: readonly RawPluginRegistration[],
  collections: NocobaseCollectionPlan[],
): NocobasePermissionPlan[] {
  const rental = findRegistration(registrations, 'plugin-rental-core');
  const permissions = rental?.permissions ?? [];
  const plans: NocobasePermissionPlan[] = [];
  for (const permission of permissions) {
    const draft = asRecord(permission);
    const role = String(draft.role ?? 'unknown_role');
    const visible = asStringArray(draft.visibleSensitiveFields);
    const hidden = asStringArray(draft.hiddenSensitiveFields);
    const fieldVisibility: Record<string, 'visible' | 'hidden' | 'masked'> = {};
    for (const field of visible) fieldVisibility[field] = 'visible';
    for (const field of hidden) fieldVisibility[field] = 'hidden';
    plans.push({
      role,
      collections: asStringArray(draft.accessibleCollections),
      actions: role === 'readonly_auditor' ? ['read'] : ['read', 'create', 'update'],
      fieldVisibility,
      sensitiveFields: [...new Set([...visible, ...hidden])],
      notes: asStringArray(draft.notes),
    });
  }
  if (!plans.some((plan) => plan.role === 'gps_maintenance')) {
    plans.push({
      role: 'gps_maintenance',
      collections: ['vehicles', 'gps_devices'],
      actions: ['read'],
      fieldVisibility: {},
      sensitiveFields: [],
      notes: ['GPS 维护角色草案。'],
    });
  }
  for (const plan of plans) {
    if (plan.collections.length === 0) plan.collections = collections.map((collection) => collection.name);
  }
  return plans;
}

function buildActionPlans(registrations: readonly RawPluginRegistration[]): NocobaseActionPlan[] {
  const plans: NocobaseActionPlan[] = [];
  for (const registration of sortPluginRegistrations(registrations)) {
    for (const action of registration.actions ?? []) {
      const draft = asRecord(action);
      plans.push({
        name: String(draft.name ?? ''),
        title: String(draft.title ?? draft.name ?? ''),
        sourcePlugin: registration.pluginName,
        inputSchema: asStringArray(draft.input),
        outputSchema: String(draft.output ?? 'dry-run 输出计划'),
        requiredPermissions: asStringArray(draft.requiredRoles),
        serviceName: String(draft.callsService ?? ''),
        notes: asStringArray(draft.failureScenarios).concat('本轮只生成动作注册计划，不真实注册按钮或 API。'),
      });
    }
  }
  return plans;
}

function buildSchedulePlans(registrations: readonly RawPluginRegistration[]): NocobaseSchedulePlan[] {
  const plans: NocobaseSchedulePlan[] = [];
  for (const registration of sortPluginRegistrations(registrations)) {
    for (const schedule of registration.scheduledTasks ?? []) {
      const draft = asRecord(schedule);
      plans.push({
        name: String(draft.name ?? ''),
        title: String(draft.title ?? draft.name ?? ''),
        sourcePlugin: registration.pluginName,
        cron: String(draft.cron ?? '后续接入真实 scheduler 后配置'),
        enabledByDefault: Boolean(draft.defaultEnabled ?? false),
        serviceName: String(draft.serviceName ?? draft.callsService ?? draft.name ?? ''),
        notes: asStringArray(draft.notes).concat('本轮 dry-run 不执行定时任务。'),
      });
    }
  }
  return plans;
}

function buildI18nPlans(registrations: readonly RawPluginRegistration[]): NocobaseI18nPlan[] {
  return sortPluginRegistrations(registrations).map((registration) => ({
    namespace: registration.pluginName,
    sourcePlugin: registration.pluginName,
    languages: ['zh-CN', 'en-US', 'fr-FR'],
    localeFiles: ['src/locale/zh-CN.json', 'src/locale/en-US.json', 'src/locale/fr-FR.json'],
    notes: [`来自 ${registration.pluginName} 的 i18n dry-run 注册计划。`],
  }));
}

export function buildPagePlans(): NocobasePagePlan[] {
  const roles = ['system_admin', 'manager', 'accountant', 'operator'];
  return [
    {
      name: 'drivers_page',
      title: '司机管理',
      menuPath: '租赁核心/司机管理',
      sourcePlugin: 'plugin-rental-core',
      collections: ['drivers'],
      blocks: ['table', 'detail', 'operation-log-summary'],
      requiredRoles: roles,
      notes: ['页面计划占位，不真实创建 UI。'],
    },
    {
      name: 'vehicles_page',
      title: '车辆管理',
      menuPath: '租赁核心/车辆管理',
      sourcePlugin: 'plugin-rental-core',
      collections: ['vehicles'],
      blocks: ['table', 'detail', 'gps-status-summary'],
      requiredRoles: roles,
      notes: ['必须绑定具体车牌，不按车型出租。'],
    },
    {
      name: 'contracts_page',
      title: '合同管理',
      menuPath: '租赁核心/合同管理',
      sourcePlugin: 'plugin-rental-core',
      collections: ['lease_contracts'],
      blocks: ['table', 'detail', 'ledger-actions'],
      requiredRoles: roles,
      notes: ['支持时限合同和长租合同。'],
    },
    {
      name: 'rent_daily_ledgers_page',
      title: '每日租金台账',
      menuPath: '租赁核心/每日租金台账',
      sourcePlugin: 'plugin-rental-core',
      collections: ['rent_daily_ledgers'],
      blocks: ['table', 'filters', 'status-summary'],
      requiredRoles: roles,
      notes: ['每日台账是唯一事实来源。'],
    },
    {
      name: 'rent_payments_page',
      title: '付款记录',
      menuPath: '租赁核心/付款记录',
      sourcePlugin: 'plugin-rental-core',
      collections: ['rent_payments', 'rent_payment_allocations'],
      blocks: ['table', 'allocation-detail'],
      requiredRoles: ['system_admin', 'manager', 'accountant'],
      notes: ['付款必须分配到具体日期。'],
    },
    {
      name: 'deposit_records_page',
      title: '押金管理',
      menuPath: '租赁核心/押金管理',
      sourcePlugin: 'plugin-rental-core',
      collections: ['deposit_records'],
      blocks: ['table', 'detail'],
      requiredRoles: ['system_admin', 'manager', 'accountant'],
      notes: ['押金不计入租金收入。'],
    },
    {
      name: 'rent_calendar_page',
      title: '收租日历',
      menuPath: '租赁核心/收租日历',
      sourcePlugin: 'plugin-rental-core',
      collections: ['rent_daily_ledgers'],
      blocks: ['calendar-placeholder', 'debt-summary'],
      requiredRoles: roles,
      notes: ['本轮只输出页面计划，不实现前端日历 UI。'],
    },
    {
      name: 'gps_devices_page',
      title: 'GPS 设备',
      menuPath: '运营监控/GPS 设备',
      sourcePlugin: 'plugin-iopgps',
      collections: ['gps_devices'],
      blocks: ['table', 'device-detail'],
      requiredRoles: ['system_admin', 'manager', 'gps_maintenance'],
      notes: ['不调用真实 IOPGPS。'],
    },
    {
      name: 'gps_status_page',
      title: 'GPS 状态',
      menuPath: '运营监控/GPS 状态',
      sourcePlugin: 'plugin-iopgps',
      collections: ['gps_location_snapshots', 'gps_daily_mileages'],
      blocks: ['status-table', 'mock-map-placeholder'],
      requiredRoles: ['system_admin', 'manager', 'gps_maintenance'],
      notes: ['GPS 数据不参与租金计算。'],
    },
    {
      name: 'contract_templates_page',
      title: '合同模板',
      menuPath: '合同文件/合同模板',
      sourcePlugin: 'plugin-contract-documents',
      collections: ['contract_templates'],
      blocks: ['table', 'language-filter'],
      requiredRoles: ['system_admin', 'manager', 'operator'],
      notes: ['只使用模板占位，不上传真实合同文件。'],
    },
    {
      name: 'contract_documents_page',
      title: '合同文件',
      menuPath: '合同文件/合同文件',
      sourcePlugin: 'plugin-contract-documents',
      collections: ['contract_documents'],
      blocks: ['table', 'status-flow'],
      requiredRoles: ['system_admin', 'manager', 'operator'],
      notes: ['不真实生成 PDF，不上传真实扫描件。'],
    },
    {
      name: 'operation_logs_page',
      title: '操作日志',
      menuPath: '系统审计/操作日志',
      sourcePlugin: 'plugin-rental-core',
      collections: ['operation_logs'],
      blocks: ['table', 'masked-detail'],
      requiredRoles: ['system_admin', 'manager', 'readonly_auditor'],
      notes: ['日志必须脱敏。'],
    },
  ];
}

export function buildSmokeTestPlans(): SmokeTestPlan[] {
  return [
    {
      name: 'nocobase_environment',
      title: 'NocoBase 基础环境',
      target: 'docker-compose.test.yml',
      assertions: ['NocoBase 启动', 'PostgreSQL 启动', 'storage/templates 挂载'],
      blockedBy: [],
      notes: ['不代表插件已启用。'],
    },
    {
      name: 'plugin_load_order',
      title: '插件加载顺序',
      target: 'pluginRegistration',
      assertions: pluginOrder,
      blockedBy: ['插件可安装化'],
      notes: ['必须先 rental-core。'],
    },
    {
      name: 'collection_registration',
      title: 'Collection 注册',
      target: 'collections',
      assertions: ['核心 Collections 自动存在'],
      blockedBy: ['真实 adapter'],
      notes: ['不手动 UI 建表。'],
    },
    {
      name: 'ledger_generation',
      title: '台账生成',
      target: 'rental-core',
      assertions: ['时限合同完整台账', '长租未来台账'],
      blockedBy: ['Collection 注册'],
      notes: ['每日台账唯一事实来源。'],
    },
    {
      name: 'payment_no_overpayment',
      title: '付款禁止超付',
      target: 'rental-core',
      assertions: ['付款分配到日期', '单日不可超付'],
      blockedBy: ['台账生成'],
      notes: ['不生成预收款。'],
    },
    {
      name: 'deposit_flow',
      title: '押金',
      target: 'rental-core',
      assertions: ['押金收取', '押金抵扣', '押金不计入租金收入'],
      blockedBy: ['Collection 注册'],
      notes: ['押金独立管理。'],
    },
    {
      name: 'permission_filtering',
      title: '权限过滤',
      target: 'rental-core',
      assertions: ['敏感字段按角色过滤'],
      blockedBy: ['权限初始化'],
      notes: ['不能只靠前端隐藏。'],
    },
    {
      name: 'contract_document_status',
      title: '合同文件状态',
      target: 'plugin-contract-documents',
      assertions: ['generated/printed/signed/scanned/voided'],
      blockedBy: ['合同文件插件安装'],
      notes: ['不真实生成 PDF。'],
    },
    {
      name: 'gps_mock_normalization',
      title: 'GPS mock 状态归一化',
      target: 'plugin-iopgps',
      assertions: ['offline', 'fault', 'low_power', 'power_cut'],
      blockedBy: ['GPS 插件安装'],
      notes: ['GPS 不参与租金计算。'],
    },
    {
      name: 'iopgps_disabled',
      title: 'IOPGPS 禁用状态验证',
      target: 'plugin-iopgps',
      assertions: ['IOPGPS_SYNC_ENABLED=false', '不调用真实 API'],
      blockedBy: ['GPS 插件安装'],
      notes: ['真实同步必须人工启用。'],
    },
  ];
}

function buildSeedDataPlan(): SeedDataPlan[] {
  return [
    {
      name: 'mock_business_data',
      source: 'test-data/generated/*.json',
      targetCollections: [
        'drivers',
        'vehicles',
        'lease_contracts',
        'rent_daily_ledgers',
        'rent_payments',
        'deposit_records',
        'gps_devices',
        'contract_templates',
        'contract_documents',
      ],
      dryRunOnly: true,
      notes: ['本轮只准备导入计划，不写数据库，不导入真实数据。'],
    },
  ];
}

function collectWarnings(registrations: readonly RawPluginRegistration[]): string[] {
  const warnings: string[] = ['当前仓库不是完整 NocoBase 源码工程；待接入真实 NocoBase 工程后实现真实 adapter。'];
  const iopgps = findRegistration(registrations, 'plugin-iopgps');
  if (iopgps) warnings.push('IOPGPS 真实同步默认关闭；本计划不调用真实 IOPGPS API。');
  warnings.push('页面计划仅为自动初始化计划，不真实创建 UI，也不要求用户手动建页面。');
  return warnings;
}

export function buildAutomatedRegistrationPlan(
  registrations: readonly RawPluginRegistration[],
): AutomatedGoLiveRegistrationPlan {
  const sortedRegistrations = sortPluginRegistrations(registrations);
  const collections = buildCollectionPlansFromRegistrations(sortedRegistrations);
  const services = buildServicePlans(sortedRegistrations);
  const permissions = buildPermissionPlans(sortedRegistrations, collections);
  const actions = buildActionPlans(sortedRegistrations);
  const schedules = buildSchedulePlans(sortedRegistrations);
  const pages = buildPagePlans();
  const i18n = buildI18nPlans(sortedRegistrations);
  const seedData = buildSeedDataPlan();
  const smokeTests = buildSmokeTestPlans();
  const plugins: PluginPlanSummary[] = sortedRegistrations.map((registration) => ({
    pluginName: registration.pluginName,
    pluginTitle: registration.pluginTitle ?? registration.pluginName,
    dependencies: [...(registration.dependencies ?? [])],
    notes: [...(registration.notes ?? [])],
  }));
  return {
    plugins,
    collections,
    services,
    permissions,
    actions,
    schedules,
    pages,
    i18n,
    seedData,
    smokeTests,
    warnings: collectWarnings(sortedRegistrations),
    notes: [
      '本计划为 dry-run 自动化注册计划，不连接真实 NocoBase。',
      '不写数据库、不创建页面、不创建权限、不导入真实数据。',
      'GPS 数据不参与租金计算；合同文件插件不处理租金和付款。',
    ],
  };
}
