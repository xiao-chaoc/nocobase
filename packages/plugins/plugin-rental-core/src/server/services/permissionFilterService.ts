/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  CalendarFieldVisibility,
  CalendarSensitiveField,
  CurrentUserContext,
  CurrentUserPermissionContext,
  PermissionFilterResult,
  RentalRole,
  UserRole,
} from '../types/permissionTypes';
import type { DriverCalendarData } from '../types/summaryTypes';
import { throwBusinessError } from './errors';

export const calendarSensitiveFields: CalendarSensitiveField[] = [
  'total_paid_amount',
  'current_debt_amount',
  'current_debt_days',
  'future_receivable_amount',
  'deposit_required_amount',
  'deposit_received_amount',
  'payment_screenshot',
  'payment_method',
  'paid_amount',
  'due_amount',
  'waived_amount',
  'balance_amount',
  'driver_id_no',
  'driver_id_files',
  'driver_license_files',
];

const roleAliasMap: Record<RentalRole, UserRole> = {
  system_admin: 'system_admin',
  manager: 'manager',
  accountant: 'accountant',
  operator: 'operator',
  gps_maintenance: 'gps_maintenance',
  readonly_auditor: 'readonly_auditor',
  finance: 'accountant',
  operations: 'operator',
  gps_maintainer: 'gps_maintenance',
};

const defaultRoleVisibility: Record<UserRole, CalendarSensitiveField[]> = {
  system_admin: calendarSensitiveFields,
  manager: [
    'total_paid_amount',
    'current_debt_amount',
    'current_debt_days',
    'future_receivable_amount',
    'deposit_required_amount',
    'deposit_received_amount',
    'payment_screenshot',
    'paid_amount',
    'due_amount',
    'waived_amount',
    'balance_amount',
  ],
  accountant: [
    'total_paid_amount',
    'current_debt_amount',
    'current_debt_days',
    'future_receivable_amount',
    'deposit_required_amount',
    'deposit_received_amount',
    'payment_screenshot',
    'payment_method',
    'paid_amount',
    'due_amount',
    'waived_amount',
    'balance_amount',
  ],
  operator: [],
  gps_maintenance: [],
  readonly_auditor: [],
};

function normalizeCurrentUser(currentUser: CurrentUserContext | CurrentUserPermissionContext): CurrentUserContext {
  if (!currentUser) {
    throwBusinessError('permission_user_required');
  }
  const userId = 'user_id' in currentUser ? currentUser.user_id : currentUser.userId;
  if (userId === undefined || userId === null || userId === '') {
    throwBusinessError('permission_user_required');
  }

  const roles = (currentUser.roles ?? []).map((role) => roleAliasMap[role as RentalRole]);
  if (roles.some((role) => !role) || roles.length === 0) {
    throwBusinessError('permission_role_invalid');
  }

  return {
    user_id: userId,
    roles,
    permissions: currentUser.permissions,
    is_super_admin: currentUser.is_super_admin,
  };
}

function getPermissionOverride(currentUser: CurrentUserContext, field: CalendarSensitiveField): boolean | undefined {
  if (!currentUser.permissions) return undefined;
  if (Array.isArray(currentUser.permissions)) {
    return currentUser.permissions.includes(field) ? true : undefined;
  }
  return currentUser.permissions[field];
}

/** 判断当前内部用户是否可查看司机日历中的某个敏感字段。 */
export function canViewCalendarField(
  currentUser: CurrentUserContext | CurrentUserPermissionContext,
  field: CalendarSensitiveField,
): boolean {
  if (!calendarSensitiveFields.includes(field)) return false;
  const normalizedUser = normalizeCurrentUser(currentUser);
  if (normalizedUser.is_super_admin || normalizedUser.roles.includes('system_admin')) return true;

  const override = getPermissionOverride(normalizedUser, field);
  if (override !== undefined) return override;

  return normalizedUser.roles.some((role) => defaultRoleVisibility[role].includes(field));
}

/** 根据当前用户角色与可选权限覆盖，返回司机日历敏感字段可见性。 */
export function getCalendarFieldVisibility(
  currentUser: CurrentUserContext | CurrentUserPermissionContext,
): CalendarFieldVisibility {
  const normalizedUser = normalizeCurrentUser(currentUser);
  const visibility = Object.fromEntries(
    calendarSensitiveFields.map((field) => [field, canViewCalendarField(normalizedUser, field)]),
  ) as Record<CalendarSensitiveField, boolean>;

  return {
    ...visibility,
    can_view_all_sensitive_fields: calendarSensitiveFields.every((field) => visibility[field]),
  };
}

function hideField(
  target: Record<string, unknown>,
  field: CalendarSensitiveField,
  hiddenFields: Set<CalendarSensitiveField>,
): void {
  if (field in target) {
    target[field] = null;
    hiddenFields.add(field);
  }
}

/**
 * 过滤司机日历数据中的敏感字段。
 * 本函数只做纯对象脱敏；后续接入 NocoBase 时仍必须在服务端 ACL 与查询层做权限控制，不能只靠前端隐藏。
 */
export function filterCalendarSensitiveData(
  data: DriverCalendarData,
  currentUser: CurrentUserContext | CurrentUserPermissionContext,
): PermissionFilterResult<DriverCalendarData> {
  const visibleFields = getCalendarFieldVisibility(currentUser);
  const hiddenFields = new Set<CalendarSensitiveField>(data.hidden_fields ?? []);
  const filteredSummary = { ...data.summary } as Record<string, unknown>;
  const filteredDays = data.days.map((day) => ({ ...day }) as Record<string, unknown>);

  const summarySensitiveFields: CalendarSensitiveField[] = [
    'total_paid_amount',
    'current_debt_amount',
    'current_debt_days',
    'future_receivable_amount',
    'deposit_required_amount',
    'deposit_received_amount',
  ];
  const daySensitiveFields: CalendarSensitiveField[] = [
    'due_amount',
    'paid_amount',
    'waived_amount',
    'balance_amount',
    'payment_screenshot',
    'payment_method',
  ];

  for (const field of summarySensitiveFields) {
    if (!visibleFields[field]) hideField(filteredSummary, field, hiddenFields);
  }

  for (const day of filteredDays) {
    for (const field of daySensitiveFields) {
      if (!visibleFields[field]) hideField(day, field, hiddenFields);
    }
    // 司机证件号、证件照片、驾照照片不应出现在本轮日历输出；如上游误传，服务端仍统一置空。
    for (const field of ['driver_id_no', 'driver_id_files', 'driver_license_files'] as CalendarSensitiveField[]) {
      hideField(day, field, hiddenFields);
    }
  }

  return {
    data: {
      ...data,
      summary: filteredSummary as unknown as DriverCalendarData['summary'],
      days: filteredDays as unknown as DriverCalendarData['days'],
      hidden_fields: Array.from(hiddenFields),
      visible_fields: visibleFields,
    },
    hidden_fields: Array.from(hiddenFields),
    visible_fields: visibleFields,
  };
}
