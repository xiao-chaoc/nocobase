/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 通用类型。
 * 当前文件不绑定真实 NocoBase API，便于纯业务函数独立测试。
 */
export type ID = string | number;

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type WeekStartDay = 'monday' | 'sunday';

export interface ServiceContext {
  /** 当前内部用户标识；司机不登录系统。 */
  currentUserId?: ID;
  /** 当前内部用户角色。 */
  roles?: string[];
  /** TODO: 后续接入 NocoBase 数据库、事务、权限和日志能力。 */
  runtime?: unknown;
}

export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  errorCode?: string;
  message?: string;
  details?: unknown;
}

export interface DateRange {
  fromDate: string;
  toDate: string;
}

export interface TodoTransactionOptions {
  /** TODO: 真实实现中必须使用数据库事务，不能只靠前端控制。 */
  transaction?: unknown;
}
