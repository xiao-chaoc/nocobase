/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID } from './commonTypes';

export type UserRole = 'system_admin' | 'manager' | 'accountant' | 'operator' | 'gps_maintenance' | 'readonly_auditor';

export type CalendarSensitiveField =
  | 'total_paid_amount'
  | 'current_debt_amount'
  | 'current_debt_days'
  | 'future_receivable_amount'
  | 'deposit_required_amount'
  | 'deposit_received_amount'
  | 'payment_screenshot'
  | 'payment_method'
  | 'paid_amount'
  | 'due_amount'
  | 'waived_amount'
  | 'balance_amount'
  | 'driver_id_no'
  | 'driver_id_files'
  | 'driver_license_files';

export type CalendarPermissionConfig = Partial<Record<CalendarSensitiveField, boolean>> | CalendarSensitiveField[];

export interface CurrentUserContext {
  user_id: ID;
  roles: UserRole[];
  /**
   * 可选权限覆盖：数组表示显式允许；对象可显式允许或拒绝字段。
   * 后续接入 NocoBase ACL 时仍必须在服务端执行，不能只靠前端隐藏。
   */
  permissions?: CalendarPermissionConfig;
  is_super_admin?: boolean;
}

export type CalendarFieldVisibility = Record<CalendarSensitiveField, boolean> & {
  /** 角色或权限配置是否允许查看全部敏感字段。 */
  can_view_all_sensitive_fields: boolean;
};

export interface PermissionFilterResult<T = unknown> {
  data: T;
  hidden_fields: CalendarSensitiveField[];
  visible_fields: CalendarFieldVisibility;
}

/** 兼容早期骨架命名：财务角色映射为 accountant，运营映射为 operator，GPS 维护映射为 gps_maintenance。 */
export type RentalRole = UserRole | 'finance' | 'operations' | 'gps_maintainer';

export interface CurrentUserPermissionContext {
  userId?: ID;
  user_id?: ID;
  roles: RentalRole[];
  permissions?: CalendarPermissionConfig;
  is_super_admin?: boolean;
}

export interface CalendarVisibleFields {
  canViewTotalPaid: boolean;
  canViewDebtSummary: boolean;
  canViewFutureReceivable: boolean;
  canViewDeposit: boolean;
  canViewPaymentScreenshot: boolean;
  canViewPaymentMethod: boolean;
  canViewDriverIdentity: boolean;
}
