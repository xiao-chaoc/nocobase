/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ContractDocument, ContractDocumentStatus, ContractSignatureStatus } from '../types/contractDocumentTypes';
import { throwContractDocumentError } from './errors';

const allowedTransitions: Record<ContractDocumentStatus, ContractDocumentStatus[]> = {
  draft: ['generated'],
  generated: ['printed', 'voided'],
  printed: ['signed', 'scanned', 'voided'],
  signed: ['scanned', 'voided'],
  scanned: ['voided'],
  voided: ['voided'],
};

export function canTransitionContractDocumentStatus(
  fromStatus: ContractDocumentStatus,
  toStatus: ContractDocumentStatus,
): boolean {
  return allowedTransitions[fromStatus]?.includes(toStatus) ?? false;
}

export function assertContractDocumentStatusTransition(
  fromStatus: ContractDocumentStatus,
  toStatus: ContractDocumentStatus,
): void {
  if (!canTransitionContractDocumentStatus(fromStatus, toStatus)) {
    throwContractDocumentError('contract_document_status_transition_invalid');
  }
}

export function getContractSignatureStatusFromDocuments(documents: ContractDocument[]): ContractSignatureStatus {
  if (!documents || documents.length === 0) return 'not_generated';
  if (documents.every((document) => document.status === 'voided')) return 'voided';
  if (documents.some((document) => document.status === 'scanned')) return 'scanned';
  if (documents.some((document) => document.status === 'signed')) return 'signed';
  if (documents.some((document) => document.status === 'printed')) return 'printed';
  if (documents.some((document) => document.status === 'generated')) return 'generated';
  return 'not_generated';
}
