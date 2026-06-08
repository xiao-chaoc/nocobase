/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：contract_documents（合同文件表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const contractDocumentsCollectionDraft = {
  name: 'contract_documents',
  title: '合同文件表',
  fields: [
    'document_id',
    'document_no',
    'contract_id',
    'template_id',
    'language',
    'generated_docx_file',
    'generated_pdf_file',
    'printed_at',
    'signed_at',
    'signed_scan_file',
    'status',
    'voided_at',
    'voided_reason',
    'created_at',
    'updated_at',
    'remark',
  ],
  indexes: ['contract_id', 'template_id', 'language', 'status'],
  uniqueConstraints: [['document_no']],
  sensitiveFields: ['generated_docx_file', 'generated_pdf_file', 'signed_scan_file'],
  relations: [
    {
      field: 'contract_id',
      target: 'lease_contracts.contract_id',
      type: 'externalPluginReference',
    },
    {
      field: 'template_id',
      target: 'contract_templates.template_id',
      type: 'belongsTo',
    },
  ],
  notes: [
    'document_no 必须唯一。',
    'signed_scan_file 是敏感字段。',
    'generated_docx_file/generated_pdf_file 可能包含司机个人信息，必须做服务端权限控制。',
    'voided 文件不能继续打印或上传扫描件。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
