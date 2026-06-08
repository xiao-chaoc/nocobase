/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { rentalCoreActionRegistry } from './actions/actionRegistry';
import {
  contractBillingWeeksCollectionDraft,
  depositRecordsCollectionDraft,
  driversCollectionDraft,
  leaseContractsCollectionDraft,
  operationLogsCollectionDraft,
  rentAdjustmentsCollectionDraft,
  rentDailyLedgersCollectionDraft,
  rentPaymentAllocationsCollectionDraft,
  rentPaymentsCollectionDraft,
  vehiclesCollectionDraft,
} from './collections';
import { rentalCorePermissionRegistry, rentalCorePermissionRegistryNotes } from './permissions/permissionRegistry';
import { rentalCoreScheduleRegistry } from './schedules/scheduleRegistry';

export interface PluginRegistrationDescription {
  pluginName: string;
  pluginTitle: string;
  pluginDescription: string;
  dependencies: string[];
  collections: readonly unknown[];
  services: string[];
  permissions: readonly unknown[];
  i18nNamespaces: string[];
  scheduledTasks: readonly unknown[];
  actions: readonly unknown[];
  notes: readonly string[];
}

export const rentalCorePluginRegistration: PluginRegistrationDescription = {
  pluginName: 'plugin-rental-core',
  pluginTitle: '租赁核心插件',
  pluginDescription: '司机、车辆、合同、每日租金台账、付款、押金、欠款、免除、汇总、权限过滤和操作日志的服务端骨架。',
  dependencies: [],
  collections: [
    driversCollectionDraft,
    vehiclesCollectionDraft,
    leaseContractsCollectionDraft,
    contractBillingWeeksCollectionDraft,
    rentDailyLedgersCollectionDraft,
    rentPaymentsCollectionDraft,
    rentPaymentAllocationsCollectionDraft,
    rentAdjustmentsCollectionDraft,
    depositRecordsCollectionDraft,
    operationLogsCollectionDraft,
  ],
  services: [
    'ledgerGenerationService: 台账生成与预览',
    'paymentAllocationService: 付款分配、禁止超付、整笔失败校验',
    'shortfallService/waiverService: 欠款、免除、待审批免除、争议',
    'depositService: 押金创建、抵扣、退款、免除',
    'summaryService/calendarDataService: 合同汇总和司机日历汇总',
    'permissionFilterService: 敏感字段权限过滤',
    'operationLogService: 操作日志和敏感字段脱敏',
  ],
  permissions: rentalCorePermissionRegistry,
  i18nNamespaces: ['plugin-rental-core', 'zh-CN', 'en-US', 'fr-FR'],
  scheduledTasks: rentalCoreScheduleRegistry,
  actions: rentalCoreActionRegistry,
  notes: [
    '本对象只是结构化注册描述，不调用真实 NocoBase API。',
    '后续接入真实 NocoBase 时需要注册 Collections、服务方法、权限、i18n、定时任务、操作按钮/动作和工作流触发点。',
    '每日租金台账是唯一事实来源；付款必须分配到具体日期，单日不可超付。',
    ...rentalCorePermissionRegistryNotes,
  ],
};

export function createRentalCorePluginRegistrationPlan(): PluginRegistrationDescription {
  return rentalCorePluginRegistration;
}
