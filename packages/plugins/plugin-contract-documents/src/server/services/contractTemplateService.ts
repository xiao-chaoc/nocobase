/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  ContractLanguage,
  ContractTemplate,
  ContractTemplateStatus,
  TemplateSelectionResult,
} from '../types/contractDocumentTypes';
import { throwContractDocumentError } from './errors';

export const contractLanguages: ContractLanguage[] = ['zh-CN', 'en-US', 'fr-FR'];
const templateStatuses: ContractTemplateStatus[] = ['active', 'inactive', 'archived'];

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export function validateContractLanguage(language: unknown): ContractLanguage {
  if (!contractLanguages.includes(language as ContractLanguage)) {
    throwContractDocumentError('contract_language_invalid');
  }
  return language as ContractLanguage;
}

function compareVersionDesc(a: ContractTemplate, b: ContractTemplate): number {
  return String(b.version).localeCompare(String(a.version), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * 返回指定语言的可用模板；缺少模板时返回 null，由生成服务统一汇总 missing_templates。
 */
export function getContractTemplateByLanguage(
  templates: ContractTemplate[],
  language: ContractLanguage,
): ContractTemplate | null {
  validateContractLanguage(language);
  const activeTemplates = templates.filter(
    (template) => template.language === language && template.status === 'active',
  );
  const defaultTemplate = activeTemplates.find((template) => template.is_default);
  if (defaultTemplate) return defaultTemplate;
  return [...activeTemplates].sort(compareVersionDesc)[0] ?? null;
}

export function validateContractTemplate(template: ContractTemplate): ContractTemplate {
  if (
    !template ||
    isBlank(template.template_no) ||
    isBlank(template.name) ||
    isBlank(template.version) ||
    isBlank(template.template_file)
  ) {
    throwContractDocumentError('contract_template_invalid');
  }
  validateContractLanguage(template.language);
  if (!templateStatuses.includes(template.status)) {
    throwContractDocumentError('contract_template_invalid');
  }
  return template;
}

export function selectTemplatesForLanguages(
  templates: ContractTemplate[],
  languages: ContractLanguage[],
): TemplateSelectionResult {
  if (!languages || languages.length === 0) {
    throwContractDocumentError('contract_languages_required');
  }
  const selected_templates: ContractTemplate[] = [];
  const missing_languages: ContractLanguage[] = [];
  const uniqueLanguages = Array.from(new Set(languages.map((language) => validateContractLanguage(language))));
  for (const language of uniqueLanguages) {
    const template = getContractTemplateByLanguage(templates, language);
    if (template) selected_templates.push(validateContractTemplate(template));
    else missing_languages.push(language);
  }
  return { selected_templates, missing_languages };
}
