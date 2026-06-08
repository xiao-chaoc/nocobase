/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SeedDataEntityType, SeedDataImportInput, SeedDataImportResult } from './types';
import { MockSeedDataAdapter } from './mockSeedDataAdapter';
import { buildSeedDataImportPlan } from './seedDataImportPlan';
import {
  validateDepositBusinessRules,
  validateGpsMockRules,
  validateNoSensitiveRealData,
  validatePaymentAllocationBusinessRules,
  validateRentLedgerBusinessRules,
  validateSeedDataFilesExist,
  validateSeedDataImportPlan,
  validateSeedDataReferences,
  validateSeedDataUniqueKeys,
} from './seedDataImportValidator';

export const dryRunImportSeedData = (input: SeedDataImportInput): SeedDataImportResult => {
  const adapter = new MockSeedDataAdapter();
  const importPlan = input.importPlan.entities.length > 0 ? input.importPlan : buildSeedDataImportPlan();
  const normalizedInput = { ...input, importPlan, dryRun: true };
  const dataByEntity = adapter.loadSeedData(normalizedInput) as Record<SeedDataEntityType, unknown[]>;
  const validations = [
    validateSeedDataImportPlan(importPlan),
    validateSeedDataFilesExist(importPlan, input.sourceDir),
    validateSeedDataReferences(dataByEntity),
    validateSeedDataUniqueKeys(dataByEntity),
    validateNoSensitiveRealData(dataByEntity),
    validateRentLedgerBusinessRules(dataByEntity),
    validatePaymentAllocationBusinessRules(dataByEntity),
    validateDepositBusinessRules(dataByEntity),
    validateGpsMockRules(dataByEntity),
  ];
  const errors = validations.flatMap((validation) => validation.errors);
  const warnings = [
    ...importPlan.warnings,
    ...validations.flatMap((validation) => validation.warnings),
    '测试数据导入仅为 dry-run，不连接真实 NocoBase，不写数据库。',
  ];
  if (errors.length > 0) {
    return {
      success: false,
      entityResults: [],
      warnings,
      errors,
      summary: {
        entityTypeCount: importPlan.entities.length,
        totalRecords: 0,
        validRecords: 0,
        skippedRecords: 0,
        failedRecords: 0,
        warningCount: warnings.length,
        errorCount: errors.length,
        canEnterSmokeTest: false,
        dryRunOnly: true,
      },
    };
  }
  return adapter.importEntities(normalizedInput, dataByEntity);
};

export const summarizeSeedDataImportResult = (result: SeedDataImportResult): string =>
  new MockSeedDataAdapter().summarizeImportResult(result);
