/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  NocobaseBlockPlan,
  NocobaseFilterPlan,
  NocobaseMenuPlan,
  NocobasePageActionPlan,
  NocobasePageAdapter,
  NocobasePagePlan,
  PageItemRegistrationResult,
  ValidationResult,
} from './types';

const ok = (warnings: string[] = []): ValidationResult => ({ passed: true, errors: [], warnings });
const fail = (errors: string[], warnings: string[] = []): ValidationResult => ({ passed: false, errors, warnings });

export class MockPageAdapter implements NocobasePageAdapter {
  private readonly menus = new Set<string>();
  private readonly pages = new Set<string>();
  private readonly blocks = new Set<string>();
  private readonly filters = new Set<string>();
  private readonly actions = new Set<string>();

  validateMenuPlan(menu: NocobaseMenuPlan): ValidationResult {
    const errors: string[] = [];
    if (!menu.name) errors.push('菜单 name 必须存在。');
    if (!menu.title) errors.push('菜单 title 必须存在。');
    if (!menu.path) errors.push('菜单 path 必须存在。');
    if (!menu.sourcePlugin) errors.push('菜单 sourcePlugin 必须存在。');
    return errors.length ? fail(errors) : ok(['菜单校验仅为 dry-run，不调用真实 NocoBase 页面 API。']);
  }

  validatePagePlan(page: NocobasePagePlan): ValidationResult {
    const errors: string[] = [];
    if (!page.name) errors.push('页面 name 必须存在。');
    if (!page.title) errors.push('页面 title 必须存在。');
    if (!page.route) errors.push(`页面 ${page.name || '<未命名>'} route 必须存在。`);
    if (!page.menuName) errors.push(`页面 ${page.name || '<未命名>'} menuName 必须存在。`);
    if (!page.collection) errors.push(`页面 ${page.name || '<未命名>'} collection 必须存在。`);
    if (!page.blocks || page.blocks.length === 0) errors.push(`页面 ${page.name || '<未命名>'} 必须包含区块引用。`);
    return errors.length ? fail(errors) : ok(['页面校验仅为 dry-run，不创建真实 UI。']);
  }

  validateBlockPlan(block: NocobaseBlockPlan): ValidationResult {
    const errors: string[] = [];
    if (!block.name) errors.push('区块 name 必须存在。');
    if (!block.title) errors.push(`区块 ${block.name || '<未命名>'} title 必须存在。`);
    if (!block.collection) errors.push(`区块 ${block.name || '<未命名>'} collection 必须存在。`);
    if (!block.fields || block.fields.length === 0) errors.push(`区块 ${block.name || '<未命名>'} fields 必须存在。`);
    return errors.length ? fail(errors) : ok(['区块校验仅为 dry-run，不创建真实区块。']);
  }

  validateFilterPlan(filter: NocobaseFilterPlan): ValidationResult {
    const errors: string[] = [];
    if (!filter.name) errors.push('筛选器 name 必须存在。');
    if (!filter.collection) errors.push(`筛选器 ${filter.name || '<未命名>'} collection 必须存在。`);
    if (!filter.field) errors.push(`筛选器 ${filter.name || '<未命名>'} field 必须存在。`);
    return errors.length ? fail(errors) : ok(['筛选器校验仅为 dry-run，不创建真实筛选器。']);
  }

  validatePageActionPlan(action: NocobasePageActionPlan): ValidationResult {
    const errors: string[] = [];
    if (!action.name) errors.push('页面动作 name 必须存在。');
    if (!action.serviceName) errors.push(`页面动作 ${action.name || '<未命名>'} serviceName 必须存在。`);
    if (!action.collection) errors.push(`页面动作 ${action.name || '<未命名>'} collection 必须存在。`);
    if (!action.sourcePlugin) errors.push(`页面动作 ${action.name || '<未命名>'} sourcePlugin 必须存在。`);
    return errors.length ? fail(errors) : ok(['页面动作校验仅为 dry-run，不注册真实按钮。']);
  }

  private register<T extends { name: string; sourcePlugin: string }>(
    item: T,
    itemType: PageItemRegistrationResult['itemType'],
    registeredSet: Set<string>,
    validation: ValidationResult,
    title: string,
  ): PageItemRegistrationResult {
    if (!validation.passed) {
      return {
        itemName: item.name,
        itemType,
        sourcePlugin: item.sourcePlugin,
        success: false,
        registered: false,
        skipped: false,
        warnings: validation.warnings,
        errors: validation.errors,
        steps: [`dry-run：${title} ${item.name || '<未命名>'} 校验失败，未初始化。`],
      };
    }

    if (registeredSet.has(item.name)) {
      return {
        itemName: item.name,
        itemType,
        sourcePlugin: item.sourcePlugin,
        success: true,
        registered: false,
        skipped: true,
        warnings: [`${title} 已存在于 mock page adapter：${item.name}`],
        errors: [],
        steps: [`dry-run：跳过重复${title} ${item.name}。`],
      };
    }

    registeredSet.add(item.name);
    return {
      itemName: item.name,
      itemType,
      sourcePlugin: item.sourcePlugin,
      success: true,
      registered: true,
      skipped: false,
      warnings: ['本结果仅为 dry-run，未连接真实 NocoBase，未创建真实 UI。'],
      errors: [],
      steps: [`dry-run：记录${title} ${item.name}，不连接真实 NocoBase，不创建真实页面、菜单、区块、筛选器或按钮。`],
    };
  }

  registerMenus(menus: NocobaseMenuPlan[]): PageItemRegistrationResult[] {
    return menus.map((menu) => this.register(menu, 'menu', this.menus, this.validateMenuPlan(menu), '菜单'));
  }

  registerPages(pages: NocobasePagePlan[]): PageItemRegistrationResult[] {
    return pages.map((page) => this.register(page, 'page', this.pages, this.validatePagePlan(page), '页面'));
  }

  registerBlocks(blocks: NocobaseBlockPlan[]): PageItemRegistrationResult[] {
    return blocks.map((block) => this.register(block, 'block', this.blocks, this.validateBlockPlan(block), '区块'));
  }

  registerFilters(filters: NocobaseFilterPlan[]): PageItemRegistrationResult[] {
    return filters.map((filter) =>
      this.register(filter, 'filter', this.filters, this.validateFilterPlan(filter), '筛选器'),
    );
  }

  registerPageActions(actions: NocobasePageActionPlan[]): PageItemRegistrationResult[] {
    return actions.map((action) =>
      this.register(action, 'pageAction', this.actions, this.validatePageActionPlan(action), '页面动作'),
    );
  }
}
