/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { iopgpsActionRegistry } from './actions/actionRegistry';
import {
  gpsDailyMileagesCollectionDraft,
  gpsDeviceBindingsCollectionDraft,
  gpsDevicesCollectionDraft,
  gpsDeviceStatusLogsCollectionDraft,
  gpsLocationSnapshotsCollectionDraft,
  iopgpsSettingsCollectionDraft,
} from './collections';
import { iopgpsScheduleRegistry } from './schedules/scheduleRegistry';

export const iopgpsPluginRegistration = {
  pluginName: 'plugin-iopgps',
  pluginTitle: 'IOPGPS 运营监控插件',
  pluginDescription: 'IOPGPS 配置、token 状态、状态归一化、设备状态、定位、每日里程和错误日志的服务端骨架。',
  dependencies: ['plugin-rental-core'],
  collections: [
    gpsDevicesCollectionDraft,
    gpsDeviceBindingsCollectionDraft,
    gpsLocationSnapshotsCollectionDraft,
    gpsDailyMileagesCollectionDraft,
    gpsDeviceStatusLogsCollectionDraft,
    iopgpsSettingsCollectionDraft,
  ],
  services: [
    'iopgpsTokenService: token 状态和刷新骨架',
    'iopgpsNormalizeService: 状态归一化',
    'iopgpsDeviceStatusService: 设备状态日志和车辆 GPS 状态 patch',
    'iopgpsLocationService: 定位快照和车辆位置 patch',
    'iopgpsMileageService: 每日里程和幂等键',
    'iopgpsErrorLogService: 错误日志脱敏和失败隔离',
  ],
  permissions: ['system_admin/manager/gps_maintenance 可操作 GPS 同步；财务和运营默认不查看 token。'],
  i18nNamespaces: ['plugin-iopgps', 'zh-CN', 'en-US', 'fr-FR'],
  scheduledTasks: iopgpsScheduleRegistry,
  actions: iopgpsActionRegistry,
  notes: [
    '本对象只是结构化注册描述，不调用真实 NocoBase API。',
    'GPS 数据不参与租金计算。',
    'IOPGPS 失败只生成错误日志，不能影响租金台账和付款逻辑。',
    '本轮不调用真实 IOPGPS API，不保存真实 appid、login key 或 access token。',
  ],
} as const;

export function createIopgpsPluginRegistrationPlan() {
  return iopgpsPluginRegistration;
}
