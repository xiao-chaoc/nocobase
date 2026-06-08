/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { contractDocumentsActionRegistry } from './actions/actionRegistry';
import { contractDocumentsCollectionDraft, contractTemplatesCollectionDraft } from './collections';

export const contractDocumentsPluginRegistration = {
  pluginName: 'plugin-contract-documents',
  pluginTitle: '合同文件插件',
  pluginDescription: '合同模板选择、合同上下文构建、合同文件记录生成、打印状态、签署扫描件状态和作废的服务端骨架。',
  dependencies: ['plugin-rental-core'],
  collections: [contractTemplatesCollectionDraft, contractDocumentsCollectionDraft],
  services: [
    'contractTemplateService: 模板语言校验和模板选择',
    'contractDocumentService: 合同上下文构建、文件记录草案、生成结果',
    'contractPrintService: 打印状态',
    'contractScanService: 签署扫描件状态和作废',
    'contractDocumentStatusService: 合同文件状态流转',
  ],
  permissions: [
    'system_admin/manager/operator 可触发合同文件动作；generated_docx_file、generated_pdf_file、signed_scan_file 必须做服务端权限控制。',
  ],
  i18nNamespaces: ['plugin-contract-documents', 'zh-CN', 'en-US', 'fr-FR'],
  scheduledTasks: [],
  actions: contractDocumentsActionRegistry,
  notes: [
    '本对象只是结构化注册描述，不调用真实 NocoBase API。',
    '本插件不处理租金计算。',
    '本插件不处理付款分配。',
    '本插件不处理 GPS 数据。',
    '本轮不真实生成 Word/PDF，不上传真实合同扫描件。',
  ],
} as const;

export function createContractDocumentsPluginRegistrationPlan() {
  return contractDocumentsPluginRegistration;
}
