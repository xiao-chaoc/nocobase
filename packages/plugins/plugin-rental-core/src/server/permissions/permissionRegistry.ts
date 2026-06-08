/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CalendarSensitiveField, UserRole } from '../types/permissionTypes';

export interface RolePermissionDraft {
  role: UserRole;
  accessibleCollections: string[];
  visibleSensitiveFields: CalendarSensitiveField[];
  hiddenSensitiveFields: CalendarSensitiveField[];
  notes: string[];
}

export const rentalCoreSensitiveFields: CalendarSensitiveField[] = [
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

const allCollections = [
  'drivers',
  'vehicles',
  'lease_contracts',
  'contract_billing_weeks',
  'rent_daily_ledgers',
  'rent_payments',
  'rent_payment_allocations',
  'rent_adjustments',
  'deposit_records',
  'operation_logs',
];

function hiddenExcept(visible: CalendarSensitiveField[]): CalendarSensitiveField[] {
  return rentalCoreSensitiveFields.filter((field) => !visible.includes(field));
}

export const rentalCorePermissionRegistry: RolePermissionDraft[] = [
  {
    role: 'system_admin',
    accessibleCollections: allCollections,
    visibleSensitiveFields: rentalCoreSensitiveFields,
    hiddenSensitiveFields: [],
    notes: ['系统管理员可见全部敏感字段；后续仍必须接入 NocoBase 服务端 ACL。'],
  },
  {
    role: 'manager',
    accessibleCollections: allCollections,
    visibleSensitiveFields: [
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
    hiddenSensitiveFields: hiddenExcept([
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
    ]),
    notes: ['经理可查看财务汇总、欠款、未来应收、押金和审批相关字段。'],
  },
  {
    role: 'accountant',
    accessibleCollections: allCollections,
    visibleSensitiveFields: [
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
    hiddenSensitiveFields: hiddenExcept([
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
    ]),
    notes: ['财务可查看付款、付款截图、付款方式、押金、应收、欠款和未来应收。'],
  },
  {
    role: 'operator',
    accessibleCollections: ['drivers', 'vehicles', 'lease_contracts', 'rent_daily_ledgers'],
    visibleSensitiveFields: [],
    hiddenSensitiveFields: rentalCoreSensitiveFields,
    notes: ['运营默认不可见总已付、未来应收、押金、付款截图、付款方式和司机证件字段。'],
  },
  {
    role: 'gps_maintenance',
    accessibleCollections: ['vehicles'],
    visibleSensitiveFields: [],
    hiddenSensitiveFields: rentalCoreSensitiveFields,
    notes: ['GPS 维护仅查看车辆和 GPS 运营状态，不查看财务汇总、付款截图或司机证件。'],
  },
  {
    role: 'readonly_auditor',
    accessibleCollections: allCollections,
    visibleSensitiveFields: [],
    hiddenSensitiveFields: rentalCoreSensitiveFields,
    notes: ['只读审计默认隐藏敏感财务和证件字段；如需查看必须由服务端权限配置显式授权。'],
  },
];

export const rentalCorePermissionRegistryNotes = [
  '付款截图、押金金额、总已付、未来应收、司机证件号、证件照片、驾照照片均属于敏感字段。',
  '本文件仅为权限注册草案，不接真实 NocoBase ACL API。',
  '后续仍需在服务端 ACL、查询层和文件访问层执行权限控制，不能只靠前端隐藏。',
] as const;
