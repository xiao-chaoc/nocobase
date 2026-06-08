/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type ContractDocumentErrorCode =
  | 'contract_language_invalid'
  | 'contract_template_missing'
  | 'contract_template_invalid'
  | 'contract_languages_required'
  | 'contract_document_invalid'
  | 'contract_document_status_invalid'
  | 'contract_document_status_transition_invalid'
  | 'contract_document_not_printable'
  | 'contract_printed_by_required'
  | 'contract_printed_at_required'
  | 'contract_signed_scan_required'
  | 'contract_signed_at_required'
  | 'contract_uploaded_by_required'
  | 'contract_void_reason_required'
  | 'contract_voided_by_required';

export const contractDocumentErrorMessages: Record<ContractDocumentErrorCode, string> = {
  contract_language_invalid: '合同语言无效，仅支持中文、英文、法文。',
  contract_template_missing: '指定语言缺少可用合同模板。',
  contract_template_invalid: '合同模板记录无效。',
  contract_languages_required: '生成合同文件必须至少选择一种语言。',
  contract_document_invalid: '合同文件记录无效。',
  contract_document_status_invalid: '合同文件状态无效。',
  contract_document_status_transition_invalid: '合同文件状态流转无效。',
  contract_document_not_printable: '当前合同文件不允许打印。',
  contract_printed_by_required: '标记打印必须记录打印人。',
  contract_printed_at_required: '标记打印必须记录打印时间。',
  contract_signed_scan_required: '上传签署扫描件必须提供文件引用。',
  contract_signed_at_required: '合同签署必须记录签署时间。',
  contract_uploaded_by_required: '上传签署扫描件必须记录上传人。',
  contract_void_reason_required: '作废合同文件必须填写原因。',
  contract_voided_by_required: '作废合同文件必须记录作废人。',
};

export class ContractDocumentBusinessError extends Error {
  code: ContractDocumentErrorCode;
  constructor(code: ContractDocumentErrorCode, message = contractDocumentErrorMessages[code]) {
    super(message);
    this.name = 'ContractDocumentBusinessError';
    this.code = code;
  }
}

export function throwContractDocumentError(code: ContractDocumentErrorCode): never {
  throw new ContractDocumentBusinessError(code);
}
