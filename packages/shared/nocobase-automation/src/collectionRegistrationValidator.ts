/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocobaseCollectionPlan, ValidationResult } from './types';
import { normalizeCollectionPlans } from './collectionPlanNormalizer';

const FORBIDDEN_COLLECTION_NAMES = ['bookings', 'reservations', 'short_rental_orders'];
const FORBIDDEN_DRIVER_LOGIN_TERMS = ['driver_login', 'customer_portal'];
const FORBIDDEN_VEHICLE_CATEGORY_TERMS = ['vehicle_category_rental'];

export const CRITICAL_COLLECTIONS = [
  'drivers',
  'vehicles',
  'lease_contracts',
  'rent_daily_ledgers',
  'rent_payments',
  'rent_payment_allocations',
  'deposit_records',
  'operation_logs',
  'gps_devices',
  'gps_daily_mileages',
  'iopgps_settings',
  'contract_templates',
  'contract_documents',
];

export const CRITICAL_UNIQUE_CONSTRAINTS: Array<{ collection: string; fields: string[] }> = [
  { collection: 'drivers', fields: ['driver_no'] },
  { collection: 'vehicles', fields: ['vehicle_no'] },
  { collection: 'vehicles', fields: ['plate_no'] },
  { collection: 'lease_contracts', fields: ['contract_no'] },
  { collection: 'rent_daily_ledgers', fields: ['contract_id', 'rent_date'] },
  { collection: 'rent_payments', fields: ['payment_no'] },
  { collection: 'deposit_records', fields: ['deposit_no'] },
  { collection: 'gps_devices', fields: ['imei'] },
  { collection: 'gps_daily_mileages', fields: ['device_id', 'mileage_date'] },
  { collection: 'contract_templates', fields: ['template_no'] },
  { collection: 'contract_documents', fields: ['document_no'] },
];

export const REQUIRED_SENSITIVE_FIELDS: Array<{ collection: string; field: string }> = [
  { collection: 'drivers', field: 'id_no' },
  { collection: 'drivers', field: 'id_front_file' },
  { collection: 'drivers', field: 'id_back_file' },
  { collection: 'drivers', field: 'license_front_file' },
  { collection: 'drivers', field: 'license_back_file' },
  { collection: 'rent_payments', field: 'screenshot_file' },
  { collection: 'rent_payments', field: 'method' },
  { collection: 'deposit_records', field: 'required_amount' },
  { collection: 'deposit_records', field: 'received_amount' },
  { collection: 'deposit_records', field: 'screenshot_file' },
  { collection: 'iopgps_settings', field: 'login_key_encrypted' },
  { collection: 'iopgps_settings', field: 'access_token' },
  { collection: 'contract_documents', field: 'signed_scan_file' },
  { collection: 'contract_documents', field: 'generated_docx_file' },
  { collection: 'contract_documents', field: 'generated_pdf_file' },
];

const mergeResults = (...results: ValidationResult[]): ValidationResult => ({
  passed: results.every((result) => result.passed),
  errors: results.flatMap((result) => result.errors),
  warnings: results.flatMap((result) => result.warnings),
});

const sameFieldSet = (actual: string[], expected: string[]): boolean =>
  actual.length === expected.length && expected.every((field) => actual.includes(field));

const hasUniqueConstraint = (collection: NocobaseCollectionPlan, expectedFields: string[]): boolean => {
  const normalized = normalizeCollectionPlans([collection])[0];
  const uniqueConstraints = [
    ...normalized.uniqueConstraints,
    ...(normalized.indexPlans ?? []).filter((index) => index.unique).map((index) => index.fields),
  ];

  return uniqueConstraints.some((fields) => sameFieldSet(fields, expectedFields));
};

const collectionByName = (collectionPlans: NocobaseCollectionPlan[], name: string) =>
  collectionPlans.find((collection) => collection.name === name);

const collectPlanText = (collectionPlans: NocobaseCollectionPlan[]): string =>
  JSON.stringify(collectionPlans).toLowerCase();

const containsForbiddenTerm = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

export const validateCriticalCollections = (collectionPlans: NocobaseCollectionPlan[]): ValidationResult => {
  const normalized = normalizeCollectionPlans(collectionPlans);
  const existing = new Set(normalized.map((collection) => collection.name));
  const errors = CRITICAL_COLLECTIONS.filter((name) => !existing.has(name)).map(
    (name) => `缺少关键 Collection：${name}`,
  );

  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validateCriticalUniqueConstraints = (collectionPlans: NocobaseCollectionPlan[]): ValidationResult => {
  const normalized = normalizeCollectionPlans(collectionPlans);
  const errors: string[] = [];

  for (const rule of CRITICAL_UNIQUE_CONSTRAINTS) {
    const collection = collectionByName(normalized, rule.collection);
    if (!collection) {
      errors.push(`无法检查唯一约束，缺少 Collection：${rule.collection}`);
      continue;
    }

    if (!hasUniqueConstraint(collection, rule.fields)) {
      errors.push(`缺少关键唯一约束：${rule.collection}.${rule.fields.join(' + ')}`);
    }
  }

  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validateSensitiveFields = (collectionPlans: NocobaseCollectionPlan[]): ValidationResult => {
  const normalized = normalizeCollectionPlans(collectionPlans);
  const errors: string[] = [];

  for (const rule of REQUIRED_SENSITIVE_FIELDS) {
    const collection = collectionByName(normalized, rule.collection);
    if (!collection) {
      errors.push(`无法检查敏感字段，缺少 Collection：${rule.collection}`);
      continue;
    }

    if (!collection.sensitiveFields.includes(rule.field)) {
      errors.push(`敏感字段未标记：${rule.collection}.${rule.field}`);
    }
  }

  return { passed: errors.length === 0, errors, warnings: [] };
};

export const validateCollectionRegistrationPlan = (collectionPlans: NocobaseCollectionPlan[]): ValidationResult => {
  const normalized = normalizeCollectionPlans(collectionPlans);
  const errors: string[] = [];
  const warnings: string[] = [];
  const planText = collectPlanText(normalized);

  if (normalized.length === 0) {
    errors.push('Collection 注册计划不能为空。');
  }

  for (const collection of normalized) {
    if (!collection.name) {
      errors.push('Collection name 必须存在。');
    }

    if (!collection.title) {
      errors.push(`Collection title 必须存在：${collection.name || '<未命名>'}`);
    }

    if (!collection.fields || collection.fields.length === 0) {
      errors.push(`Collection fields 必须存在且非空：${collection.name || '<未命名>'}`);
    }

    const fieldSet = new Set(collection.fields);

    for (const field of collection.fieldPlans ?? []) {
      if (!field.name) {
        errors.push(`字段 name 必须存在：${collection.name}`);
      }

      if (!field.type) {
        errors.push(`字段 type 必须存在：${collection.name}.${field.name || '<未命名字段>'}`);
      }

      if (field.relation && !field.relation.targetCollection) {
        errors.push(`关系字段必须有目标 Collection：${collection.name}.${field.name}`);
      }
    }

    for (const field of collection.sensitiveFields) {
      if (!fieldSet.has(field)) {
        errors.push(`sensitiveFields 中字段不存在：${collection.name}.${field}`);
      }
    }

    for (const fields of collection.uniqueConstraints) {
      for (const field of fields) {
        if (!fieldSet.has(field)) {
          errors.push(`uniqueConstraints 中字段不存在：${collection.name}.${field}`);
        }
      }
    }

    for (const index of collection.indexPlans ?? []) {
      for (const field of index.fields) {
        if (!fieldSet.has(field)) {
          errors.push(`indexes 中字段不存在：${collection.name}.${field}`);
        }
      }
    }
  }

  const collectionNames = normalized.map((collection) => collection.name.toLowerCase());
  for (const forbiddenName of FORBIDDEN_COLLECTION_NAMES) {
    if (collectionNames.includes(forbiddenName) || planText.includes(`"${forbiddenName}"`)) {
      errors.push(`不允许出现短租对象：${forbiddenName}`);
    }
  }

  if (containsForbiddenTerm(planText, FORBIDDEN_DRIVER_LOGIN_TERMS)) {
    errors.push('不允许出现司机登录或客户门户逻辑。');
  }

  if (containsForbiddenTerm(planText, FORBIDDEN_VEHICLE_CATEGORY_TERMS)) {
    errors.push('不允许出现按车型出租逻辑。');
  }

  const gpsRentForbiddenPatterns = [
    'gps参与租金计算',
    'gps 参与租金计算',
    'gps数据参与租金计算',
    'gps 数据参与租金计算',
    'gps_calculates_rent',
    'gps_rent_calculation',
  ];
  if (gpsRentForbiddenPatterns.some((pattern) => planText.includes(pattern))) {
    errors.push('GPS 计划不得参与租金计算。');
  }

  const depositRentForbiddenPatterns = [
    '押金计入租金收入',
    '押金作为租金收入',
    'deposit_as_rent_income',
    'deposit_rent_income',
    'deposit_counts_as_rent',
  ];
  if (depositRentForbiddenPatterns.some((pattern) => planText.includes(pattern))) {
    errors.push('押金字段不得标记为租金收入字段。');
  }

  return mergeResults(
    { passed: errors.length === 0, errors, warnings },
    validateCriticalCollections(normalized),
    validateCriticalUniqueConstraints(normalized),
    validateSensitiveFields(normalized),
  );
};
