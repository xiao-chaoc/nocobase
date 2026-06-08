/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RealCollectionRegistrationContext,
  RealCollectionRegistrationPlan,
  RealCollectionRegistrationSafetyCheck,
  RealCollectionSchemaDraft,
  ValidationResult,
} from './types';

function makeCheck(
  name: string,
  errors: string[] = [],
  warnings: string[] = [],
): RealCollectionRegistrationSafetyCheck {
  return { name, passed: errors.length === 0, warnings, errors };
}

function containsAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

function stringifySchema(schemaDraft: RealCollectionSchemaDraft): string {
  return [
    schemaDraft.name,
    schemaDraft.title,
    schemaDraft.sourcePlugin,
    schemaDraft.fields.map((field) => `${field.name} ${field.type} ${field.title} ${field.notes.join(' ')}`).join(' '),
    schemaDraft.relations
      .map(
        (relation) =>
          `${relation.sourceCollection} ${relation.sourceField} ${relation.targetCollection} ${relation.notes.join(
            ' ',
          )}`,
      )
      .join(' '),
    schemaDraft.nocobaseSchemaNotes.join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

export function validateRealCollectionSchemaDraft(schemaDraft: RealCollectionSchemaDraft): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const name = schemaDraft.name.toLowerCase();
  const joined = stringifySchema(schemaDraft);

  if (!schemaDraft.name) errors.push('Collection 名称缺失。');
  if (schemaDraft.fields.length === 0) errors.push(`Collection ${schemaDraft.name || '(未命名)'} 字段为空。`);
  if (!schemaDraft.sourcePlugin) errors.push(`Collection ${schemaDraft.name || '(未命名)'} 缺少 sourcePlugin。`);
  if (!Array.isArray(schemaDraft.uniqueConstraints))
    errors.push(`Collection ${schemaDraft.name} 未保留 uniqueConstraints。`);
  if (!Array.isArray(schemaDraft.sensitiveFields))
    errors.push(`Collection ${schemaDraft.name} 未保留 sensitiveFields。`);

  for (const relation of schemaDraft.relations) {
    if (!relation.targetCollection)
      warnings.push(
        `Collection ${schemaDraft.name} 的关系 ${relation.sourceField} 缺少目标 Collection，真实注册前必须确认。`,
      );
  }

  if (['bookings', 'reservations', 'short_rental_orders'].includes(name))
    errors.push(`禁止注册短租或预订 Collection：${schemaDraft.name}。`);
  if (['driver_login', 'customer_portal'].includes(name))
    errors.push(`禁止注册司机登录或客户门户 Collection：${schemaDraft.name}。`);
  if (name === 'vehicle_category_rental') errors.push('禁止注册按车型出租 Collection：vehicle_category_rental。');

  if (containsAny(joined, ['gps 参与租金计算', 'gps参与租金计算', 'gps rent calculation', 'gps billing'])) {
    errors.push(`Collection ${schemaDraft.name} 违反规则：GPS 数据不得参与租金计算。`);
  }
  if (containsAny(joined, ['押金计入租金已付', 'deposit counts as paid rent', 'deposit paid rent'])) {
    errors.push(`Collection ${schemaDraft.name} 违反规则：押金不得计入租金已付。`);
  }

  return { passed: errors.length === 0, errors, warnings };
}

export function validateRealCollectionRegistrationSafety(
  plan: RealCollectionRegistrationPlan,
  context: RealCollectionRegistrationContext,
): RealCollectionRegistrationSafetyCheck[] {
  const checks: RealCollectionRegistrationSafetyCheck[] = [];
  const mode = context.mode ?? plan.mode;

  checks.push(
    makeCheck(
      '真实模式不得作为默认模式',
      mode === 'real' && !context.allowRealExecution ? ['当前上下文未显式允许真实执行，禁止进入 real 模式。'] : [],
    ),
  );
  checks.push(
    makeCheck(
      '禁止真实数据库写入',
      mode === 'real' ? ['当前仓库环境禁止真实执行数据库写入、Collection 创建和 migration。'] : [],
    ),
  );
  checks.push(
    makeCheck(
      '当前仓库禁止 real 模式',
      mode === 'real' ? ['当前 Codex Web 仓库只允许 plan_only、validate_only 或 dry_run，不允许 real。'] : [],
    ),
  );
  checks.push(
    makeCheck(
      '禁止生产环境真实执行',
      mode === 'real' ? ['当前仓库没有生产 NocoBase 运行时、事务、回滚和审批边界，禁止生产环境真实执行。'] : [],
    ),
  );

  if (mode === 'real') {
    checks.push(
      makeCheck(
        'real 模式必须显式允许',
        context.allowRealExecution ? [] : ['mode=real 时必须 allowRealExecution=true。'],
      ),
    );
    checks.push(
      makeCheck('real 模式必须要求备份', context.requireBackup ? [] : ['mode=real 时必须 requireBackup=true。']),
    );
    checks.push(
      makeCheck(
        'real 模式必须要求回滚方案',
        context.requireRollbackPlan ? [] : ['mode=real 时必须 requireRollbackPlan=true。'],
      ),
    );
    checks.push(
      makeCheck(
        'adapter 环境必须 ready',
        context.adapterEnvironment.status === 'ready'
          ? []
          : [`adapterEnvironment.status=${context.adapterEnvironment.status}，不能执行 real。`],
      ),
    );
  }

  checks.push(makeCheck('回滚计划必须存在', plan.rollbackPlan.length > 0 ? [] : ['缺少 rollbackPlan。']));

  for (const collection of plan.collections) {
    const result = validateRealCollectionSchemaDraft(collection);
    checks.push(
      makeCheck(`Collection schema 安全检查：${collection.name || '(未命名)'}`, result.errors, result.warnings),
    );
  }

  return checks;
}
