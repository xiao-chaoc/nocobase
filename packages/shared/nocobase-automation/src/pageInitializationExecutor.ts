/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PageInitializationPlan, PageInitializationResult } from './types';
import { MockPageAdapter } from './mockPageAdapter';
import {
  validatePageForbiddenPatterns,
  validatePageInitializationPlan,
  validateRequiredPageActions,
  validateSensitivePageFields,
} from './pageInitializationValidator';

const emptyPageResult = (
  plan: PageInitializationPlan,
  errors: string[],
  warnings: string[],
): PageInitializationResult => ({
  success: false,
  menuResults: [],
  pageResults: [],
  blockResults: [],
  filterResults: [],
  actionResults: [],
  warnings,
  errors,
  summary: {
    menuCount: plan.menus.length,
    pageCount: plan.pages.length,
    blockCount: plan.blocks.length,
    filterCount: plan.filters.length,
    pageActionCount: plan.actions.length,
    successCount: 0,
    registeredCount: 0,
    skippedCount: 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    dryRunOnly: true,
  },
});

export const dryRunInitializePages = (pagePlan: PageInitializationPlan): PageInitializationResult => {
  const validations = [
    validatePageInitializationPlan(pagePlan),
    validatePageForbiddenPatterns(pagePlan),
    validateSensitivePageFields(pagePlan),
    validateRequiredPageActions(pagePlan),
  ];
  const errors = validations.flatMap((validation) => validation.errors);
  const warnings = [
    ...pagePlan.warnings,
    ...validations.flatMap((validation) => validation.warnings),
    '本次页面初始化仅为 dry-run，不连接真实 NocoBase。',
    '本次页面初始化不创建真实页面、菜单、区块、筛选器或按钮动作。',
  ];

  if (errors.length > 0) {
    return emptyPageResult(pagePlan, errors, warnings);
  }

  const adapter = new MockPageAdapter();
  const menuResults = adapter.registerMenus(pagePlan.menus);
  const pageResults = adapter.registerPages(pagePlan.pages);
  const blockResults = adapter.registerBlocks(pagePlan.blocks);
  const filterResults = adapter.registerFilters(pagePlan.filters);
  const actionResults = adapter.registerPageActions(pagePlan.actions);
  const allResults = [...menuResults, ...pageResults, ...blockResults, ...filterResults, ...actionResults];
  const resultWarnings = [...warnings, ...allResults.flatMap((result) => result.warnings)];
  const resultErrors = allResults.flatMap((result) => result.errors);

  return {
    success: allResults.every((result) => result.success) && resultErrors.length === 0,
    menuResults,
    pageResults,
    blockResults,
    filterResults,
    actionResults,
    warnings: resultWarnings,
    errors: resultErrors,
    summary: {
      menuCount: menuResults.length,
      pageCount: pageResults.length,
      blockCount: blockResults.length,
      filterCount: filterResults.length,
      pageActionCount: actionResults.length,
      successCount: allResults.filter((result) => result.success).length,
      registeredCount: allResults.filter((result) => result.registered).length,
      skippedCount: allResults.filter((result) => result.skipped).length,
      errorCount: resultErrors.length,
      warningCount: resultWarnings.length,
      dryRunOnly: true,
    },
  };
};

export const summarizePageInitializationResult = (result: PageInitializationResult): string =>
  [
    `菜单数量：${result.summary.menuCount}`,
    `页面数量：${result.summary.pageCount}`,
    `区块数量：${result.summary.blockCount}`,
    `筛选器数量：${result.summary.filterCount}`,
    `页面动作数量：${result.summary.pageActionCount}`,
    `成功数量：${result.summary.successCount}`,
    `注册记录数量：${result.summary.registeredCount}`,
    `跳过数量：${result.summary.skippedCount}`,
    `错误数量：${result.summary.errorCount}`,
    `警告数量：${result.summary.warningCount}`,
    'dry-run 限制：不连接真实 NocoBase，不创建真实页面、菜单、区块、筛选器或按钮动作。',
  ].join('\n');
