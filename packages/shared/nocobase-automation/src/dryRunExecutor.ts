/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AutomatedGoLiveRegistrationPlan, DryRunResult, RegistrationStep } from './types';
import { validateAutomatedRegistrationPlan } from './registrationValidator';

function step(name: string, title: string, sourcePlugin?: string, notes: string[] = []): RegistrationStep {
  return { name, title, sourcePlugin, status: 'planned', dryRunOnly: true, notes };
}

export function dryRunAutomatedRegistration(plan: AutomatedGoLiveRegistrationPlan): DryRunResult {
  const validation = validateAutomatedRegistrationPlan(plan);
  const steps: RegistrationStep[] = [
    step('check_plugin_order', '检查插件顺序', undefined, ['只检查计划对象，不安装插件。']),
    step('register_rental_core_collections', '注册 rental-core Collections', 'plugin-rental-core', [
      'dry-run 不创建数据库表。',
    ]),
    step('register_rental_core_services', '注册 rental-core 服务', 'plugin-rental-core', ['dry-run 不调用真实服务。']),
    step('register_rental_core_permissions', '注册 rental-core 权限', 'plugin-rental-core', [
      'dry-run 不创建真实 ACL。',
    ]),
    step(
      'register_contract_documents_collections',
      '注册 contract-documents Collections',
      'plugin-contract-documents',
      ['dry-run 不创建数据库表。'],
    ),
    step('register_contract_documents_services', '注册 contract-documents 服务', 'plugin-contract-documents', [
      'dry-run 不生成合同文件。',
    ]),
    step('register_iopgps_collections', '注册 iopgps Collections', 'plugin-iopgps', ['dry-run 不创建数据库表。']),
    step('register_iopgps_services', '注册 iopgps 服务', 'plugin-iopgps', ['dry-run 不调用 IOPGPS。']),
    step('register_i18n', '注册 i18n', undefined, ['dry-run 只检查语言计划。']),
    step('register_actions', '注册动作', undefined, ['dry-run 不注册按钮或 API。']),
    step('register_schedules', '注册定时任务', undefined, ['dry-run 不执行任务。']),
    step('build_page_initialization_plan', '生成页面初始化计划', undefined, ['dry-run 不创建 UI。']),
    step('prepare_mock_seed_data_import', '准备 mock 数据导入计划', undefined, ['dry-run 不写数据库。']),
    step('prepare_smoke_test_plan', '准备 smoke test 计划', undefined, ['dry-run 不访问真实 NocoBase。']),
  ];
  const warnings = [
    ...plan.warnings,
    ...validation.warnings,
    'dry-run 未连接数据库。',
    'dry-run 未调用 IOPGPS。',
    'dry-run 未生成合同文件或上传文件。',
  ];
  return {
    success: validation.passed,
    steps: validation.passed
      ? steps
      : steps.map((item) => (item.name === 'check_plugin_order' ? { ...item, status: 'error' } : item)),
    warnings,
    errors: validation.errors,
    summary: {
      pluginCount: plan.plugins.length,
      collectionCount: plan.collections.length,
      serviceCount: plan.services.length,
      permissionCount: plan.permissions.length,
      actionCount: plan.actions.length,
      scheduleCount: plan.schedules.length,
      pageCount: plan.pages.length,
      smokeTestCount: plan.smokeTests.length,
      dryRunOnly: true,
    },
  };
}
