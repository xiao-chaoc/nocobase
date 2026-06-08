/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CollectionRegistrationBatchResult,
  CollectionRegistrationResult,
  NocobaseCollectionAdapter,
  NocobaseCollectionPlan,
  ValidationResult,
} from './types';
import { normalizeCollectionPlan } from './collectionPlanNormalizer';

const emptyStepResult = (
  collectionPlan: NocobaseCollectionPlan,
  step: string,
  warnings: string[] = [],
): CollectionRegistrationResult => ({
  collectionName: collectionPlan.name,
  sourcePlugin: collectionPlan.sourcePlugin,
  success: true,
  created: false,
  skipped: false,
  warnings,
  errors: [],
  steps: [step],
});

export class MockCollectionAdapter implements NocobaseCollectionAdapter {
  private readonly registeredCollections = new Map<string, NocobaseCollectionPlan>();

  checkCollectionExists(collectionName: string): boolean {
    return this.registeredCollections.has(collectionName);
  }

  validateCollectionPlan(collectionPlan: NocobaseCollectionPlan): ValidationResult {
    const normalized = normalizeCollectionPlan(collectionPlan);
    const errors: string[] = [];
    const fieldSet = new Set(normalized.fields);

    if (!normalized.name) {
      errors.push('Collection name 必须存在。');
    }

    if (!normalized.title) {
      errors.push(`Collection title 必须存在：${normalized.name || '<未命名>'}`);
    }

    if (normalized.fields.length === 0) {
      errors.push(`Collection fields 必须存在且非空：${normalized.name || '<未命名>'}`);
    }

    for (const field of normalized.fieldPlans ?? []) {
      if (!field.name) {
        errors.push(`字段 name 必须存在：${normalized.name}`);
      }
      if (!field.type) {
        errors.push(`字段 type 必须存在：${normalized.name}.${field.name || '<未命名字段>'}`);
      }
    }

    for (const field of normalized.sensitiveFields) {
      if (!fieldSet.has(field)) {
        errors.push(`sensitiveFields 中字段不存在：${normalized.name}.${field}`);
      }
    }

    for (const fields of normalized.uniqueConstraints) {
      for (const field of fields) {
        if (!fieldSet.has(field)) {
          errors.push(`uniqueConstraints 中字段不存在：${normalized.name}.${field}`);
        }
      }
    }

    for (const index of normalized.indexPlans ?? []) {
      for (const field of index.fields) {
        if (!fieldSet.has(field)) {
          errors.push(`indexes 中字段不存在：${normalized.name}.${field}`);
        }
      }
    }

    for (const relation of normalized.relationPlans ?? []) {
      if (!relation.targetCollection) {
        errors.push(`关系字段必须有目标 Collection：${normalized.name}.${relation.sourceField}`);
      }
    }

    return { passed: errors.length === 0, errors, warnings: [] };
  }

  ensureIndexes(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    const normalized = normalizeCollectionPlan(collectionPlan);
    return emptyStepResult(
      normalized,
      `dry-run：检查并记录 ${normalized.name} 的索引计划，不连接真实 NocoBase，不执行数据库变更。`,
    );
  }

  ensureUniqueConstraints(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    const normalized = normalizeCollectionPlan(collectionPlan);
    return emptyStepResult(normalized, `dry-run：检查并记录 ${normalized.name} 的唯一约束计划，不执行 migration。`);
  }

  ensureRelations(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    const normalized = normalizeCollectionPlan(collectionPlan);
    return emptyStepResult(normalized, `dry-run：检查并记录 ${normalized.name} 的关系字段计划，不创建真实外键。`);
  }

  markSensitiveFields(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    const normalized = normalizeCollectionPlan(collectionPlan);
    return emptyStepResult(normalized, `dry-run：检查并记录 ${normalized.name} 的敏感字段标记，不写入真实权限配置。`);
  }

  registerCollection(collectionPlan: NocobaseCollectionPlan): CollectionRegistrationResult {
    const normalized = normalizeCollectionPlan(collectionPlan);
    const validation = this.validateCollectionPlan(normalized);

    if (!validation.passed) {
      return {
        collectionName: normalized.name,
        sourcePlugin: normalized.sourcePlugin,
        success: false,
        created: false,
        skipped: false,
        warnings: validation.warnings,
        errors: validation.errors,
        steps: [`dry-run：${normalized.name || '<未命名 Collection>'} 校验失败，未记录注册。`],
      };
    }

    if (this.checkCollectionExists(normalized.name)) {
      return {
        collectionName: normalized.name,
        sourcePlugin: normalized.sourcePlugin,
        success: true,
        created: false,
        skipped: true,
        warnings: [`Collection 已存在于 mock adapter：${normalized.name}，本次 dry-run 跳过。`],
        errors: [],
        steps: [`dry-run：检测到 ${normalized.name} 已记录，跳过重复注册。`],
      };
    }

    const steps = [
      `dry-run：开始注册 Collection ${normalized.name}，不连接真实 NocoBase。`,
      ...this.ensureIndexes(normalized).steps,
      ...this.ensureUniqueConstraints(normalized).steps,
      ...this.ensureRelations(normalized).steps,
      ...this.markSensitiveFields(normalized).steps,
      `dry-run：将 ${normalized.name} 写入内存 mock registry，不写数据库、不执行 migration。`,
    ];

    this.registeredCollections.set(normalized.name, normalized);

    return {
      collectionName: normalized.name,
      sourcePlugin: normalized.sourcePlugin,
      success: true,
      created: true,
      skipped: false,
      warnings: ['本结果仅为 dry-run，真实 NocoBase adapter 尚未接入。'],
      errors: [],
      steps,
    };
  }

  registerCollections(collectionPlans: NocobaseCollectionPlan[]): CollectionRegistrationBatchResult {
    const results = collectionPlans.map((collectionPlan) => this.registerCollection(collectionPlan));
    const warnings = results.flatMap((result) => result.warnings);
    const errors = results.flatMap((result) => result.errors);

    return {
      success: results.every((result) => result.success),
      results,
      warnings,
      errors,
      summary: {
        totalCollections: collectionPlans.length,
        successCount: results.filter((result) => result.success).length,
        createdCount: results.filter((result) => result.created).length,
        skippedCount: results.filter((result) => result.skipped).length,
        errorCount: errors.length,
        warningCount: warnings.length,
        criticalUniqueConstraintsPassed: true,
        sensitiveFieldsPassed: true,
        dryRunOnly: true,
      },
    };
  }
}
