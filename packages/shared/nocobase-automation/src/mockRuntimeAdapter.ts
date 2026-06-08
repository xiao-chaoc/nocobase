/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  ActionRegistrationResult,
  I18nRegistrationResult,
  NocobaseActionPlan,
  NocobaseI18nPlan,
  NocobasePermissionPlan,
  NocobaseRuntimeAdapter,
  NocobaseSchedulePlan,
  NocobaseServicePlan,
  PermissionRegistrationResult,
  ScheduleRegistrationResult,
  ServiceRegistrationResult,
  ValidationResult,
} from './types';
import { normalizeServicePlan } from './servicePlanNormalizer';
import { normalizeActionPlan } from './actionPlanNormalizer';
import { normalizePermissionPlan } from './permissionPlanNormalizer';
import { normalizeSchedulePlan } from './schedulePlanNormalizer';
import { normalizeI18nPlan, requiredRuntimeLanguages } from './i18nPlanNormalizer';

export class MockRuntimeAdapter implements NocobaseRuntimeAdapter {
  private readonly services = new Set<string>();
  private readonly actions = new Set<string>();
  private readonly permissions = new Set<string>();
  private readonly schedules = new Set<string>();
  private readonly i18n = new Set<string>();

  validateServicePlan(service: NocobaseServicePlan): ValidationResult {
    const normalized = normalizeServicePlan(service);
    const errors: string[] = [];
    if (!normalized.name) errors.push('服务 name 必须存在。');
    if (!normalized.sourcePlugin) errors.push(`服务 sourcePlugin 必须存在：${normalized.name || '<未命名服务>'}`);
    if (!normalized.handlerName) errors.push(`服务 handlerName 必须存在：${normalized.name || '<未命名服务>'}`);
    return {
      passed: errors.length === 0,
      errors,
      warnings: normalized.notes.filter((note) => note.startsWith('警告')),
    };
  }

  validateActionPlan(action: NocobaseActionPlan): ValidationResult {
    const normalized = normalizeActionPlan(action);
    const errors: string[] = [];
    if (!normalized.name) errors.push('动作 name 必须存在。');
    if (!normalized.sourcePlugin) errors.push(`动作 sourcePlugin 必须存在：${normalized.name || '<未命名动作>'}`);
    if (!normalized.serviceName) errors.push(`动作 serviceName 必须存在：${normalized.name || '<未命名动作>'}`);
    return {
      passed: errors.length === 0,
      errors,
      warnings: normalized.notes.filter((note) => note.startsWith('警告')),
    };
  }

  validatePermissionPlan(permission: NocobasePermissionPlan): ValidationResult {
    const normalized = normalizePermissionPlan(permission);
    const errors: string[] = [];
    if (!normalized.role) errors.push('权限 role 必须存在。');
    return {
      passed: errors.length === 0,
      errors,
      warnings: normalized.notes.filter((note) => note.startsWith('警告')),
    };
  }

  validateSchedulePlan(schedule: NocobaseSchedulePlan): ValidationResult {
    const normalized = normalizeSchedulePlan(schedule);
    const errors: string[] = [];
    if (!normalized.name) errors.push('定时任务 name 必须存在。');
    if (!normalized.sourcePlugin) errors.push(`定时任务 sourcePlugin 必须存在：${normalized.name || '<未命名任务>'}`);
    if (!normalized.serviceName) errors.push(`定时任务 serviceName 必须存在：${normalized.name || '<未命名任务>'}`);
    return {
      passed: errors.length === 0,
      errors,
      warnings: normalized.notes.filter((note) => note.startsWith('警告')),
    };
  }

  validateI18nPlan(i18n: NocobaseI18nPlan): ValidationResult {
    const normalized = normalizeI18nPlan(i18n);
    const errors: string[] = [];
    if (!normalized.namespace) errors.push('i18n namespace 必须存在。');
    for (const language of requiredRuntimeLanguages) {
      if (!normalized.languages.includes(language)) errors.push(`i18n 缺少语言：${language}`);
    }
    if (normalized.localeFiles.length === 0) errors.push('i18n 缺少 localeFiles。');
    return {
      passed: errors.length === 0,
      errors,
      warnings: normalized.notes.filter((note) => note.startsWith('警告')),
    };
  }

  registerServices(services: NocobaseServicePlan[]): ServiceRegistrationResult[] {
    return services.map((service) => {
      const normalized = normalizeServicePlan(service);
      const validation = this.validateServicePlan(normalized);
      if (!validation.passed) {
        return {
          serviceName: normalized.name,
          sourcePlugin: normalized.sourcePlugin,
          success: false,
          registered: false,
          skipped: false,
          warnings: validation.warnings,
          errors: validation.errors,
          steps: [`dry-run：服务 ${normalized.name || '<未命名>'} 校验失败，未注册。`],
        };
      }
      if (this.services.has(normalized.name)) {
        return {
          serviceName: normalized.name,
          sourcePlugin: normalized.sourcePlugin,
          success: true,
          registered: false,
          skipped: true,
          warnings: [`服务已存在于 mock runtime adapter：${normalized.name}`],
          errors: [],
          steps: [`dry-run：跳过重复服务 ${normalized.name}。`],
        };
      }
      this.services.add(normalized.name);
      return {
        serviceName: normalized.name,
        sourcePlugin: normalized.sourcePlugin,
        success: true,
        registered: true,
        skipped: false,
        warnings: ['本结果仅为 dry-run，未注册真实服务或 API。'],
        errors: [],
        steps: [`dry-run：记录服务 ${normalized.name}，不连接真实 NocoBase，不注册真实 API，不写数据库。`],
      };
    });
  }

  registerActions(actions: NocobaseActionPlan[]): ActionRegistrationResult[] {
    return actions.map((action) => {
      const normalized = normalizeActionPlan(action);
      const validation = this.validateActionPlan(normalized);
      if (!validation.passed) {
        return {
          actionName: normalized.name,
          sourcePlugin: normalized.sourcePlugin,
          success: false,
          registered: false,
          skipped: false,
          warnings: validation.warnings,
          errors: validation.errors,
          steps: [`dry-run：动作 ${normalized.name || '<未命名>'} 校验失败，未注册。`],
        };
      }
      if (this.actions.has(normalized.name)) {
        return {
          actionName: normalized.name,
          sourcePlugin: normalized.sourcePlugin,
          success: true,
          registered: false,
          skipped: true,
          warnings: [`动作已存在于 mock runtime adapter：${normalized.name}`],
          errors: [],
          steps: [`dry-run：跳过重复动作 ${normalized.name}。`],
        };
      }
      this.actions.add(normalized.name);
      return {
        actionName: normalized.name,
        sourcePlugin: normalized.sourcePlugin,
        success: true,
        registered: true,
        skipped: false,
        warnings: ['本结果仅为 dry-run，未注册真实按钮或 API。'],
        errors: [],
        steps: [`dry-run：记录动作 ${normalized.name}，不连接真实 NocoBase，不注册真实按钮，不注册真实 API。`],
      };
    });
  }

  registerPermissions(permissions: NocobasePermissionPlan[]): PermissionRegistrationResult[] {
    return permissions.map((permission) => {
      const normalized = normalizePermissionPlan(permission);
      const validation = this.validatePermissionPlan(normalized);
      if (!validation.passed) {
        return {
          role: normalized.role,
          sourcePlugin: 'plugin-rental-core',
          success: false,
          registered: false,
          skipped: false,
          warnings: validation.warnings,
          errors: validation.errors,
          steps: [`dry-run：权限角色 ${normalized.role || '<未命名>'} 校验失败，未注册。`],
        };
      }
      if (this.permissions.has(normalized.role)) {
        return {
          role: normalized.role,
          sourcePlugin: 'plugin-rental-core',
          success: true,
          registered: false,
          skipped: true,
          warnings: [`权限角色已存在于 mock runtime adapter：${normalized.role}`],
          errors: [],
          steps: [`dry-run：跳过重复权限角色 ${normalized.role}。`],
        };
      }
      this.permissions.add(normalized.role);
      return {
        role: normalized.role,
        sourcePlugin: 'plugin-rental-core',
        success: true,
        registered: true,
        skipped: false,
        warnings: ['本结果仅为 dry-run，未注册真实 ACL。'],
        errors: [],
        steps: [`dry-run：记录权限角色 ${normalized.role}，不连接真实 NocoBase，不注册真实 ACL，不能只靠前端隐藏。`],
      };
    });
  }

  registerSchedules(schedules: NocobaseSchedulePlan[]): ScheduleRegistrationResult[] {
    return schedules.map((schedule) => {
      const normalized = normalizeSchedulePlan(schedule);
      const validation = this.validateSchedulePlan(normalized);
      if (!validation.passed) {
        return {
          scheduleName: normalized.name,
          sourcePlugin: normalized.sourcePlugin,
          success: false,
          registered: false,
          skipped: false,
          warnings: validation.warnings,
          errors: validation.errors,
          steps: [`dry-run：定时任务 ${normalized.name || '<未命名>'} 校验失败，未注册。`],
        };
      }
      if (this.schedules.has(normalized.name)) {
        return {
          scheduleName: normalized.name,
          sourcePlugin: normalized.sourcePlugin,
          success: true,
          registered: false,
          skipped: true,
          warnings: [`定时任务已存在于 mock runtime adapter：${normalized.name}`],
          errors: [],
          steps: [`dry-run：跳过重复定时任务 ${normalized.name}。`],
        };
      }
      this.schedules.add(normalized.name);
      return {
        scheduleName: normalized.name,
        sourcePlugin: normalized.sourcePlugin,
        success: true,
        registered: true,
        skipped: false,
        warnings: ['本结果仅为 dry-run，未注册或执行真实定时任务。'],
        errors: [],
        steps: [`dry-run：记录定时任务 ${normalized.name}，不连接真实 NocoBase，不执行真实 scheduler。`],
      };
    });
  }

  registerI18n(i18n: NocobaseI18nPlan[]): I18nRegistrationResult[] {
    return i18n.map((item) => {
      const normalized = normalizeI18nPlan(item);
      const validation = this.validateI18nPlan(normalized);
      if (!validation.passed) {
        return {
          namespace: normalized.namespace,
          sourcePlugin: normalized.sourcePlugin,
          success: false,
          registered: false,
          skipped: false,
          warnings: validation.warnings,
          errors: validation.errors,
          steps: [`dry-run：i18n ${normalized.namespace || '<未命名>'} 校验失败，未注册。`],
        };
      }
      if (this.i18n.has(normalized.namespace)) {
        return {
          namespace: normalized.namespace,
          sourcePlugin: normalized.sourcePlugin,
          success: true,
          registered: false,
          skipped: true,
          warnings: [`i18n 命名空间已存在于 mock runtime adapter：${normalized.namespace}`],
          errors: [],
          steps: [`dry-run：跳过重复 i18n ${normalized.namespace}。`],
        };
      }
      this.i18n.add(normalized.namespace);
      return {
        namespace: normalized.namespace,
        sourcePlugin: normalized.sourcePlugin,
        success: true,
        registered: true,
        skipped: false,
        warnings: ['本结果仅为 dry-run，未注册真实 i18n。'],
        errors: [],
        steps: [
          `dry-run：记录 i18n 命名空间 ${normalized.namespace}，验证 zh-CN/en-US/fr-FR 计划，不连接真实 NocoBase。`,
        ],
      };
    });
  }
}
