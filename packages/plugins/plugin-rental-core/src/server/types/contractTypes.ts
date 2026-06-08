/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID, WeekStartDay, Weekday } from './commonTypes';

export type ContractType = 'open_ended' | 'fixed_term';
export type ContractStatus =
  | 'draft'
  | 'pending_signature'
  | 'pending_deposit'
  | 'pending_handover'
  | 'active'
  | 'overdue'
  | 'defaulted'
  | 'terminating'
  | 'completed'
  | 'cancelled';
export type WeekdayKey = Weekday;

export interface LeaseContractDraftInput {
  driverId: ID;
  vehicleId: ID;
  contractType: ContractType;
  startDate: string;
  termMonths?: number;
  weeklyPayableDays: 3 | 4 | 5 | 6 | 7;
  defaultFreeWeekdays: Weekday[];
  dailyRentAmount: number;
  depositRequiredAmount: number;
  weekStartDay?: WeekStartDay;
  remark?: string;
}

export interface ContractAvailabilityInput {
  vehicleId: ID;
  startDate: string;
  endDateOrNull?: string | null;
  excludeContractId?: ID | null;
}

/**
 * 每日租金台账生成所需的合同快照。
 * 字段采用 docs/data-model.md 中的 Collection 字段命名，避免把司机设计成登录用户。
 */
export interface LeaseContractForLedgerGeneration {
  contract_id: ID;
  driver_id: ID;
  vehicle_id: ID;
  contract_type: ContractType;
  start_date: string;
  term_months?: number;
  calculated_end_date?: string | null;
  termination_date?: string | null;
  weekly_payable_days: 3 | 4 | 5 | 6 | 7;
  default_free_weekdays: Weekday[];
  daily_rent_amount: number;
  week_start_day?: WeekStartDay;
}
