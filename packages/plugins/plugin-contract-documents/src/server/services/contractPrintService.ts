/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ContractDocument, MarkContractPrintedInput } from '../types/contractDocumentTypes';
import { assertContractDocumentStatusTransition } from './contractDocumentStatusService';
import { throwContractDocumentError } from './errors';

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export function validatePrintableDocument(document: ContractDocument): ContractDocument {
  if (document.status !== 'generated') throwContractDocumentError('contract_document_not_printable');
  // 本轮允许 generated_docx_file/generated_pdf_file 为空，因为尚未真实生成文件；真实接入后应至少存在一个文件引用。
  return document;
}

export function buildPrintRecordPatch(
  document: ContractDocument,
  input: MarkContractPrintedInput,
): Pick<ContractDocument, 'status' | 'printed_at' | 'remark'> {
  validatePrintableDocument(document);
  if (isBlank(input.printed_at)) throwContractDocumentError('contract_printed_at_required');
  if (isBlank(input.printed_by)) throwContractDocumentError('contract_printed_by_required');
  return { status: 'printed', printed_at: input.printed_at, remark: input.remark };
}

export function markContractPrinted(document: ContractDocument, input: MarkContractPrintedInput): ContractDocument {
  assertContractDocumentStatusTransition(document.status, 'printed');
  const patch = buildPrintRecordPatch(document, input);
  return {
    ...document,
    ...patch,
    updated_at: input.printed_at,
    remark: patch.remark ?? 'TODO: 预留 operation log，真实打印动作不在本轮处理。',
  };
}
