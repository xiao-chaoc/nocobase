/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mapCollectionPlanToRealSchemaDraft } from './realCollectionSchemaMapper';
import { validateRealCollectionRegistrationSafety } from './realCollectionSafetyChecker';
import type {
  NocobaseAdapterEnvironment,
  NocobaseCollectionPlan,
  RealCollectionRegistrationContext,
  RealCollectionRegistrationMode,
  RealCollectionRegistrationPlan,
  RealCollectionRegistrationReport,
  RealCollectionRegistrationStep,
} from './types';

export function createDraftAdapterEnvironment(): NocobaseAdapterEnvironment {
  return {
    mode: 'dry_run',
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
    warnings: ['当前为仓库内草案环境，不存在真实 NocoBase app 或 db。'],
    errors: [],
  };
}

export function createDefaultRealCollectionRegistrationContext(
  mode: RealCollectionRegistrationMode = 'plan_only',
): RealCollectionRegistrationContext {
  return {
    mode,
    adapterEnvironment: createDraftAdapterEnvironment(),
    allowRealExecution: false,
    requireBackup: false,
    requireRollbackPlan: true,
    sourcePlugin: 'all-plugins',
    operator: 'codex-draft-adapter',
    notes: ['默认仅生成真实 Collection 注册草案，不真实连接 NocoBase。'],
  };
}

export class RealCollectionRegistrationAdapter {
  buildRealCollectionRegistrationPlan(
    collectionPlans: NocobaseCollectionPlan[],
    context: RealCollectionRegistrationContext = createDefaultRealCollectionRegistrationContext(),
  ): RealCollectionRegistrationPlan {
    const mode = context.mode ?? 'plan_only';
    const collections = collectionPlans.map(mapCollectionPlanToRealSchemaDraft);
    const basePlan: RealCollectionRegistrationPlan = {
      mode,
      collections,
      steps: [],
      safetyChecks: [],
      rollbackPlan: [],
      postRegistrationValidationPlan: [],
      warnings: [
        '本计划仅为真实 Collection 注册 adapter 草案，不连接 NocoBase、不写数据库、不执行 migration。',
        ...collections.flatMap((collection) => collection.warnings.map((warning) => `${collection.name}: ${warning}`)),
      ],
      errors: [],
      notes: [...context.notes, '未调用 app.collection。', '未调用 db.collection。', '未伪造真实 NocoBase API 成功。'],
    };
    basePlan.rollbackPlan = this.generateRollbackPlan(basePlan);
    basePlan.postRegistrationValidationPlan = this.generatePostRegistrationValidationPlan(basePlan);
    basePlan.steps = this.generateRealCollectionRegistrationSteps(basePlan);
    basePlan.safetyChecks = validateRealCollectionRegistrationSafety(basePlan, context);
    basePlan.errors = basePlan.safetyChecks.flatMap((check) => check.errors);
    basePlan.warnings = [...basePlan.warnings, ...basePlan.safetyChecks.flatMap((check) => check.warnings)];
    if (mode === 'real') {
      basePlan.errors.push('当前仓库不允许真实执行 Collection 注册；请改用 plan_only、validate_only 或 dry_run。');
    }
    return basePlan;
  }

  validateRealCollectionRegistrationPlan(plan: RealCollectionRegistrationPlan): RealCollectionRegistrationReport {
    const blockedSteps = plan.steps.filter((step) => !step.canExecute || step.errors.length > 0);
    const executableCollections = plan.mode === 'real' ? 0 : plan.collections.length;
    const errors = [...plan.errors, ...plan.steps.flatMap((step) => step.errors)];
    return {
      success: errors.length === 0,
      mode: plan.mode,
      executed: false,
      collectionsPlanned: plan.collections.length,
      collectionsExecutable: executableCollections,
      collectionsBlocked: blockedSteps.length > 0 ? plan.collections.length : 0,
      warnings: [...plan.warnings, ...plan.steps.flatMap((step) => step.warnings)],
      errors,
      steps: plan.steps,
      nextActions:
        errors.length === 0
          ? ['复核 schema draft、字段映射、唯一约束、敏感字段和回滚计划后，进入真实 NocoBase 接入设计评审。']
          : ['修复计划错误后重新生成真实 Collection 注册草案。'],
    };
  }

  generateRealCollectionRegistrationSteps(plan: RealCollectionRegistrationPlan): RealCollectionRegistrationStep[] {
    const canExecute = plan.mode !== 'real';
    return plan.collections.flatMap((collection, index) => [
      {
        step: `${index + 1}.1`,
        title: `生成 ${collection.name} Collection schema 草案`,
        collectionName: collection.name,
        mode: plan.mode,
        plannedAction: '将 Collection plan 转换为真实 NocoBase schema 草案。',
        canExecute,
        warnings: collection.warnings,
        errors: canExecute ? [] : ['real 模式在当前仓库被禁止。'],
      },
      {
        step: `${index + 1}.2`,
        title: `校验 ${collection.name} 字段、关系、索引和敏感字段`,
        collectionName: collection.name,
        mode: plan.mode,
        plannedAction: '只执行本地计划校验，不调用真实 NocoBase API。',
        canExecute,
        warnings: collection.unsupportedFeatures,
        errors: canExecute ? [] : ['当前仓库不允许真实注册 Collection。'],
      },
    ]);
  }

  generateRollbackPlan(plan: RealCollectionRegistrationPlan): string[] {
    return [
      '本轮未执行真实注册，因此无需回滚数据库变更。',
      '未来 real adapter 必须在执行前完成数据库备份。',
      '未来 real adapter 必须记录每个 Collection、字段、索引和关系的创建事务边界。',
      '未来 real adapter 必须提供失败后删除新增 schema、撤销索引、撤销关系和恢复备份的人工审批流程。',
      `本计划覆盖 ${plan.collections.length} 个 Collection 草案。`,
    ];
  }

  generatePostRegistrationValidationPlan(plan: RealCollectionRegistrationPlan): string[] {
    return [
      '核对真实 NocoBase 中 Collection 名称、标题和 sourcePlugin。',
      '核对字段类型、必填、默认值、枚举、文件、关系和敏感字段权限。',
      '核对唯一约束和普通索引是否与计划一致。',
      '核对 GPS 字段仅用于运营监控，不参与租金计算。',
      '核对押金字段不计入租金已付。',
      '核对没有短租、司机登录、客户门户或按车型出租 Collection。',
      `核对 Collection 数量：${plan.collections.length}。`,
    ];
  }
}
