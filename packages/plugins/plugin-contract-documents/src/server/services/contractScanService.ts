/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  ContractDocument,
  UploadSignedContractScanInput,
  VoidContractDocumentInput,
  ID,
} from '../types/contractDocumentTypes';
import { assertContractDocumentStatusTransition } from './contractDocumentStatusService';
import { throwContractDocumentError } from './errors';

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export function validateSignedScanUpload(document: ContractDocument, input: UploadSignedContractScanInput): void {
  if (document.status === 'voided') throwContractDocumentError('contract_document_status_transition_invalid');
  if (!['printed', 'signed'].includes(document.status))
    throwContractDocumentError('contract_document_status_transition_invalid');
  if (isBlank(input.signed_scan_file)) throwContractDocumentError('contract_signed_scan_required');
  if (isBlank(input.signed_at)) throwContractDocumentError('contract_signed_at_required');
  if (isBlank(input.uploaded_by)) throwContractDocumentError('contract_uploaded_by_required');
}

export function uploadSignedContractScan(
  document: ContractDocument,
  input: UploadSignedContractScanInput,
): ContractDocument {
  validateSignedScanUpload(document, input);
  assertContractDocumentStatusTransition(document.status, 'scanned');
  return {
    ...document,
    signed_scan_file: input.signed_scan_file,
    signed_at: input.signed_at,
    status: 'scanned',
    updated_at: input.signed_at,
    remark:
      input.remark ?? 'TODO: signed_scan_file 为敏感字段；本轮只保存文件引用，不处理真实上传，预留 operation log。',
  };
}

export function markContractSigned(document: ContractDocument, signedAt: string, signedBy: ID): ContractDocument {
  if (isBlank(signedAt)) throwContractDocumentError('contract_signed_at_required');
  if (isBlank(signedBy)) throwContractDocumentError('contract_uploaded_by_required');
  assertContractDocumentStatusTransition(document.status, 'signed');
  return {
    ...document,
    signed_at: signedAt,
    status: 'signed',
    updated_at: signedAt,
    remark: `线下签署人/记录人：${String(signedBy)}；本轮不处理真实扫描件。`,
  };
}

export function voidContractDocument(document: ContractDocument, input: VoidContractDocumentInput): ContractDocument {
  if (isBlank(input.reason)) throwContractDocumentError('contract_void_reason_required');
  if (isBlank(input.voided_by)) throwContractDocumentError('contract_voided_by_required');
  if (isBlank(input.voided_at)) throwContractDocumentError('contract_signed_at_required');
  assertContractDocumentStatusTransition(document.status, 'voided');
  return {
    ...document,
    status: 'voided',
    voided_at: input.voided_at,
    voided_reason: input.reason,
    updated_at: input.voided_at,
    remark: `作废人：${String(input.voided_by)}。TODO: 预留 operation log。`,
  };
}
