/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type ID = string | number;

export type ContractLanguage = 'zh-CN' | 'en-US' | 'fr-FR';
export type ContractTemplateStatus = 'active' | 'inactive' | 'archived';
export type ContractDocumentStatus = 'draft' | 'generated' | 'printed' | 'signed' | 'scanned' | 'voided';
export type ContractSignatureStatus = 'not_generated' | 'generated' | 'printed' | 'signed' | 'scanned' | 'voided';

export interface ContractTemplate {
  template_id: ID;
  template_no: string;
  name: string;
  language: ContractLanguage;
  version: string;
  /** 模板文件引用；模板不应包含真实签署合同或真实司机资料。 */
  template_file: unknown;
  is_default: boolean;
  status: ContractTemplateStatus;
  created_at: string;
  updated_at: string;
  remark?: string;
}

export interface ContractDocument {
  document_id: ID;
  document_no: string;
  contract_id: ID;
  template_id: ID;
  language: ContractLanguage;
  /** 生成文件可能包含司机个人信息，应按敏感文件做权限控制。 */
  generated_docx_file?: unknown;
  /** 生成文件可能包含司机个人信息，应按敏感文件做权限控制。 */
  generated_pdf_file?: unknown;
  printed_at?: string;
  signed_at?: string;
  /** 敏感字段：线下签署扫描件仅保存文件引用，本轮不处理真实上传。 */
  signed_scan_file?: unknown;
  status: ContractDocumentStatus;
  voided_at?: string;
  voided_reason?: string;
  created_at: string;
  updated_at: string;
  remark?: string;
}

export interface ContractDocumentGenerationInput {
  contract_id: ID;
  languages: ContractLanguage[];
  contract_data: Record<string, unknown>;
  requested_by: ID;
  requested_at: string;
}

export interface ContractTemplateRenderContext {
  contract: unknown;
  driver: unknown;
  vehicle: unknown;
  deposit?: unknown;
  billing_rule?: unknown;
  company?: unknown;
  language: ContractLanguage;
  generated_at: string;
}

export interface ContractDocumentGenerationResult {
  contract_id: ID;
  documents: ContractDocument[];
  missing_templates: ContractLanguage[];
  warnings: string[];
}

export interface MarkContractPrintedInput {
  document_id: ID;
  printed_by: ID;
  printed_at: string;
  remark?: string;
}

export interface UploadSignedContractScanInput {
  document_id: ID;
  signed_scan_file: unknown;
  signed_at: string;
  uploaded_by: ID;
  remark?: string;
}

export interface VoidContractDocumentInput {
  document_id: ID;
  reason: string;
  voided_by: ID;
  voided_at: string;
}

export interface BuildContractRenderContextInput {
  contract: Record<string, unknown>;
  driver: Record<string, unknown>;
  vehicle: Record<string, unknown>;
  deposit?: unknown;
  billing_rule?: unknown;
  company?: unknown;
  language: ContractLanguage;
  generated_at: string;
}

export interface TemplateSelectionResult {
  selected_templates: ContractTemplate[];
  missing_languages: ContractLanguage[];
}

export interface GenerateContractDocumentsInput {
  contractId: ID;
  languages: ContractLanguage[];
}
