/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * plugin-rental-core 服务端统一导出入口。
 *
 * 当前仓库不是完整 NocoBase 源码工程，本文件只暴露纯函数、类型和 Collection 注册草案，
 * 方便后续单元测试与接入真实 NocoBase 插件生命周期。
 */
export * from './collections';
export * from './services';
export * from './types';

export const rentalCorePluginIntegrationPlan = {
  plugin: 'plugin-rental-core',
  dependsOn: [],
  enableOrder: 1,
  currentStage: '待接入真实 NocoBase 工程的插件源码骨架',
  registrationTodo: [
    '注册 drivers、vehicles、lease_contracts、rent_daily_ledgers、rent_payments、deposit_records 等 Collection',
    '注册每日台账、付款分配、押金、汇总、权限过滤等服务端方法',
    '注册服务端权限与敏感字段访问控制，不能只依赖前端隐藏',
    '注册 zh-CN、en-US、fr-FR 多语言资源',
    '将纯函数写入流程接入数据库事务和操作日志',
  ],
  notes: [
    'rental-core 是租金台账唯一事实来源，不依赖 IOPGPS 或合同文件插件。',
    '当前入口不调用真实 NocoBase API，不声明数据库迁移已经完成。',
  ],
} as const;
export * from './actions/actionRegistry';
export * from './permissions/permissionRegistry';
export * from './pluginRegistration';
export * from './schedules/scheduleRegistry';

export const rentalCoreI18nRegistrationNotes = {
  namespace: 'plugin-rental-core',
  locales: ['zh-CN', 'en-US', 'fr-FR'],
  notes: ['后续接入真实 NocoBase 时注册 i18n 资源；当前仅导出说明，不调用真实 API。'],
} as const;
