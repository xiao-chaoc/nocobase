/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

declare const require: any;

import type {
  NocobaseSeedDataAdapter,
  SeedDataEntityImportResult,
  SeedDataEntityPlan,
  SeedDataEntityType,
  SeedDataImportInput,
  SeedDataImportPlan,
  SeedDataImportResult,
  ValidationResult,
} from './types';
import {
  validateSeedDataForImport,
  validateSeedDataReferences,
  validateSeedDataUniqueKeys,
  type SeedDataByEntity,
} from './seedDataImportValidator';

const fs = require('fs');
const path = require('path');

const emptySummary = (entityResults: SeedDataEntityImportResult[], warnings: string[], errors: string[]) => {
  const totalRecords = entityResults.reduce((sum, item) => sum + item.totalRecords, 0);
  const validRecords = entityResults.reduce((sum, item) => sum + item.validRecords, 0);
  const skippedRecords = entityResults.reduce((sum, item) => sum + item.skippedRecords, 0);
  const failedRecords = entityResults.reduce((sum, item) => sum + item.failedRecords, 0);
  return {
    entityTypeCount: entityResults.length,
    totalRecords,
    validRecords,
    skippedRecords,
    failedRecords,
    warningCount: warnings.length + entityResults.reduce((sum, item) => sum + item.warnings.length, 0),
    errorCount: errors.length + entityResults.reduce((sum, item) => sum + item.errors.length, 0),
    canEnterSmokeTest: errors.length === 0 && failedRecords === 0,
    dryRunOnly: true as const,
  };
};

export class MockSeedDataAdapter implements NocobaseSeedDataAdapter {
  private readonly importedUniqueKeys = new Map<SeedDataEntityType, Set<string>>();

  loadSeedData(input: SeedDataImportInput): Record<SeedDataEntityType, unknown[]> {
    const data = {} as Record<SeedDataEntityType, unknown[]>;
    for (const entity of input.importPlan.entities) {
      const filePath = path.join(input.sourceDir, entity.sourceFile);
      data[entity.entityType] = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
    }
    return data;
  }

  validateSeedData(input: SeedDataImportInput, dataByEntity: Record<SeedDataEntityType, unknown[]>): ValidationResult {
    return validateSeedDataForImport(input.importPlan, dataByEntity as SeedDataByEntity);
  }

  checkDependencies(_plan: SeedDataImportPlan, dataByEntity: Record<SeedDataEntityType, unknown[]>): ValidationResult {
    return validateSeedDataReferences(dataByEntity as SeedDataByEntity);
  }

  checkUniqueKeys(_plan: SeedDataImportPlan, dataByEntity: Record<SeedDataEntityType, unknown[]>): ValidationResult {
    return validateSeedDataUniqueKeys(dataByEntity as SeedDataByEntity);
  }

  importEntity(entityPlan: SeedDataEntityPlan, records: unknown[]): SeedDataEntityImportResult {
    const warnings = ['本结果仅为 dry-run，未连接真实 NocoBase，未写数据库，未上传文件。'];
    const errors: string[] = [];
    const steps = [`dry-run：准备导入 ${entityPlan.entityType}，目标 Collection：${entityPlan.targetCollection}。`];
    const importedSet = this.importedUniqueKeys.get(entityPlan.entityType) ?? new Set<string>();
    this.importedUniqueKeys.set(entityPlan.entityType, importedSet);
    let skippedRecords = 0;
    let validRecords = 0;

    for (const record of records as any[]) {
      const uniqueParts = entityPlan.uniqueKeys
        .map((keys) =>
          keys
            .map((key) => record?.[key])
            .filter((value) => value !== undefined && value !== null && value !== '')
            .join('::'),
        )
        .filter(Boolean);
      const uniqueValue = uniqueParts[0] ?? JSON.stringify(record).slice(0, 80);
      if (importedSet.has(uniqueValue)) {
        skippedRecords += 1;
        continue;
      }
      importedSet.add(uniqueValue);
      validRecords += 1;
    }

    steps.push(`dry-run：记录 ${entityPlan.entityType} ${validRecords} 条，不写入数据库。`);
    if (skippedRecords > 0) steps.push(`dry-run：根据唯一键跳过重复记录 ${skippedRecords} 条。`);

    return {
      entityType: entityPlan.entityType,
      sourceFile: entityPlan.sourceFile,
      targetCollection: entityPlan.targetCollection,
      totalRecords: records.length,
      validRecords,
      skippedRecords,
      failedRecords: errors.length > 0 ? records.length : 0,
      warnings,
      errors,
      steps,
    };
  }

  importEntities(
    input: SeedDataImportInput,
    dataByEntity: Record<SeedDataEntityType, unknown[]>,
  ): SeedDataImportResult {
    const validation = this.validateSeedData(input, dataByEntity);
    const warnings = [
      ...input.importPlan.warnings,
      ...validation.warnings,
      'mock 测试数据导入 dry-run 不连接真实 NocoBase、不写数据库、不上传文件。',
    ];
    if (!validation.passed) {
      return {
        success: false,
        entityResults: [],
        warnings,
        errors: validation.errors,
        summary: emptySummary([], warnings, validation.errors),
      };
    }
    const entityResults = input.importPlan.importOrder.map((entityType) => {
      const entityPlan = input.importPlan.entities.find((entity) => entity.entityType === entityType);
      if (!entityPlan) {
        return {
          entityType,
          sourceFile: '',
          targetCollection: entityType,
          totalRecords: 0,
          validRecords: 0,
          skippedRecords: 0,
          failedRecords: 0,
          warnings: [],
          errors: [`缺少实体导入计划：${entityType}`],
          steps: [`dry-run：${entityType} 缺少计划，未导入。`],
        };
      }
      return this.importEntity(entityPlan, dataByEntity[entityType] ?? []);
    });
    const errors = entityResults.flatMap((item) => item.errors);
    return {
      success: errors.length === 0,
      entityResults,
      warnings,
      errors,
      summary: emptySummary(entityResults, warnings, errors),
    };
  }

  rollbackImport(result: SeedDataImportResult): SeedDataImportResult {
    return {
      ...result,
      warnings: [...result.warnings, 'dry-run：模拟回滚导入记录，未连接数据库。'],
      summary: { ...result.summary, canEnterSmokeTest: false },
    };
  }

  summarizeImportResult(result: SeedDataImportResult): string {
    return [
      `实体类型数量：${result.summary.entityTypeCount}`,
      `总记录数：${result.summary.totalRecords}`,
      `有效记录数：${result.summary.validRecords}`,
      `跳过记录数：${result.summary.skippedRecords}`,
      `失败记录数：${result.summary.failedRecords}`,
      `警告数量：${result.summary.warningCount}`,
      `错误数量：${result.summary.errorCount}`,
      `是否可进入 smoke test：${result.summary.canEnterSmokeTest ? '是' : '否'}`,
      'dry-run 限制：不连接真实 NocoBase，不写数据库，不上传文件。',
    ].join('\n');
  }
}
