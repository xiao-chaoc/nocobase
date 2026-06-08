/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NocobaseServicePlan } from './types';

const transactionalServiceNames = [
  'activateLeaseContract',
  'generateFixedTermDailyLedgers',
  'ensureOpenEndedDailyLedgers',
  'allocateRentPayment',
  'reverseRentPayment',
  'approveRentWaiver',
  'createDepositRecord',
  'deductDeposit',
  'refundDeposit',
];

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

const matchesTransactionalServiceName = (handlerName: string): boolean =>
  transactionalServiceNames.some(
    (serviceName) => handlerName === serviceName || handlerName.endsWith(`.${serviceName}`),
  );

export const normalizeServicePlan = (rawServicePlan: NocobaseServicePlan): NocobaseServicePlan => {
  const name = String(rawServicePlan.name ?? '');
  const handlerName = String(rawServicePlan.handlerName || name);
  const notes = asStringArray(rawServicePlan.notes);
  const permissions = asStringArray(rawServicePlan.permissions);
  if (permissions.length === 0) {
    notes.push('警告：服务方法缺少权限要求；真实 adapter 接入前必须补齐服务端权限。');
  }

  return {
    name,
    sourcePlugin: String(rawServicePlan.sourcePlugin ?? ''),
    handlerName,
    permissions,
    transactional: Boolean(rawServicePlan.transactional ?? matchesTransactionalServiceName(handlerName)),
    notes,
  };
};

export const normalizeServicePlans = (servicePlans: NocobaseServicePlan[]): NocobaseServicePlan[] =>
  servicePlans.map((servicePlan) => normalizeServicePlan(servicePlan));

export const extractTransactionalServices = (servicePlans: NocobaseServicePlan[]): NocobaseServicePlan[] =>
  normalizeServicePlans(servicePlans).filter(
    (servicePlan) => servicePlan.transactional || matchesTransactionalServiceName(servicePlan.handlerName),
  );

export const coreTransactionalServiceNames = [...transactionalServiceNames];
