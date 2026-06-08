/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * plugin-contract-documents 服务端统一导出入口。
 *
 * 当前仅导出合同模板、合同文件状态、打印与签署扫描件状态管理的纯函数、类型和 Collection 草案；
 * 不生成真实 Word/PDF，不调用真实文件存储 API。
 */
export * from './collections';
export * from './services';
export * from './types';

export const contractDocumentsPluginIntegrationPlan = {
  plugin: 'plugin-contract-documents',
  dependsOn: ['plugin-rental-core.lease_contracts', 'plugin-rental-core.drivers', 'plugin-rental-core.vehicles'],
  enableOrder: 2,
  currentStage: '待接入真实 NocoBase 工程的插件源码骨架',
  registrationTodo: [
    '注册 contract_templates、contract_documents 等 Collection',
    '注册合同模板选择、合同文件草稿、生成记录、打印状态、签署扫描件状态等服务端方法',
    '注册合同文档生成/打印/上传动作，后续再接入 NocoBase Template Printing 或其他文档生成服务',
    '注册 generated_docx_file、generated_pdf_file、signed_scan_file 的服务端权限控制和 i18n 资源',
  ],
  notes: [
    '合同文件插件依赖 rental-core 的合同、司机、车辆数据。',
    '合同文件生成或上传失败不能影响租金台账和付款逻辑。',
    '当前入口不调用真实 NocoBase API、LibreOffice 或文件存储 API。',
  ],
} as const;
export * from './actions/actionRegistry';
export * from './pluginRegistration';

export const contractDocumentsI18nRegistrationNotes = {
  namespace: 'plugin-contract-documents',
  locales: ['zh-CN', 'en-US', 'fr-FR'],
  notes: ['后续接入真实 NocoBase 时注册 i18n 资源；当前仅导出说明，不调用真实 API。'],
} as const;
