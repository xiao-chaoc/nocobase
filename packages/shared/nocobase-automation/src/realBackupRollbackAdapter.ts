/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildFailureRecoveryPlans,
  buildRealBackupPlan,
  buildRealRollbackPlan,
  createRealBackupRollbackContext,
} from './realBackupRollbackPlanBuilder';
import {
  validateFailureRecoveryPlans,
  validateRealBackupPlan,
  validateRealBackupRollbackSafety,
  validateRealRollbackPlan,
} from './realBackupRollbackSafetyChecker';
import type {
  NocobaseRealBackupRollbackAdapter,
  RealBackupPlan,
  RealBackupRollbackContext,
  RealBackupRollbackReport,
  RealFailureRecoveryPlan,
  RealRollbackPlan,
} from './types';

export class RealBackupRollbackAdapter implements NocobaseRealBackupRollbackAdapter {
  buildRealBackupPlan(context: Partial<RealBackupRollbackContext> = {}): RealBackupPlan {
    return buildRealBackupPlan(context);
  }

  buildRealRollbackPlan(context: Partial<RealBackupRollbackContext> = {}): RealRollbackPlan {
    return buildRealRollbackPlan(context);
  }

  buildFailureRecoveryPlans(context: Partial<RealBackupRollbackContext> = {}): RealFailureRecoveryPlan[] {
    return buildFailureRecoveryPlans(context);
  }

  validateBackupRollbackPlans(report: RealBackupRollbackReport): RealBackupRollbackReport {
    const context = createRealBackupRollbackContext({ mode: report.mode });
    const backupValidation = validateRealBackupPlan(report.backupPlan);
    const rollbackValidation = validateRealRollbackPlan(report.rollbackPlan);
    const failureValidation = validateFailureRecoveryPlans(report.failureRecoveryPlans);
    const backupSafety = validateRealBackupRollbackSafety(report.backupPlan, context);
    const rollbackSafety = validateRealBackupRollbackSafety(report.rollbackPlan, context);
    const warnings = [
      ...report.warnings,
      ...backupValidation.warnings,
      ...rollbackValidation.warnings,
      ...failureValidation.warnings,
      ...backupSafety.warnings,
      ...rollbackSafety.warnings,
    ];
    const errors = [
      ...report.errors,
      ...backupValidation.errors,
      ...rollbackValidation.errors,
      ...failureValidation.errors,
      ...backupSafety.errors,
      ...rollbackSafety.errors,
    ];
    const blockers = [...report.blockers, ...errors];
    return {
      ...report,
      success: errors.length === 0 && report.mode !== 'real',
      executed: false,
      backupsExecutable: 0,
      rollbacksExecutable: 0,
      warnings: [...new Set(warnings)],
      errors: [...new Set(errors)],
      blockers: [...new Set(blockers)],
      nextActions: [
        ...new Set([...report.nextActions, '进入下一阶段前，在完整 NocoBase 隔离测试工程中复核备份和回滚执行器。']),
      ],
    };
  }

  generateBackupRollbackReport(input: Partial<RealBackupRollbackContext> = {}): RealBackupRollbackReport {
    const context = createRealBackupRollbackContext(input);
    const backupPlan = this.buildRealBackupPlan(context);
    const rollbackPlan = this.buildRealRollbackPlan(context);
    const failureRecoveryPlans = this.buildFailureRecoveryPlans(context);
    const initial: RealBackupRollbackReport = {
      success: context.mode !== 'real',
      mode: context.mode,
      executed: false,
      backupPlan,
      rollbackPlan,
      failureRecoveryPlans,
      backupsExecutable: 0,
      rollbacksExecutable: 0,
      warnings: [
        '当前只生成真实 Backup / Rollback 草案，不连接 NocoBase。',
        '当前不执行 pg_dump、pg_restore、文件删除、storage 修改或插件回滚。',
      ],
      errors: context.mode === 'real' ? ['当前仓库不允许真实执行 Backup / Rollback。'] : [],
      blockers: context.mode === 'real' ? ['real 模式被草案 adapter 阻止。'] : [],
      nextActions: [
        '保留本轮生成的计划草案用于评审。',
        '下一阶段准备完整 NocoBase 隔离测试工程、mock 数据、storage snapshot 和人工确认机制。',
      ],
    };
    return this.validateBackupRollbackPlans(initial);
  }
}
