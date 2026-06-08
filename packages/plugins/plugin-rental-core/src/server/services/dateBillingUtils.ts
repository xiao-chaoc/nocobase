/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { WeekStartDay, Weekday } from '../types/commonTypes';
import { throwBusinessError } from './errors';

interface PureDateParts {
  year: number;
  month: number;
  day: number;
}

const weekdayByUtcDay: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function assertDateString(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throwBusinessError('date_range_invalid');
  }
}

function parseDate(date: string): PureDateParts {
  assertDateString(date);
  const [year, month, day] = date.split('-').map(Number);
  const maxDay = daysInMonth(year, month);
  if (month < 1 || month > 12 || day < 1 || day > maxDay) {
    throwBusinessError('date_range_invalid');
  }
  return { year, month, day };
}

function toUtcTime(date: string): number {
  const { year, month, day } = parseDate(date);
  return Date.UTC(year, month - 1, day);
}

function formatDate(parts: PureDateParts): string {
  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromUtcTime(time: number): string {
  const date = new Date(time);
  return formatDate({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

function addDays(date: string, days: number): string {
  return fromUtcTime(toUtcTime(date) + days * 24 * 60 * 60 * 1000);
}

function compareDate(a: string, b: string): number {
  return toUtcTime(a) - toUtcTime(b);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * 根据指定日期计算所属自然周范围。
 * 使用 UTC 纯日期计算，避免本地时区导致日期偏移。
 */
export function getNaturalWeekRange(
  date: string,
  weekStartDay: WeekStartDay = 'monday',
): { natural_week_start_date: string; natural_week_end_date: string } {
  if (weekStartDay !== 'monday' && weekStartDay !== 'sunday') {
    throwBusinessError('date_range_invalid');
  }
  const utcDate = new Date(toUtcTime(date));
  const dayOfWeek = utcDate.getUTCDay();
  const startDay = weekStartDay === 'monday' ? 1 : 0;
  const diff = (dayOfWeek - startDay + 7) % 7;
  const naturalWeekStartDate = addDays(date, -diff);
  return {
    natural_week_start_date: naturalWeekStartDate,
    natural_week_end_date: addDays(naturalWeekStartDate, 6),
  };
}

/** 生成两个日期之间的所有日期，包含开始和结束日期。 */
export function eachDateBetween(startDate: string, endDate: string): string[] {
  if (compareDate(startDate, endDate) > 0) {
    throwBusinessError('date_range_invalid');
  }
  const dates: string[] = [];
  let cursor = startDate;
  while (compareDate(cursor, endDate) <= 0) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

/** 返回指定日期对应的星期枚举。 */
export function getWeekday(date: string): Weekday {
  return weekdayByUtcDay[new Date(toUtcTime(date)).getUTCDay()];
}

/** 按自然月增加月份，目标月份没有原日期时夹到目标月份最后一天。 */
export function addMonthsClamped(date: string, months: number): string {
  const { year, month, day } = parseDate(date);
  const monthIndex = month - 1 + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonthIndex = ((monthIndex % 12) + 12) % 12;
  const targetMonth = targetMonthIndex + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return formatDate({ year: targetYear, month: targetMonth, day: targetDay });
}

/** 计算时限合同结束日期：开始日期加自然月租期后再减一天。 */
export function calculateFixedTermEndDate(startDate: string, termMonths: number): string {
  if (!Number.isInteger(termMonths) || termMonths < 6) {
    throwBusinessError('fixed_term_months_invalid');
  }
  return addDays(addMonthsClamped(startDate, termMonths), -1);
}

/** 内部辅助：按纯日期增加天数，供台账预览生成使用。 */
export function addDaysForBilling(date: string, days: number): string {
  return addDays(date, days);
}

/** 内部辅助：比较 YYYY-MM-DD 日期，供纯业务函数使用。 */
export function compareBillingDate(a: string, b: string): number {
  return compareDate(a, b);
}
