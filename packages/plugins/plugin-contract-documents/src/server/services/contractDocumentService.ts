/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  BuildContractRenderContextInput,
  ContractDocument,
  ContractDocumentGenerationInput,
  ContractDocumentGenerationResult,
  ContractDocumentStatus,
  ContractLanguage,
  ContractTemplate,
  ContractTemplateRenderContext,
  ID,
} from '../types/contractDocumentTypes';
import { assertContractDocumentStatusTransition } from './contractDocumentStatusService';
import { selectTemplatesForLanguages, validateContractLanguage } from './contractTemplateService';
import { throwContractDocumentError } from './errors';

const documentStatuses: ContractDocumentStatus[] = ['draft', 'generated', 'printed', 'signed', 'scanned', 'voided'];
function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}
function nowIso(input?: string): string {
  return input ?? new Date().toISOString();
}
function temporaryDocumentNo(contractId: ID, language: ContractLanguage): string {
  return `TODO-DOC-${String(contractId)}-${language}-${Date.now()}`;
}

export function buildContractRenderContext(input: BuildContractRenderContextInput): ContractTemplateRenderContext {
  validateContractLanguage(input.language);
  return {
    contract: input.contract,
    driver: input.driver,
    vehicle: input.vehicle,
    deposit: input.deposit,
    billing_rule: input.billing_rule ?? (input.contract as Record<string, unknown>).billing_rule,
    company: input.company,
    language: input.language,
    generated_at: input.generated_at,
  };
}

export function buildContractDocumentDraft(
  contractId: ID,
  template: ContractTemplate,
  language: ContractLanguage,
  requestedBy: ID,
): ContractDocument {
  if (isBlank(contractId) || isBlank(template?.template_id)) throwContractDocumentError('contract_document_invalid');
  validateContractLanguage(language);
  const createdAt = new Date().toISOString();
  return {
    document_id: temporaryDocumentNo(contractId, language),
    document_no: `TODO:由编号服务生成-${String(contractId)}-${language}`,
    contract_id: contractId,
    template_id: template.template_id,
    language,
    status: 'draft',
    created_at: createdAt,
    updated_at: createdAt,
    remark: `由 ${String(requestedBy)} 请求生成；本轮不写数据库。`,
  };
}

export function generateContractDocuments(
  input: ContractDocumentGenerationInput,
  templates: ContractTemplate[],
): ContractDocumentGenerationResult {
  if (!input.languages || input.languages.length === 0) throwContractDocumentError('contract_languages_required');
  const { selected_templates, missing_languages } = selectTemplatesForLanguages(templates, input.languages);
  const documents = selected_templates.map((template) => {
    const draft = buildContractDocumentDraft(input.contract_id, template, template.language, input.requested_by);
    assertContractDocumentStatusTransition(draft.status, 'generated');
    return {
      ...draft,
      status: 'generated' as const,
      generated_docx_file: undefined,
      generated_pdf_file: undefined,
      updated_at: input.requested_at,
      remark: 'TODO: 后续接入 NocoBase Template Printing 或其他文档生成服务；本轮不真实生成 docx/pdf。',
    };
  });
  return {
    contract_id: input.contract_id,
    documents,
    missing_templates: missing_languages,
    warnings: missing_languages.map((language) => `缺少 ${language} 可用合同模板。`),
  };
}

export function buildContractDocumentFileName(
  contract: { contract_no?: string; contract_id?: ID },
  language: ContractLanguage,
  extension: 'docx' | 'pdf',
): string {
  validateContractLanguage(language);
  const contractNo = contract.contract_no ?? `CONTRACT-${String(contract.contract_id ?? 'UNKNOWN')}`;
  const safeContractNo = String(contractNo).replace(/[^A-Za-z0-9_-]/g, '');
  return `${safeContractNo}.${language}.${extension}`;
}

export function validateContractDocument(document: ContractDocument): ContractDocument {
  if (!document || isBlank(document.contract_id) || isBlank(document.template_id))
    throwContractDocumentError('contract_document_invalid');
  validateContractLanguage(document.language);
  if (!documentStatuses.includes(document.status)) throwContractDocumentError('contract_document_status_invalid');
  if (document.signed_scan_file && !['signed', 'scanned'].includes(document.status))
    throwContractDocumentError('contract_document_invalid');
  if (document.status === 'voided' && isBlank(document.voided_reason))
    throwContractDocumentError('contract_void_reason_required');
  return document;
}

/** 预留真实渲染入口：本轮不生成 Word/PDF，只返回 TODO 文件引用。 */
export async function renderContractDocument(
  contractId: ID,
  templateId: ID,
  language: ContractLanguage,
): Promise<{ docxFile?: unknown; pdfFile?: unknown }> {
  validateContractLanguage(language);
  if (isBlank(contractId) || isBlank(templateId)) throwContractDocumentError('contract_document_invalid');
  return { docxFile: undefined, pdfFile: undefined };
}

export { nowIso };
