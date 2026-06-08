/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocobasePermissionPlan } from './types';

export const runtimeSensitiveFieldAliases = [
  'driver_id_no',
  'driver_id_files',
  'driver_license_files',
  'payment_screenshot',
  'payment_method',
  'deposit_required_amount',
  'deposit_received_amount',
  'total_paid_amount',
  'current_debt_amount',
  'future_receivable_amount',
  'login_key_encrypted',
  'access_token',
  'signed_scan_file',
];

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

export const normalizePermissionPlan = (rawPermissionPlan: NocobasePermissionPlan): NocobasePermissionPlan => {
  const role = String(rawPermissionPlan.role ?? '');
  const collections = asStringArray(rawPermissionPlan.collections);
  const actions = asStringArray(rawPermissionPlan.actions);
  const sensitiveFields = asStringArray(rawPermissionPlan.sensitiveFields);
  const notes = asStringArray(rawPermissionPlan.notes);
  if (!role) notes.push('错误：权限角色 role 必须存在。');
  if (collections.length === 0)
    notes.push(`警告：角色 ${role || '<未命名>'} 未声明 collections；真实 ACL 前必须确认访问范围。`);
  if (sensitiveFields.length === 0)
    notes.push(`警告：角色 ${role || '<未命名>'} 未声明敏感字段覆盖；不能只靠前端隐藏。`);
  notes.push('本轮不真实注册 ACL，后续必须接入服务端权限控制。');

  return {
    role,
    collections,
    actions,
    fieldVisibility: rawPermissionPlan.fieldVisibility ?? {},
    sensitiveFields,
    notes,
  };
};

export const normalizePermissionPlans = (permissionPlans: NocobasePermissionPlan[]): NocobasePermissionPlan[] =>
  permissionPlans.map((permissionPlan) => normalizePermissionPlan(permissionPlan));

export const extractSensitiveFieldPermissionCoverage = (
  permissionPlans: NocobasePermissionPlan[],
): Record<string, Record<string, 'visible' | 'hidden' | 'masked' | 'unspecified'>> => {
  const normalized = normalizePermissionPlans(permissionPlans);
  const coverage: Record<string, Record<string, 'visible' | 'hidden' | 'masked' | 'unspecified'>> = {};
  for (const permission of normalized) {
    coverage[permission.role] = {};
    for (const field of runtimeSensitiveFieldAliases) {
      coverage[permission.role][field] = permission.fieldVisibility[field] ?? 'unspecified';
    }
  }
  return coverage;
};
