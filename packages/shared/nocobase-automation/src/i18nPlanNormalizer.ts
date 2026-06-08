/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocobaseI18nPlan } from './types';

export const requiredRuntimeLanguages = ['zh-CN', 'en-US', 'fr-FR'];

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

export const normalizeI18nPlan = (rawI18nPlan: NocobaseI18nPlan): NocobaseI18nPlan => {
  const namespace = String(rawI18nPlan.namespace ?? '');
  const languages = asStringArray(rawI18nPlan.languages);
  const localeFiles = asStringArray(rawI18nPlan.localeFiles);
  const notes = asStringArray(rawI18nPlan.notes);

  if (!namespace) notes.push('错误：i18n namespace 必须存在。');
  for (const language of requiredRuntimeLanguages) {
    if (!languages.includes(language)) notes.push(`错误：i18n 缺少语言：${language}`);
  }
  if (localeFiles.length === 0) notes.push('错误：i18n 缺少 localeFiles。');
  notes.push('本轮不真实注册 i18n，仅验证三语言资源计划。');

  return {
    namespace,
    sourcePlugin: String(rawI18nPlan.sourcePlugin ?? ''),
    languages,
    localeFiles,
    notes,
  };
};

export const normalizeI18nPlans = (i18nPlans: NocobaseI18nPlan[]): NocobaseI18nPlan[] =>
  i18nPlans.map((i18nPlan) => normalizeI18nPlan(i18nPlan));
