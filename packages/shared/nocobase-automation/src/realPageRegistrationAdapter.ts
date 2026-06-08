/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  mapBlockPlanToRealPageSchemaDraft,
  mapFilterPlanToRealPageSchemaDraft,
  mapMenuPlanToRealPageSchemaDraft,
  mapPageActionPlanToRealPageSchemaDraft,
  mapPagePlanToRealPageSchemaDraft,
} from './realPageSchemaMapper';
import { validateRealPageRegistrationSafety, validateRealPageSchemaDraft } from './realPageSafetyChecker';
import type {
  NocobaseAdapterEnvironment,
  PageInitializationPlan,
  RealPageRegistrationContext,
  RealPageRegistrationMode,
  RealPageRegistrationPlan,
  RealPageRegistrationReport,
  RealPageRegistrationStep,
} from './types';

export function createDefaultRealPageAdapterEnvironment(): NocobaseAdapterEnvironment {
  return {
    mode: 'disabled',
    status: 'unavailable',
    hasNocobaseApp: false,
    hasDatabaseConnection: false,
    hasLogger: false,
    hasFileStorage: false,
    hasPluginManager: false,
    hasAcl: false,
    hasUiSchema: false,
    hasScheduler: false,
    hasWorkflow: false,
    warnings: ['当前为仓库内真实 Page 注册草案环境，不存在真实 NocoBase app、ACL 或 UI Schema manager。'],
    errors: [],
  };
}

export function createDefaultRealPageRegistrationContext(
  mode: RealPageRegistrationMode = 'plan_only',
): RealPageRegistrationContext {
  return {
    mode,
    adapterEnvironment: createDefaultRealPageAdapterEnvironment(),
    allowRealExecution: false,
    requireBackup: false,
    requireRollbackPlan: true,
    sourcePlugin: 'all-plugins',
    operator: 'codex-draft-adapter',
    notes: ['默认仅生成真实 Page 注册 Adapter 草案，不真实连接 NocoBase。'],
  };
}

function addSteps(
  steps: RealPageRegistrationStep[],
  itemType: RealPageRegistrationStep['itemType'],
  items: Array<{ name: string; sourcePlugin: string; warnings: string[]; unsupportedFeatures: string[] }>,
  mode: RealPageRegistrationMode,
  plannedAction: string,
): void {
  const canExecute = mode !== 'real';
  for (const item of items) {
    steps.push({
      step: `${steps.length + 1}`,
      title: `生成 ${item.name} ${itemType} schema 草案`,
      itemName: item.name,
      itemType,
      sourcePlugin: item.sourcePlugin,
      mode,
      plannedAction,
      canExecute,
      warnings: [...item.warnings, ...item.unsupportedFeatures],
      errors: canExecute ? [] : ['real 模式在当前仓库被禁止。'],
    });
  }
}

export class RealPageRegistrationAdapter {
  buildRealPageRegistrationPlan(
    pagePlan: PageInitializationPlan,
    context: RealPageRegistrationContext = createDefaultRealPageRegistrationContext(),
  ): RealPageRegistrationPlan {
    const mode = context.mode ?? 'plan_only';
    const menus = pagePlan.menus.map(mapMenuPlanToRealPageSchemaDraft);
    const pages = pagePlan.pages.map(mapPagePlanToRealPageSchemaDraft);
    const blocks = pagePlan.blocks.map(mapBlockPlanToRealPageSchemaDraft);
    const filters = pagePlan.filters.map(mapFilterPlanToRealPageSchemaDraft);
    const actions = pagePlan.actions.map(mapPageActionPlanToRealPageSchemaDraft);
    const basePlan: RealPageRegistrationPlan = {
      mode,
      menus,
      pages,
      blocks,
      filters,
      actions,
      steps: [],
      safetyChecks: [],
      rollbackPlan: [],
      postRegistrationValidationPlan: [],
      warnings: [
        '本计划仅为真实 Page 注册 Adapter 草案，不连接 NocoBase、不写 UI Schema、不创建真实页面。',
        ...pagePlan.warnings,
        ...menus.flatMap((item) => item.warnings.map((warning) => `${item.name}: ${warning}`)),
        ...pages.flatMap((item) => item.warnings.map((warning) => `${item.name}: ${warning}`)),
        ...blocks.flatMap((item) =>
          [...item.warnings, ...item.sensitiveFieldWarnings].map((warning) => `${item.name}: ${warning}`),
        ),
        ...filters.flatMap((item) => item.warnings.map((warning) => `${item.name}: ${warning}`)),
        ...actions.flatMap((item) => item.warnings.map((warning) => `${item.name}: ${warning}`)),
      ],
      errors: [],
      notes: [
        ...context.notes,
        ...pagePlan.notes,
        '未调用真实 NocoBase 菜单、页面或 UI Schema API。',
        '未伪造真实 Page 注册成功。',
      ],
    };
    basePlan.rollbackPlan = this.generateRollbackPlan(basePlan);
    basePlan.postRegistrationValidationPlan = this.generatePostRegistrationValidationPlan(basePlan);
    basePlan.steps = this.generateRealPageRegistrationSteps(basePlan);
    const safety = validateRealPageRegistrationSafety(basePlan, context);
    const schema = validateRealPageSchemaDraft(basePlan);
    basePlan.safetyChecks = safety;
    basePlan.errors = [...safety.flatMap((check) => check.errors), ...schema.errors];
    basePlan.warnings = [
      ...new Set([...basePlan.warnings, ...safety.flatMap((check) => check.warnings), ...schema.warnings]),
    ];
    if (mode === 'real') {
      basePlan.errors.push('当前仓库不允许真实执行 Page 注册；请改用 plan_only、validate_only 或 dry_run。');
    }
    return basePlan;
  }

  validateRealPageRegistrationPlan(plan: RealPageRegistrationPlan): RealPageRegistrationReport {
    const schema = validateRealPageSchemaDraft(plan);
    const stepErrors = plan.steps.flatMap((step) => step.errors);
    const errors = [...new Set([...plan.errors, ...schema.errors, ...stepErrors])];
    const warnings = [
      ...new Set([...plan.warnings, ...schema.warnings, ...plan.steps.flatMap((step) => step.warnings)]),
    ];
    const itemCount =
      plan.menus.length + plan.pages.length + plan.blocks.length + plan.filters.length + plan.actions.length;
    const blocked = plan.steps.filter((step) => !step.canExecute || step.errors.length > 0).length;
    return {
      success: errors.length === 0,
      mode: plan.mode,
      executed: false,
      menusPlanned: plan.menus.length,
      pagesPlanned: plan.pages.length,
      blocksPlanned: plan.blocks.length,
      filtersPlanned: plan.filters.length,
      actionsPlanned: plan.actions.length,
      pageItemsExecutable: plan.mode === 'real' ? 0 : itemCount,
      pageItemsBlocked: blocked > 0 ? itemCount : 0,
      warnings,
      errors,
      steps: plan.steps,
      nextActions:
        errors.length === 0
          ? [
              '复核页面 schema 草案、敏感字段权限、菜单路由、按钮动作和回滚计划后，进入真实 NocoBase Page 接入设计评审。',
            ]
          : ['修复真实 Page 注册草案错误后重新生成计划。'],
    };
  }

  generateRealPageRegistrationSteps(plan: RealPageRegistrationPlan): RealPageRegistrationStep[] {
    const steps: RealPageRegistrationStep[] = [];
    addSteps(steps, 'menu', plan.menus, plan.mode, '将菜单计划转换为真实 NocoBase 菜单 schema 草案。');
    addSteps(steps, 'page', plan.pages, plan.mode, '将页面计划转换为真实 NocoBase 页面 schema 草案。');
    addSteps(steps, 'block', plan.blocks, plan.mode, '将区块计划转换为真实 NocoBase UI Schema 区块草案。');
    addSteps(steps, 'filter', plan.filters, plan.mode, '将筛选器计划转换为真实 NocoBase 筛选器 schema 草案。');
    addSteps(steps, 'pageAction', plan.actions, plan.mode, '将页面动作计划转换为真实 NocoBase 按钮动作 schema 草案。');
    return steps;
  }

  generateRollbackPlan(plan: RealPageRegistrationPlan): string[] {
    return [
      '本轮未执行真实 Page 注册，因此无需回滚 UI Schema 或数据库变更。',
      '未来 real adapter 必须在执行前完成数据库和 UI Schema 备份。',
      '未来 real adapter 必须记录每个菜单、页面、区块、筛选器和按钮动作的创建标识。',
      '未来 real adapter 必须提供失败后删除新增 UI Schema、撤销菜单路由、撤销按钮动作绑定和恢复备份的人工审批流程。',
      `本计划覆盖 ${plan.menus.length} 个菜单、${plan.pages.length} 个页面、${plan.blocks.length} 个区块、${plan.filters.length} 个筛选器、${plan.actions.length} 个页面动作草案。`,
    ];
  }

  generatePostRegistrationValidationPlan(plan: RealPageRegistrationPlan): string[] {
    return [
      '核对真实 NocoBase 中菜单名称、标题、路径、顺序和角色限制。',
      '核对页面路由、菜单绑定、主 Collection、多 Collection 引用和内部员工使用边界。',
      '核对区块字段、隐藏字段、敏感字段和字段级权限。',
      '核对筛选器字段、操作符、默认值和角色限制。',
      '核对页面动作绑定 runtime 服务、确认提示、危险动作标记和 ACL。',
      '核对没有司机登录、客户门户、短租预订或按车型出租入口。',
      '核对 GPS 页面仅用于运营监控，不参与租金计算。',
      '核对押金不计入租金已付，付款必须分配到具体日期。',
      `核对页面项数量：菜单 ${plan.menus.length}、页面 ${plan.pages.length}、区块 ${plan.blocks.length}、筛选器 ${plan.filters.length}、页面动作 ${plan.actions.length}。`,
    ];
  }
}
