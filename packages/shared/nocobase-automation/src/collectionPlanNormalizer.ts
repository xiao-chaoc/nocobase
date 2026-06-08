/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CollectionFieldPlan,
  CollectionIndexPlan,
  CollectionRelationPlan,
  CollectionRelationType,
  NocobaseCollectionPlan,
} from './types';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function inferFieldType(fieldName: string): string {
  if (fieldName.endsWith('_id')) return 'id';
  if (fieldName.endsWith('_no')) return 'string';
  if (fieldName.endsWith('_file')) return 'file';
  if (fieldName.endsWith('_files')) return 'fileList';
  if (fieldName.endsWith('_amount') || fieldName.includes('amount') || fieldName.endsWith('_km')) return 'number';
  if (
    fieldName.endsWith('_days') ||
    fieldName.endsWith('_seconds') ||
    fieldName.endsWith('_minutes') ||
    fieldName.endsWith('_hours') ||
    fieldName === 'year'
  )
    return 'number';
  if (fieldName.endsWith('_at') || fieldName.endsWith('_time')) return 'datetime';
  if (fieldName.endsWith('_date') || fieldName === 'start_date' || fieldName === 'end_date') return 'date';
  if (fieldName.startsWith('is_') || fieldName.endsWith('_enabled')) return 'boolean';
  if (
    fieldName === 'status' ||
    fieldName.endsWith('_status') ||
    fieldName === 'language' ||
    fieldName === 'contract_type'
  )
    return 'enum';
  if (fieldName === 'raw_response' || fieldName.endsWith('_raw')) return 'json';
  return 'string';
}

function parseTarget(target: string): { targetCollection: string; targetKey: string } {
  const [targetCollection, targetKey = 'id'] = target.split('.');
  return { targetCollection, targetKey };
}

function normalizeRelation(sourceCollection: string, rawRelation: unknown): CollectionRelationPlan {
  const relation = asRecord(rawRelation);
  const sourceField = String(relation.field ?? relation.sourceField ?? '');
  const target = String(relation.target ?? '');
  const parsed = parseTarget(target);
  return {
    sourceCollection,
    sourceField,
    targetCollection: String(relation.targetCollection ?? parsed.targetCollection ?? ''),
    relationType: String(relation.type ?? relation.relationType ?? 'belongsTo') as CollectionRelationType,
    foreignKey: String(relation.foreignKey ?? sourceField),
    targetKey: String(relation.targetKey ?? parsed.targetKey ?? 'id'),
    notes: asStringArray(relation.notes),
  };
}

function normalizeField(
  collectionName: string,
  rawField: unknown,
  plan: NocobaseCollectionPlan,
  relationPlans: CollectionRelationPlan[],
): CollectionFieldPlan {
  const fieldRecord = asRecord(rawField);
  const name = typeof rawField === 'string' ? rawField : String(fieldRecord.name ?? '');
  const relation = relationPlans.find((item) => item.sourceCollection === collectionName && item.sourceField === name);
  return {
    name,
    type: String(fieldRecord.type ?? inferFieldType(name)),
    title: String(fieldRecord.title ?? name),
    required: Boolean(fieldRecord.required ?? false),
    defaultValue: fieldRecord.defaultValue,
    enumValues: asStringArray(fieldRecord.enumValues),
    relation,
    sensitive: plan.sensitiveFields.includes(name) || Boolean(fieldRecord.sensitive),
    unique: plan.uniqueConstraints.some((constraint) => constraint.includes(name)),
    index: plan.indexes.includes(name) || plan.uniqueConstraints.some((constraint) => constraint.includes(name)),
    notes: asStringArray(fieldRecord.notes),
  };
}

function buildIndexName(collectionName: string, fields: string[], unique: boolean): string {
  return `${collectionName}_${fields.join('_')}_${unique ? 'unique' : 'idx'}`;
}

export function normalizeCollectionPlan(rawCollectionPlan: NocobaseCollectionPlan): NocobaseCollectionPlan {
  const name = rawCollectionPlan.name || '';
  const title = rawCollectionPlan.title || name;
  const fields = asStringArray(rawCollectionPlan.fields);
  const indexes = asStringArray(rawCollectionPlan.indexes);
  const uniqueConstraints = Array.isArray(rawCollectionPlan.uniqueConstraints)
    ? rawCollectionPlan.uniqueConstraints.map((constraint) => asStringArray(constraint))
    : [];
  const sensitiveFields = asStringArray(rawCollectionPlan.sensitiveFields);
  const relations = Array.isArray(rawCollectionPlan.relations) ? rawCollectionPlan.relations : [];
  const base: NocobaseCollectionPlan = {
    ...rawCollectionPlan,
    name,
    title,
    fields,
    indexes,
    uniqueConstraints,
    sensitiveFields,
    relations,
    sourcePlugin: rawCollectionPlan.sourcePlugin || 'unknown-plugin',
    notes: asStringArray(rawCollectionPlan.notes),
  };
  const relationPlans = relations.map((relation) => normalizeRelation(name, relation));
  const fieldPlans =
    rawCollectionPlan.fieldPlans && rawCollectionPlan.fieldPlans.length > 0
      ? rawCollectionPlan.fieldPlans.map((field) => ({
          ...field,
          title: field.title || field.name,
          required: Boolean(field.required),
          sensitive: sensitiveFields.includes(field.name) || field.sensitive,
        }))
      : fields.map((field) => normalizeField(name, field, base, relationPlans));
  const indexPlans: CollectionIndexPlan[] = [
    ...indexes.map((field) => ({
      name: buildIndexName(name, [field], false),
      fields: [field],
      unique: false,
      notes: ['由 indexes 自动转换。'],
    })),
    ...uniqueConstraints.map((fieldsInConstraint) => ({
      name: buildIndexName(name, fieldsInConstraint, true),
      fields: fieldsInConstraint,
      unique: true,
      notes: ['由 uniqueConstraints 自动转换。'],
    })),
  ];
  return { ...base, fieldPlans, indexPlans, relationPlans };
}

export function normalizeCollectionPlans(collections: NocobaseCollectionPlan[]): NocobaseCollectionPlan[] {
  return collections.map((collection) => normalizeCollectionPlan(collection));
}

export function extractSensitiveFields(collectionPlan: NocobaseCollectionPlan): string[] {
  const normalized = normalizeCollectionPlan(collectionPlan);
  return [
    ...new Set([
      ...(normalized.sensitiveFields ?? []),
      ...(normalized.fieldPlans ?? []).filter((field) => field.sensitive).map((field) => field.name),
    ]),
  ];
}

export function extractUniqueConstraints(collectionPlan: NocobaseCollectionPlan): string[][] {
  const normalized = normalizeCollectionPlan(collectionPlan);
  const fromIndexes = (normalized.indexPlans ?? []).filter((index) => index.unique).map((index) => index.fields);
  return [...normalized.uniqueConstraints, ...fromIndexes].filter(
    (constraint, index, array) => array.findIndex((item) => item.join('|') === constraint.join('|')) === index,
  );
}

export function extractRelations(collectionPlan: NocobaseCollectionPlan): CollectionRelationPlan[] {
  return normalizeCollectionPlan(collectionPlan).relationPlans ?? [];
}
