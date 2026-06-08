/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface ContractDocumentActionDraft {
  name: string;
  title: string;
  input: string[];
  output: string;
  requiredRoles: string[];
  callsService: string;
  failureScenarios: string[];
  writesDatabase: false;
  handlesRealFile: false;
}

export const contractDocumentsActionRegistry: ContractDocumentActionDraft[] = [
  {
    name: 'generate_contract_documents',
    title: '生成合同文件记录',
    input: ['contract_id', 'languages'],
    output: '合同文件记录草案和缺失模板列表',
    requiredRoles: ['system_admin', 'manager', 'operator'],
    callsService: 'contractDocumentService',
    failureScenarios: ['缺少语言', '缺少模板'],
    writesDatabase: false,
    handlesRealFile: false,
  },
  {
    name: 'mark_contract_printed',
    title: '标记合同已打印',
    input: ['document_id', 'printed_by', 'printed_at'],
    output: '打印状态 patch',
    requiredRoles: ['system_admin', 'manager', 'operator'],
    callsService: 'contractPrintService',
    failureScenarios: ['合同文件不可打印', '缺少打印人或时间'],
    writesDatabase: false,
    handlesRealFile: false,
  },
  {
    name: 'upload_signed_contract_scan',
    title: '登记签署扫描件',
    input: ['document_id', 'signed_scan_file', 'signed_at', 'uploaded_by'],
    output: '扫描件状态 patch',
    requiredRoles: ['system_admin', 'manager', 'operator'],
    callsService: 'contractScanService',
    failureScenarios: ['扫描件缺失', '状态不允许上传'],
    writesDatabase: false,
    handlesRealFile: false,
  },
  {
    name: 'void_contract_document',
    title: '作废合同文件',
    input: ['document_id', 'reason', 'voided_by', 'voided_at'],
    output: '作废状态 patch',
    requiredRoles: ['system_admin', 'manager'],
    callsService: 'contractScanService',
    failureScenarios: ['缺少作废原因', '作废人缺失'],
    writesDatabase: false,
    handlesRealFile: false,
  },
];
