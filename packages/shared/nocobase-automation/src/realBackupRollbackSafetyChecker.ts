/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RealBackupPlan,
  RealBackupRollbackContext,
  RealFailureRecoveryPlan,
  RealRollbackPlan,
  ValidationResult,
} from './types';
import { realBackupTargets, realFailureTypes, realRollbackTargets } from './realBackupRollbackPlanBuilder';

function result(errors: string[], warnings: string[] = []): ValidationResult {
  return { passed: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

function serialized(value: unknown): string {
  return JSON.stringify(value).toLowerCase();
}

export function validateRealBackupRollbackSafety(
  plan: RealBackupPlan | RealRollbackPlan,
  context: RealBackupRollbackContext,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const mode = context.mode ?? plan.mode;

  if (!mode) errors.push('mode 缺失，不能默认为 real。');
  if (mode === 'real') {
    errors.push('当前仓库环境下不能执行 real。');
    errors.push('当前仓库不允许真实生产环境执行。');
    errors.push('当前仓库不允许真实恢复数据库。');
    errors.push('当前仓库不允许真实删除 storage。');
    if (!context.allowRealExecution) errors.push('mode=real 时必须 allowRealExecution=true。');
    if (!context.requireOperatorConfirmation) errors.push('mode=real 时必须 requireOperatorConfirmation=true。');
    if (!context.requireIsolatedDatabase) errors.push('mode=real 时必须 requireIsolatedDatabase=true。');
    if (!context.requireMockDataOnly) errors.push('mode=real 时必须 requireMockDataOnly=true。');
    if (!context.requireIopgpsDisabled) errors.push('mode=real 时必须 requireIopgpsDisabled=true。');
    if (context.adapterEnvironment.status !== 'ready')
      errors.push(`adapterEnvironment.status=${context.adapterEnvironment.status}，不能执行 real。`);
  }

  if (!context.backupDirectory) errors.push('缺少 backupDirectory。');
  if (!context.rollbackDirectory) errors.push('缺少 rollbackDirectory。');

  const text = serialized({ plan, context: { ...context, adapterEnvironment: undefined } });
  if (
    text.includes('db_password=') ||
    text.includes('password=真实') ||
    text.includes('secret=') ||
    text.includes('iopgps_token=')
  ) {
    errors.push('计划中疑似包含真实密码或密钥。');
  }
  if (text.includes('.env.test 值') || text.includes('读取 .env.test 真实值'))
    warnings.push('计划必须保持只记录 .env.test 存在性，不读取真实值。');
  if (text.includes('production_ready') || text.includes('生产部署完成')) errors.push('计划不得包含生产部署完成声明。');

  warnings.push('备份文件不得进入 Git。');
  warnings.push('当前草案不得执行 pg_dump、pg_restore、storage 删除或数据库恢复。');
  return result(errors, warnings);
}

export function validateRealBackupPlan(plan?: RealBackupPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!plan) return result(['backupPlan 缺失。']);
  if (!plan.targets?.length) errors.push('backupPlan.targets 不能为空。');
  if (!plan.steps?.length) errors.push('backupPlan.steps 不能为空。');
  for (const target of ['database', 'file_storage', 'plugin_storage', 'logs', 'environment_config']) {
    if (!plan.targets.includes(target as any)) errors.push(`backupPlan 缺少目标：${target}。`);
  }
  for (const target of realBackupTargets) {
    if (!plan.steps.some((step) => step.targetType === target)) errors.push(`backupPlan 缺少步骤：${target}。`);
  }
  if (plan.mode === 'real') errors.push('当前仓库下 backupPlan 不能使用 real 模式。');
  for (const step of plan.steps ?? []) {
    if (step.executed) errors.push(`备份步骤 ${step.name} 不得标记为已执行。`);
    if (step.canExecute) errors.push(`当前仓库下备份步骤 ${step.name} 不能可执行。`);
  }
  const text = serialized(plan);
  if (text.includes('db_password=') || text.includes('secret=') || text.includes('iopgps_token='))
    errors.push('backupPlan 疑似包含真实密码或密钥。');
  if (text.includes('读取 .env.test 真实值')) errors.push('backupPlan 不允许读取 .env.test 真实值。');
  warnings.push('backupPlan 当前仅允许 plan_only、validate_only 或 dry_run 草案。');
  return result(errors, warnings);
}

export function validateRealRollbackPlan(plan?: RealRollbackPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!plan) return result(['rollbackPlan 缺失。']);
  if (!plan.triggerConditions?.length) errors.push('rollbackPlan.triggerConditions 不能为空。');
  if (!plan.steps?.length) errors.push('rollbackPlan.steps 不能为空。');
  if (!plan.verificationSteps?.length) errors.push('rollbackPlan.verificationSteps 不能为空。');
  for (const target of ['database_restore', 'file_storage_restore', 'plugin_disable', 'logs_preserve']) {
    if (!plan.targets.includes(target as any)) errors.push(`rollbackPlan 缺少目标：${target}。`);
  }
  for (const target of realRollbackTargets) {
    if (!plan.steps.some((step) => step.targetType === target)) errors.push(`rollbackPlan 缺少步骤：${target}。`);
  }
  if (plan.mode === 'real') errors.push('当前仓库下 rollbackPlan 不能使用 real 模式。');
  for (const step of plan.steps ?? []) {
    if (step.executed) errors.push(`回滚步骤 ${step.name} 不得标记为已执行。`);
    if (step.canExecute) errors.push(`当前仓库下回滚步骤 ${step.name} 不能可执行。`);
  }
  warnings.push('rollbackPlan 当前仅允许不可执行草案。');
  return result(errors, warnings);
}

export function validateFailureRecoveryPlans(plans?: RealFailureRecoveryPlan[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!plans?.length) return result(['failureRecoveryPlans 不能为空。']);
  for (const failureType of realFailureTypes) {
    const plan = plans.find((item) => item.failureType === failureType);
    if (!plan) {
      errors.push(`缺少失败恢复计划：${failureType}。`);
      continue;
    }
    if (!plan.detectionMethod) errors.push(`${failureType} 缺少 detectionMethod。`);
    if (!plan.isolationSteps?.length) errors.push(`${failureType} 缺少 isolationSteps。`);
    if (!plan.rollbackSteps?.length) errors.push(`${failureType} 缺少 rollbackSteps。`);
    if (!plan.verificationSteps?.length) errors.push(`${failureType} 缺少 verificationSteps。`);
    if (!plan.escalationSteps?.length) errors.push(`${failureType} 缺少 escalationSteps。`);
    if (plan.mode === 'real') errors.push(`${failureType} 当前仓库不能使用 real 模式。`);
  }
  warnings.push('failureRecoveryPlans 当前只描述隔离、回滚、验证和升级处理，不执行动作。');
  return result(errors, warnings);
}
