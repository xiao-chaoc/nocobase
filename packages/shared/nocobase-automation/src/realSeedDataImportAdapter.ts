/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  NocobaseRealSeedDataImportAdapter,
  RealSeedDataImportContext,
  RealSeedDataImportPlan,
  RealSeedDataImportReport,
  RealSeedDataImportSafetyCheck,
  RealSeedDataImportStep,
  SeedDataImportPlan,
  ValidationResult,
} from './types';
import { mapSeedDataImportPlanToRealSchemaDraft } from './realSeedDataSchemaMapper';
import {
  validateRealSeedDataImportSafety,
  validateRealSeedDataNoRealData,
  validateRealSeedDataSchemaDraft,
} from './realSeedDataSafetyChecker';

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

export class RealSeedDataImportAdapter implements NocobaseRealSeedDataImportAdapter {
  buildRealSeedDataImportPlan(
    importPlan: SeedDataImportPlan,
    context: RealSeedDataImportContext,
  ): RealSeedDataImportPlan {
    const mode = context.mode ?? 'plan_only';
    const entities = mapSeedDataImportPlanToRealSchemaDraft(importPlan);
    const plan: RealSeedDataImportPlan = {
      mode,
      entities,
      steps: [],
      safetyChecks: [],
      transactionPlan: [],
      rollbackPlan: [],
      postImportValidationPlan: [],
      warnings: uniqueStrings([
        ...importPlan.warnings,
        '真实 Seed Data Import adapter 当前仅生成草案，不连接 NocoBase、不写数据库、不上传文件。',
      ]),
      errors: [],
      notes: uniqueStrings([
        ...importPlan.notes,
        ...context.notes,
        `源目录：${context.sourceDir}`,
        `操作人：${context.operator ?? '未指定'}`,
      ]),
    };
    plan.steps = this.generateRealSeedDataImportSteps(plan);
    plan.transactionPlan = this.generateTransactionPlan(plan);
    plan.rollbackPlan = this.generateRollbackPlan(plan);
    plan.postImportValidationPlan = this.generatePostImportValidationPlan(plan);
    const safetyChecks = this.buildSafetyChecks(plan, context);
    plan.safetyChecks = safetyChecks;
    plan.errors = uniqueStrings([...plan.errors, ...safetyChecks.flatMap((check) => check.errors)]);
    plan.warnings = uniqueStrings([...plan.warnings, ...safetyChecks.flatMap((check) => check.warnings)]);
    if (mode === 'real') {
      plan.errors = uniqueStrings([...plan.errors, '当前仓库不允许 real 模式；本 adapter 不执行真实导入。']);
      plan.steps = plan.steps.map((step) => ({
        ...step,
        canExecute: false,
        errors: uniqueStrings([...step.errors, 'real 模式被当前仓库安全边界阻断。']),
      }));
    }
    return plan;
  }

  validateRealSeedDataImportPlan(plan: RealSeedDataImportPlan): RealSeedDataImportReport {
    const validations = [validateRealSeedDataSchemaDraft(plan), validateRealSeedDataNoRealData(plan)];
    const errors = uniqueStrings([...plan.errors, ...validations.flatMap((validation) => validation.errors)]);
    const warnings = uniqueStrings([...plan.warnings, ...validations.flatMap((validation) => validation.warnings)]);
    const importsExecutable = plan.steps.filter((step) => step.canExecute).length;
    const importsBlocked = plan.steps.length - importsExecutable;
    return {
      success: errors.length === 0,
      mode: plan.mode,
      executed: false,
      entitiesPlanned: plan.entities.length,
      recordsPlanned: plan.entities.reduce((sum, entity) => sum + Math.max(0, entity.recordCount), 0),
      importsExecutable,
      importsBlocked,
      warnings,
      errors,
      steps: plan.steps,
      nextActions:
        errors.length > 0
          ? ['修复计划错误后重新生成真实 Seed Data Import 草案。']
          : ['进入下一阶段前，在完整 NocoBase 测试工程中接入真实 repository/db、文件存储、事务和回滚实现。'],
    };
  }

  generateRealSeedDataImportSteps(plan: RealSeedDataImportPlan): RealSeedDataImportStep[] {
    return plan.entities
      .slice()
      .sort((left, right) => left.importOrder - right.importOrder)
      .map((entity, index) => ({
        step: `seed-data-import-${String(index + 1).padStart(2, '0')}`,
        title: `规划导入 ${entity.entityType}`,
        entityType: entity.entityType,
        targetCollection: entity.targetCollection,
        mode: plan.mode,
        plannedAction: `按导入顺序 ${entity.importOrder} 校验 ${entity.sourceFile}，再规划写入 ${entity.targetCollection}；本轮不创建记录。`,
        canExecute: plan.mode !== 'real',
        warnings: uniqueStrings([
          ...entity.warnings,
          entity.fileFields.length > 0 ? '包含文件字段，只允许占位导入计划，不上传文件。' : '',
          entity.relationFields.length > 0 ? '包含引用字段，真实导入前必须校验引用完整性。' : '',
        ]),
        errors: plan.mode === 'real' ? ['当前仓库禁止 real 模式。'] : [],
      }));
  }

  generateTransactionPlan(plan: RealSeedDataImportPlan): string[] {
    return [
      '真实阶段必须在隔离测试数据库中开启事务；当前仅生成事务计划，不调用 db.transaction。',
      '按导入顺序逐实体执行：唯一键预检、引用完整性预检、记录转换、文件字段占位校验、批量写入。',
      '任一实体出现唯一键冲突、引用缺失、文件占位不合规或业务规则错误时，必须取消本次事务。',
      'GPS 数据只导入监控 mock 记录，不参与租金计算。',
      '押金记录独立导入，不得计入 rent_payments 或租金已付。',
      `计划覆盖实体：${plan.entities.map((entity) => entity.entityType).join('、')}`,
    ];
  }

  generateRollbackPlan(plan: RealSeedDataImportPlan): string[] {
    return [
      '真实阶段必须先创建备份或可回滚快照；当前仅生成回滚计划，不执行 rollback。',
      '回滚顺序必须与导入顺序相反，优先删除付款分配、台账、合同文件、GPS 明细，再删除合同、车辆、司机等父记录。',
      '文件字段如未来接入真实 storage，必须记录 storage object key，并在事务失败时清理占位或上传对象。',
      '回滚后必须重新执行引用完整性、唯一键和敏感数据校验。',
      `反向回滚实体：${plan.entities
        .slice()
        .sort((left, right) => right.importOrder - left.importOrder)
        .map((entity) => entity.entityType)
        .join('、')}`,
    ];
  }

  generatePostImportValidationPlan(plan: RealSeedDataImportPlan): string[] {
    return [
      '校验每个核心实体记录数与源文件一致。',
      '校验 lease_contracts.driver_id、lease_contracts.vehicle_id、rent_daily_ledgers.contract_id 等引用完整性。',
      '校验所有唯一键无冲突。',
      '校验文件字段仍为 TEST_ 或 MOCK 占位，且字段级权限计划已覆盖。',
      '校验付款必须分配到具体日期，单日不可超付。',
      '校验 GPS 不参与租金计算，押金不计入租金已付。',
      '校验不包含真实证件号、手机号、IOPGPS token、login_key、真实合同扫描件。',
    ];
  }

  private buildSafetyChecks(
    plan: RealSeedDataImportPlan,
    context: RealSeedDataImportContext,
  ): RealSeedDataImportSafetyCheck[] {
    const safety = validateRealSeedDataImportSafety(plan, context);
    const schema = validateRealSeedDataSchemaDraft(plan);
    const noRealData = validateRealSeedDataNoRealData(plan);
    return [
      this.toSafetyCheck('导入执行边界检查', safety),
      this.toSafetyCheck('schema draft 完整性检查', schema),
      this.toSafetyCheck('禁止真实数据检查', noRealData),
    ];
  }

  private toSafetyCheck(name: string, validation: ValidationResult): RealSeedDataImportSafetyCheck {
    return { name, passed: validation.passed, warnings: validation.warnings, errors: validation.errors };
  }
}
