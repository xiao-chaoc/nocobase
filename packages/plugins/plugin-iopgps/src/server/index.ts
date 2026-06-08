/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * plugin-iopgps 服务端统一导出入口。
 *
 * 当前仅导出 IOPGPS 纯函数、类型和 Collection 注册草案；不调用真实 HTTP 请求，
 * 不保存真实 appid、login key 或 access token。
 */
export * from './collections';
export * from './services';
export * from './types';

export const iopgpsPluginIntegrationPlan = {
  plugin: 'plugin-iopgps',
  dependsOn: ['plugin-rental-core.vehicles'],
  enableOrder: 3,
  currentStage: '待接入真实 NocoBase 工程的插件源码骨架',
  registrationTodo: [
    '注册 gps_devices、gps_device_bindings、gps_location_snapshots、gps_daily_mileages、gps_device_status_logs、iopgps_settings 等 Collection',
    '注册 token 状态、状态归一化、定位快照、每日里程、错误日志等服务端方法',
    '注册 IOPGPS 定时同步任务，但失败只能写错误日志',
    '注册 i18n 资源并对 login_key_encrypted、access_token 做服务端脱敏和权限控制',
  ],
  notes: [
    'IOPGPS 依赖 rental-core 的车辆数据，但 GPS 数据不参与租金计算。',
    'IOPGPS 同步失败不能影响租金台账和付款逻辑。',
    '当前入口不调用真实 NocoBase API 或真实 IOPGPS API。',
  ],
} as const;
export * from './actions/actionRegistry';
export * from './pluginRegistration';
export * from './schedules/scheduleRegistry';

export const iopgpsI18nRegistrationNotes = {
  namespace: 'plugin-iopgps',
  locales: ['zh-CN', 'en-US', 'fr-FR'],
  notes: ['后续接入真实 NocoBase 时注册 i18n 资源；当前仅导出说明，不调用真实 API。'],
} as const;
