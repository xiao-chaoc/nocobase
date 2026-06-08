/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  mapActionPlanToRealSchemaDraft,
  mapI18nPlanToRealSchemaDraft,
  mapPermissionPlanToRealSchemaDraft,
  mapSchedulePlanToRealSchemaDraft,
  mapServicePlanToRealSchemaDraft,
} from './realRuntimeSchemaMapper';
import { validateRealRuntimeRegistrationSafety, validateRealRuntimeSchemaDraft } from './realRuntimeSafetyChecker';
import type {
  NocobaseAdapterEnvironment,
  RealRuntimeRegistrationContext,
  RealRuntimeRegistrationMode,
  RealRuntimeRegistrationPlan,
  RealRuntimeRegistrationReport,
  RealRuntimeRegistrationStep,
  RuntimeRegistrationPlan,
} from './types';

export function createDefaultRealRuntimeAdapterEnvironment(): NocobaseAdapterEnvironment {
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
    warnings: ['当前仓库不是完整 NocoBase 工程，真实 Runtime 注册不可执行。'],
    errors: ['缺少真实 app、db、ACL、i18n loader、scheduler、action/route/command 和插件生命周期上下文。'],
  };
}

export function createDefaultRealRuntimeRegistrationContext(
  mode: RealRuntimeRegistrationMode = 'plan_only',
): RealRuntimeRegistrationContext {
  return {
    mode,
    adapterEnvironment: createDefaultRealRuntimeAdapterEnvironment(),
    allowRealExecution: false,
    requireBackup: true,
    requireRollbackPlan: true,
    sourcePlugin: 'all-runtime-plugins',
    operator: 'codex-web',
    notes: ['默认上下文只允许生成真实 Runtime 注册草案，不允许 real 模式。'],
  };
}

const pushStep = (
  steps: RealRuntimeRegistrationStep[],
  step: string,
  title: string,
  itemName: string,
  itemType: RealRuntimeRegistrationStep['itemType'],
  sourcePlugin: string,
  mode: RealRuntimeRegistrationMode,
  plannedAction: string,
  warnings: string[] = [],
  errors: string[] = [],
): void => {
  steps.push({
    step,
    title,
    itemName,
    itemType,
    sourcePlugin,
    mode,
    plannedAction,
    canExecute: false,
    warnings,
    errors,
  });
};

export class RealRuntimeRegistrationAdapter {
  buildRealRuntimeRegistrationPlan(
    runtimePlan: RuntimeRegistrationPlan,
    context: RealRuntimeRegistrationContext = createDefaultRealRuntimeRegistrationContext(),
  ): RealRuntimeRegistrationPlan {
    const mode = context.mode ?? 'plan_only';
    const services = runtimePlan.services.map(mapServicePlanToRealSchemaDraft);
    const actions = runtimePlan.actions.map(mapActionPlanToRealSchemaDraft);
    const permissions = runtimePlan.permissions.map(mapPermissionPlanToRealSchemaDraft);
    const schedules = runtimePlan.schedules.map(mapSchedulePlanToRealSchemaDraft);
    const i18n = runtimePlan.i18n.map(mapI18nPlanToRealSchemaDraft);
    const basePlan: RealRuntimeRegistrationPlan = {
      mode,
      services,
      actions,
      permissions,
      schedules,
      i18n,
      steps: [],
      safetyChecks: [],
      rollbackPlan: [],
      postRegistrationValidationPlan: [],
      warnings: [...runtimePlan.warnings, ...context.adapterEnvironment.warnings],
      errors: mode === 'real' ? ['当前仓库不允许 real 模式；本轮禁止真实 Runtime 注册。'] : [],
      notes: [
        ...runtimePlan.notes,
        ...context.notes,
        '本计划只生成真实 Runtime schema draft、注册步骤、回滚计划和后置验证计划。',
        '本计划不连接 NocoBase、不写数据库、不注册服务/动作/权限/定时任务、不加载 i18n。',
      ],
    };
    basePlan.rollbackPlan = this.generateRollbackPlan(basePlan);
    basePlan.postRegistrationValidationPlan = this.generatePostRegistrationValidationPlan(basePlan);
    basePlan.steps = this.generateRealRuntimeRegistrationSteps(basePlan);
    const safety = validateRealRuntimeRegistrationSafety(basePlan, context);
    const schema = validateRealRuntimeSchemaDraft(basePlan);
    basePlan.safetyChecks = safety.safetyChecks;
    basePlan.warnings = [...basePlan.warnings, ...safety.warnings, ...schema.warnings];
    basePlan.errors = [...basePlan.errors, ...safety.errors, ...schema.errors];
    return basePlan;
  }

  validateRealRuntimeRegistrationPlan(plan: RealRuntimeRegistrationPlan): RealRuntimeRegistrationReport {
    const schema = validateRealRuntimeSchemaDraft(plan);
    const errors = [...plan.errors, ...schema.errors];
    const warnings = [...plan.warnings, ...schema.warnings];
    const blockedSteps = plan.steps.filter((step) => !step.canExecute).length;
    return {
      success: errors.length === 0 && plan.mode !== 'real',
      mode: plan.mode,
      executed: false,
      servicesPlanned: plan.services.length,
      actionsPlanned: plan.actions.length,
      permissionsPlanned: plan.permissions.length,
      schedulesPlanned: plan.schedules.length,
      i18nPlanned: plan.i18n.length,
      runtimeExecutable: 0,
      runtimeBlocked: blockedSteps,
      warnings,
      errors,
      steps: plan.steps,
      nextActions: [
        '在完整 NocoBase 工程中确认目标版本的服务、ACL、i18n、scheduler、action/route/command API。',
        '准备隔离测试环境、备份策略和回滚演练后，才能进入真实 adapter 实现阶段。',
        '继续保持当前仓库 real 模式禁用，避免伪造真实注册成功。',
      ],
    };
  }

  generateRealRuntimeRegistrationSteps(plan: RealRuntimeRegistrationPlan): RealRuntimeRegistrationStep[] {
    const steps: RealRuntimeRegistrationStep[] = [];
    let index = 1;
    for (const service of plan.services)
      pushStep(
        steps,
        String(index++).padStart(2, '0'),
        '生成服务注册草案',
        service.name,
        'service',
        service.sourcePlugin,
        plan.mode,
        `保留 handlerName=${service.handlerName} 与权限要求，后续接入真实服务注册机制。`,
        service.warnings,
        service.unsupportedFeatures,
      );
    for (const action of plan.actions)
      pushStep(
        steps,
        String(index++).padStart(2, '0'),
        '生成动作注册草案',
        action.name,
        'action',
        action.sourcePlugin,
        plan.mode,
        `绑定服务 ${action.serviceName || '<缺失>'}，后续接入真实 action/route/command 和按钮机制。`,
        action.warnings,
        action.unsupportedFeatures,
      );
    for (const permission of plan.permissions)
      pushStep(
        steps,
        String(index++).padStart(2, '0'),
        '生成权限注册草案',
        permission.role,
        'permission',
        permission.sourcePlugin,
        plan.mode,
        '保留角色、Collection、动作、敏感字段和字段可见性，后续接入真实 ACL。',
        permission.warnings,
        permission.unsupportedFeatures,
      );
    for (const schedule of plan.schedules)
      pushStep(
        steps,
        String(index++).padStart(2, '0'),
        '生成定时任务注册草案',
        schedule.name,
        'schedule',
        schedule.sourcePlugin,
        plan.mode,
        `保留 cron=${schedule.cron}，默认启用=${schedule.enabledByDefault}，后续接入真实 scheduler。`,
        schedule.warnings,
        schedule.unsupportedFeatures,
      );
    for (const item of plan.i18n)
      pushStep(
        steps,
        String(index++).padStart(2, '0'),
        '生成 i18n 注册草案',
        item.namespace,
        'i18n',
        item.sourcePlugin,
        plan.mode,
        '保留 zh-CN、en-US、fr-FR 资源文件计划，后续接入真实 i18n loader。',
        item.warnings,
        item.unsupportedFeatures,
      );
    pushStep(
      steps,
      String(index++).padStart(2, '0'),
      '生成回滚计划',
      'runtime-rollback-plan',
      'rollback',
      'all-runtime-plugins',
      plan.mode,
      '仅生成回滚步骤草案，不执行真实卸载或数据库回滚。',
    );
    pushStep(
      steps,
      String(index++).padStart(2, '0'),
      '生成后置验证计划',
      'runtime-post-validation-plan',
      'validation',
      'all-runtime-plugins',
      plan.mode,
      '仅生成后置验证草案，不连接真实 NocoBase。',
    );
    return steps;
  }

  generateRollbackPlan(plan: RealRuntimeRegistrationPlan): string[] {
    return [
      `记录本次草案涉及服务 ${plan.services.length} 个、动作 ${plan.actions.length} 个、权限角色 ${plan.permissions.length} 个、定时任务 ${plan.schedules.length} 个、i18n 命名空间 ${plan.i18n.length} 个。`,
      '真实执行前必须先备份隔离测试数据库、插件配置、i18n 资源和 scheduler 配置。',
      '如果真实注册失败，必须按相反顺序撤销 i18n、scheduler、动作、权限和服务注册。',
      'IOPGPS 定时任务回滚时必须保持关闭，失败隔离不能影响租金台账和付款逻辑。',
      '当前仓库不执行任何真实回滚，只保留回滚计划文本。',
    ];
  }

  generatePostRegistrationValidationPlan(plan: RealRuntimeRegistrationPlan): string[] {
    return [
      `验证服务草案数量为 ${plan.services.length}，且事务服务均保留 transactional 标记。`,
      `验证动作草案数量为 ${plan.actions.length}，所有动作都绑定 serviceName 和 requiredPermissions。`,
      '验证六个核心角色存在，付款截图、押金、总已付、未来应收和财务汇总受服务端权限控制。',
      '验证 i18n 命名空间均支持 zh-CN、en-US、fr-FR。',
      '验证 IOPGPS 定时任务默认不真实启用，GPS 数据不参与租金计算。',
      '验证押金不计入租金已付，短租、司机登录、按车型出租逻辑不存在。',
    ];
  }
}
