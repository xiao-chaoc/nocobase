/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  AutomatedGoLiveRegistrationPlan,
  CollectionRegistrationBatchResult,
  NocobaseCollectionPlan,
} from './types';
import { normalizeCollectionPlans } from './collectionPlanNormalizer';
import { MockCollectionAdapter } from './mockCollectionAdapter';
import {
  validateCollectionRegistrationPlan,
  validateCriticalCollections,
  validateCriticalUniqueConstraints,
  validateSensitiveFields,
} from './collectionRegistrationValidator';

export const buildCollectionRegistrationPlanFromAutomatedPlan = (
  automatedPlan: AutomatedGoLiveRegistrationPlan,
): NocobaseCollectionPlan[] => normalizeCollectionPlans(automatedPlan.collections);

const emptyBatchResult = (
  collectionPlans: NocobaseCollectionPlan[],
  errors: string[],
  warnings: string[],
  criticalUniqueConstraintsPassed: boolean,
  sensitiveFieldsPassed: boolean,
): CollectionRegistrationBatchResult => ({
  success: false,
  results: [],
  warnings,
  errors,
  summary: {
    totalCollections: collectionPlans.length,
    successCount: 0,
    createdCount: 0,
    skippedCount: 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    criticalUniqueConstraintsPassed,
    sensitiveFieldsPassed,
    dryRunOnly: true,
  },
});

export const dryRunRegisterCollections = (
  collectionPlans: NocobaseCollectionPlan[],
): CollectionRegistrationBatchResult => {
  const normalized = normalizeCollectionPlans(collectionPlans);
  const fullValidation = validateCollectionRegistrationPlan(normalized);
  const criticalCollections = validateCriticalCollections(normalized);
  const uniqueRules = validateCriticalUniqueConstraints(normalized);
  const sensitiveFields = validateSensitiveFields(normalized);
  const warnings = [
    '本次 Collection 注册仅为 dry-run，不连接真实 NocoBase。',
    '本次 Collection 注册不写数据库、不执行 migration、不创建真实表。',
  ];

  if (!fullValidation.passed || !criticalCollections.passed || !uniqueRules.passed || !sensitiveFields.passed) {
    return emptyBatchResult(
      normalized,
      [...fullValidation.errors, ...criticalCollections.errors, ...uniqueRules.errors, ...sensitiveFields.errors],
      [
        ...warnings,
        ...fullValidation.warnings,
        ...criticalCollections.warnings,
        ...uniqueRules.warnings,
        ...sensitiveFields.warnings,
      ],
      uniqueRules.passed,
      sensitiveFields.passed,
    );
  }

  const adapter = new MockCollectionAdapter();
  const result = adapter.registerCollections(normalized);
  const combinedWarnings = [...warnings, ...result.warnings];

  return {
    ...result,
    success: result.success,
    warnings: combinedWarnings,
    summary: {
      ...result.summary,
      warningCount: combinedWarnings.length,
      criticalUniqueConstraintsPassed: uniqueRules.passed,
      sensitiveFieldsPassed: sensitiveFields.passed,
      dryRunOnly: true,
    },
  };
};

export const summarizeCollectionRegistrationResult = (result: CollectionRegistrationBatchResult): string => {
  const lines = [
    `Collection dry-run 总数：${result.summary.totalCollections}`,
    `成功数量：${result.summary.successCount}`,
    `创建记录数量：${result.summary.createdCount}`,
    `跳过数量：${result.summary.skippedCount}`,
    `错误数量：${result.summary.errorCount}`,
    `警告数量：${result.summary.warningCount}`,
    `关键唯一约束状态：${result.summary.criticalUniqueConstraintsPassed ? '通过' : '未通过'}`,
    `敏感字段覆盖状态：${result.summary.sensitiveFieldsPassed ? '通过' : '未通过'}`,
    `dry-run 限制：不连接真实 NocoBase，不写数据库，不执行 migration。`,
  ];

  return lines.join('\n');
};
