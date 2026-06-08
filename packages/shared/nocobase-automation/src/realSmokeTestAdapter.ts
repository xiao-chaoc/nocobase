/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildFailureIsolationSmokeSteps,
  buildRealSmokeTestPlan,
  buildRollbackSmokeSteps,
} from './realSmokeTestPlanMapper';
import { validateRealSmokeTestPlan, validateRealSmokeTestReportDraft } from './realSmokeTestSafetyChecker';
import type {
  NocobaseRealSmokeTestAdapter,
  RealSmokeTestPlan,
  RealSmokeTestPlanInput,
  RealSmokeTestReportDraft,
  RealSmokeTestStepDraft,
} from './types';

export class RealSmokeTestAdapter implements NocobaseRealSmokeTestAdapter {
  buildRealSmokeTestPlan(input: RealSmokeTestPlanInput): RealSmokeTestPlan {
    return buildRealSmokeTestPlan(input);
  }

  validateRealSmokeTestPlan(plan: RealSmokeTestPlan): RealSmokeTestReportDraft {
    return this.generateRealSmokeTestReportDraft(plan);
  }

  generateRealSmokeTestSteps(plan: RealSmokeTestPlan): RealSmokeTestStepDraft[] {
    return plan.steps.map((step) => ({
      ...step,
      canExecute: false,
      warnings: [...step.warnings, '草案 adapter 只生成步骤，不执行真实测试。'],
    }));
  }

  generateFailureIsolationPlan(plan: RealSmokeTestPlan): RealSmokeTestStepDraft[] {
    return plan.failureIsolationChecks.length > 0 ? plan.failureIsolationChecks : buildFailureIsolationSmokeSteps();
  }

  generateRollbackVerificationPlan(plan: RealSmokeTestPlan): RealSmokeTestStepDraft[] {
    return plan.rollbackChecks.length > 0 ? plan.rollbackChecks : buildRollbackSmokeSteps();
  }

  generateRealSmokeTestReportDraft(plan: RealSmokeTestPlan): RealSmokeTestReportDraft {
    const planValidation = validateRealSmokeTestPlan(plan);
    const errors = [...plan.errors, ...planValidation.errors];
    if (plan.mode === 'real') errors.push('当前仓库不允许真实执行 Smoke Test，草案 adapter 已阻断 real 模式。');
    const warnings = [
      ...plan.warnings,
      ...planValidation.warnings,
      '未连接 NocoBase、未写数据库、未调用 IOPGPS、未生成合同文件。',
    ];
    const stepsExecutable = 0;
    const stepsBlocked = plan.steps.length;
    const blockers = errors.length > 0 ? errors : ['真实 Smoke Test 尚未接入隔离 NocoBase 测试环境，当前不能执行。'];
    const report: RealSmokeTestReportDraft = {
      success: errors.length === 0,
      mode: plan.mode,
      executed: false,
      stagesPlanned: plan.stages.length,
      stepsPlanned: plan.steps.length,
      stepsExecutable,
      stepsBlocked,
      warnings: [...new Set(warnings)],
      errors: [...new Set(errors)],
      blockers: [...new Set(blockers)],
      nextActions:
        errors.length > 0
          ? ['修复真实 Smoke Test 草案错误后重新运行校验脚本。']
          : [
              '准备独立 NocoBase 测试环境、备份、回滚演练、mock 数据和禁用真实 IOPGPS 后，再设计下一阶段真实执行 adapter。',
            ],
    };
    const reportValidation = validateRealSmokeTestReportDraft(report);
    return {
      ...report,
      errors: [...new Set([...report.errors, ...reportValidation.errors])],
      warnings: [...new Set([...report.warnings, ...reportValidation.warnings])],
    };
  }
}
