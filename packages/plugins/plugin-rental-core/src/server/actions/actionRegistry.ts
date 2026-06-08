/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface ActionDraft {
  name: string;
  title: string;
  input: string[];
  output: string;
  requiredRoles: string[];
  callsService: string;
  failureScenarios: string[];
  sideEffects: 'none_in_skeleton';
}

export const rentalCoreActionRegistry: ActionDraft[] = [
  {
    name: 'activate_contract',
    title: '激活合同',
    input: ['contract_id'],
    output: '合同状态和台账生成结果',
    requiredRoles: ['system_admin', 'manager'],
    callsService: 'contractLifecycleService',
    failureScenarios: ['车辆存在冲突有效合同', '合同规则不合法'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'generate_fixed_term_ledgers',
    title: '生成时限合同台账',
    input: ['contract_id'],
    output: '每日台账预览或生成结果',
    requiredRoles: ['system_admin', 'manager'],
    callsService: 'ledgerGenerationService',
    failureScenarios: ['时限合同少于 6 个月', '默认免租日不合法'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'ensure_open_ended_ledgers',
    title: '补生成长租未来台账',
    input: ['contract_id', 'horizonDays'],
    output: '未来台账预览或生成结果',
    requiredRoles: ['system_admin', 'manager'],
    callsService: 'ledgerGenerationService',
    failureScenarios: ['horizonDays 不合法'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'confirm_rent_payment',
    title: '确认租金付款',
    input: ['payment', 'allocations'],
    output: '付款、分配和更新后的台账',
    requiredRoles: ['system_admin', 'manager', 'accountant'],
    callsService: 'paymentAllocationService',
    failureScenarios: ['单日超付', '付款金额与分配合计不一致'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'reverse_rent_payment',
    title: '冲正租金付款',
    input: ['payment_id', 'reason'],
    output: '冲正后的付款和台账',
    requiredRoles: ['system_admin', 'manager', 'accountant'],
    callsService: 'paymentReversalService',
    failureScenarios: ['付款未确认', '缺少冲正原因'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'mark_unpaid_reason',
    title: '标记未付原因',
    input: ['ledger_id', 'unpaid_reason'],
    output: '更新后的台账',
    requiredRoles: ['system_admin', 'manager', 'accountant', 'operator'],
    callsService: 'unpaidReasonService',
    failureScenarios: ['未付原因非法', '未结清日期缺少原因'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'request_rent_waiver',
    title: '申请租金免除',
    input: ['ledger_id', 'amount', 'reason'],
    output: '免除申请对象',
    requiredRoles: ['system_admin', 'manager', 'accountant'],
    callsService: 'waiverService',
    failureScenarios: ['金额非法', '金额超过余额'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'approve_rent_waiver',
    title: '审批租金免除',
    input: ['adjustment_id', 'approved_by'],
    output: '审批后的免除申请和台账',
    requiredRoles: ['system_admin', 'manager'],
    callsService: 'waiverService',
    failureScenarios: ['申请状态非法', '金额超过余额'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'create_deposit',
    title: '创建押金记录',
    input: ['contract_id', 'required_amount', 'received_amount'],
    output: '押金记录和操作日志草案',
    requiredRoles: ['system_admin', 'manager', 'accountant'],
    callsService: 'depositService',
    failureScenarios: ['押金金额非法', '实收超过应收'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'deduct_deposit',
    title: '抵扣押金',
    input: ['deposit_id', 'amount', 'reason'],
    output: '更新后的押金记录',
    requiredRoles: ['system_admin', 'manager', 'accountant'],
    callsService: 'depositService',
    failureScenarios: ['缺少原因', '金额超过可用押金'],
    sideEffects: 'none_in_skeleton',
  },
  {
    name: 'refund_deposit',
    title: '退还押金',
    input: ['deposit_id', 'amount', 'reason'],
    output: '更新后的押金记录',
    requiredRoles: ['system_admin', 'manager', 'accountant'],
    callsService: 'depositService',
    failureScenarios: ['缺少原因', '金额超过可用押金'],
    sideEffects: 'none_in_skeleton',
  },
];
