/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { extractRelations, extractUniqueConstraints, normalizeCollectionPlan } from './collectionPlanNormalizer';
import type {
  CollectionFieldPlan,
  CollectionIndexPlan,
  CollectionRelationPlan,
  RealCollectionFieldSchemaDraft,
  RealCollectionIndexSchemaDraft,
  RealCollectionRelationSchemaDraft,
  RealCollectionSchemaDraft,
  NocobaseCollectionPlan,
} from './types';

const fieldTypeDraftMap: Record<string, { nocobaseFieldType: string; warning?: string }> = {
  string: { nocobaseFieldType: 'text' },
  text: { nocobaseFieldType: 'text' },
  id: { nocobaseFieldType: 'integer', warning: 'id 字段在真实 NocoBase 中可能需要与主键或自动编号策略对齐。' },
  integer: { nocobaseFieldType: 'integer' },
  number: { nocobaseFieldType: 'decimal', warning: 'number 字段暂按 decimal 草案处理，真实精度需在 NocoBase 中确认。' },
  decimal: { nocobaseFieldType: 'decimal' },
  boolean: { nocobaseFieldType: 'boolean' },
  date: { nocobaseFieldType: 'date' },
  datetime: { nocobaseFieldType: 'datetime' },
  enum: {
    nocobaseFieldType: 'select',
    warning: 'enum 字段暂映射为 select/enum 草案，真实选项结构需在 NocoBase 中确认。',
  },
  json: { nocobaseFieldType: 'json' },
  file: { nocobaseFieldType: 'file', warning: 'file 字段暂映射为文件/附件草案，真实存储与权限策略需后续确认。' },
  fileList: {
    nocobaseFieldType: 'file',
    warning: 'fileList 字段暂映射为多文件/附件草案，真实存储与权限策略需后续确认。',
  },
  relation: { nocobaseFieldType: 'relation', warning: 'relation 字段只保留关系计划，本轮不注册真实关系。' },
  password: { nocobaseFieldType: 'password', warning: 'password 字段需要真实 NocoBase 安全字段能力验证。' },
  encrypted: { nocobaseFieldType: 'encrypted', warning: 'encrypted 字段需要真实 NocoBase 加密字段能力验证。' },
  encryptedText: { nocobaseFieldType: 'encrypted', warning: 'encrypted text 字段需要真实 NocoBase 加密字段能力验证。' },
};

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function mapRelationPlanToRealRelationDraft(
  relationPlan: CollectionRelationPlan,
): RealCollectionRelationSchemaDraft {
  const warnings: string[] = [];
  if (!relationPlan.targetCollection) warnings.push('关系目标 Collection 缺失，真实注册前必须补齐。');
  if (!relationPlan.foreignKey) warnings.push('关系外键缺失，真实注册前必须补齐。');
  return {
    sourceCollection: relationPlan.sourceCollection,
    sourceField: relationPlan.sourceField,
    targetCollection: relationPlan.targetCollection,
    relationType: relationPlan.relationType,
    foreignKey: relationPlan.foreignKey,
    targetKey: relationPlan.targetKey,
    notes: [...relationPlan.notes, '本轮仅生成关系草案，不调用 app.collection 或 db.collection 注册真实关系。'],
    warnings,
  };
}

export function mapIndexPlanToRealIndexDraft(indexPlan: CollectionIndexPlan): RealCollectionIndexSchemaDraft {
  const warnings: string[] = [];
  if (indexPlan.fields.length === 0) warnings.push('索引字段为空，真实注册前必须补齐。');
  return {
    name: indexPlan.name,
    fields: [...indexPlan.fields],
    unique: indexPlan.unique,
    notes: [...indexPlan.notes, '本轮仅保留索引/唯一约束草案，不执行数据库索引创建。'],
    warnings,
  };
}

export function mapFieldPlanToRealFieldSchemaDraft(fieldPlan: CollectionFieldPlan): RealCollectionFieldSchemaDraft {
  const normalizedType = fieldPlan.relation ? 'relation' : fieldPlan.type;
  const mapping = fieldTypeDraftMap[normalizedType] ?? fieldTypeDraftMap[normalizedType.replace(/\s+/g, '')];
  const notes = [...fieldPlan.notes];
  const unsupportedReason = mapping ? undefined : `字段类型 ${fieldPlan.type} 尚未确认真实 NocoBase 字段 API。`;
  if (mapping?.warning) notes.push(mapping.warning);
  if (fieldPlan.sensitive) notes.push('敏感字段必须在真实 adapter 中接入字段级权限、脱敏和导出控制。');
  return {
    name: fieldPlan.name,
    type: fieldPlan.type,
    title: fieldPlan.title,
    required: fieldPlan.required,
    defaultValue: fieldPlan.defaultValue,
    enumValues: [...fieldPlan.enumValues],
    relation: fieldPlan.relation ? mapRelationPlanToRealRelationDraft(fieldPlan.relation) : undefined,
    sensitive: fieldPlan.sensitive,
    unique: fieldPlan.unique,
    index: fieldPlan.index,
    nocobaseFieldType: mapping?.nocobaseFieldType,
    unsupportedReason,
    notes,
  };
}

export function mapCollectionPlanToRealSchemaDraft(collectionPlan: NocobaseCollectionPlan): RealCollectionSchemaDraft {
  const normalized = normalizeCollectionPlan(collectionPlan);
  const fields = (normalized.fieldPlans ?? []).map(mapFieldPlanToRealFieldSchemaDraft);
  const relations = extractRelations(normalized).map(mapRelationPlanToRealRelationDraft);
  const indexes = (normalized.indexPlans ?? []).map(mapIndexPlanToRealIndexDraft);
  const uniqueConstraints = extractUniqueConstraints(normalized).map((constraint) => [...constraint]);
  const unsupportedFeatures = uniqueStrings(
    fields.flatMap((field) => (field.unsupportedReason ? [`${field.name}: ${field.unsupportedReason}`] : [])),
  );
  const warnings = uniqueStrings([
    ...fields.flatMap((field) =>
      field.notes.filter((note) => note.includes('需') || note.includes('暂') || note.includes('真实')),
    ),
    ...relations.flatMap((relation) => relation.warnings),
    ...indexes.flatMap((index) => index.warnings),
  ]);
  return {
    name: normalized.name,
    title: normalized.title,
    fields,
    indexes,
    uniqueConstraints,
    relations,
    sensitiveFields: [...normalized.sensitiveFields],
    sourcePlugin: normalized.sourcePlugin,
    nocobaseSchemaNotes: [
      ...normalized.notes,
      '这是 NocoBase Collection schema 草案，不是真实 NocoBase API 请求体。',
      '本轮不连接 NocoBase、不写数据库、不执行 migration。',
    ],
    unsupportedFeatures,
    warnings,
  };
}
