/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Weekday } from '../types/commonTypes';
import { throwBusinessError } from './errors';

const validWeeklyPayableDays = new Set([3, 4, 5, 6, 7]);
const validWeekdays = new Set<Weekday>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

/** 校验每周应付天数，只允许 3、4、5、6、7。 */
export function validateWeeklyPayableDays(weeklyPayableDays: number): void {
  if (!validWeeklyPayableDays.has(weeklyPayableDays)) {
    throwBusinessError('weekly_payable_days_invalid');
  }
}

/**
 * 校验默认免租日。
 * 免租日必须来自合同配置，不写死周六周日。
 */
export function validateDefaultFreeWeekdays(weeklyPayableDays: number, defaultFreeWeekdays: readonly string[]): void {
  validateWeeklyPayableDays(weeklyPayableDays);
  if (!Array.isArray(defaultFreeWeekdays)) {
    throwBusinessError('default_free_weekdays_invalid');
  }

  const expectedFreeDays = 7 - weeklyPayableDays;
  if (defaultFreeWeekdays.length !== expectedFreeDays) {
    throwBusinessError('default_free_weekdays_invalid');
  }

  const seen = new Set<string>();
  for (const weekday of defaultFreeWeekdays) {
    if (!validWeekdays.has(weekday as Weekday) || seen.has(weekday)) {
      throwBusinessError('default_free_weekdays_invalid');
    }
    seen.add(weekday);
  }
}

/** 判断某个星期是否为合同配置的默认免租日。 */
export function isDefaultFreeWeekday(weekday: Weekday, defaultFreeWeekdays: readonly Weekday[]): boolean {
  return defaultFreeWeekdays.includes(weekday);
}

/**
 * applyDefaultFreeDays：后续接入数据库后用于刷新未付款、未免除、未手动调整的台账。
 * 本轮不实现数据库写入，避免伪造 NocoBase API 调用。
 */
export async function applyDefaultFreeDays(): Promise<never> {
  throw new Error('TODO: applyDefaultFreeDays 需要接入 NocoBase Collection 和事务后实现。');
}
