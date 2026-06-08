/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Collection 注册草案：contract_templates（合同模板表）。
 * 当前对象用于整理后续 NocoBase 接入形态，不是数据库迁移，也未调用真实 NocoBase API。
 */
export const contractTemplatesCollectionDraft = {
  name: 'contract_templates',
  title: '合同模板表',
  fields: [
    'template_id',
    'template_no',
    'name',
    'language',
    'version',
    'template_file',
    'is_default',
    'status',
    'created_at',
    'updated_at',
    'remark',
  ],
  indexes: ['language', 'status', 'is_default'],
  uniqueConstraints: [['template_no']],
  sensitiveFields: [],
  relations: [],
  notes: [
    '支持 zh-CN、en-US、fr-FR。',
    'template_file 是模板文件引用；模板文件不应包含真实签署合同或真实司机资料。',
    'version 必须保留，is_default 用于选择默认模板。',
    '当前仅为 Collection 注册草案，不是数据库迁移。',
  ],
} as const;
