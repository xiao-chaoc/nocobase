/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 租赁核心业务错误。
 * 当前错误类型用于纯业务函数；后续接入 NocoBase 时可映射为框架异常。
 */
export type RentalCoreErrorCode =
  | 'weekly_payable_days_invalid'
  | 'default_free_weekdays_invalid'
  | 'fixed_term_months_invalid'
  | 'ledger_overpaid'
  | 'ledger_over_waived'
  | 'date_range_invalid'
  | 'contract_type_invalid'
  | 'daily_rent_amount_invalid'
  | 'horizon_days_invalid'
  | 'payment_amount_invalid'
  | 'payment_allocations_required'
  | 'payment_allocation_amount_mismatch'
  | 'payment_contract_mismatch'
  | 'payment_driver_mismatch'
  | 'payment_vehicle_mismatch'
  | 'payment_ledger_not_found'
  | 'payment_ledger_not_payable'
  | 'payment_ledger_cancelled'
  | 'payment_allocation_amount_invalid'
  | 'unpaid_reason_required'
  | 'unpaid_reason_invalid'
  | 'shortfall_disposition_required'
  | 'waiver_amount_invalid'
  | 'waiver_amount_exceeds_balance'
  | 'waiver_request_invalid_status'
  | 'payment_reversal_reason_required'
  | 'payment_reversal_invalid_status'
  | 'payment_reversal_paid_amount_negative'
  | 'calendar_driver_required'
  | 'calendar_date_range_invalid'
  | 'permission_user_required'
  | 'permission_role_invalid'
  | 'summary_today_required'
  | 'deposit_required_amount_invalid'
  | 'deposit_received_amount_invalid'
  | 'deposit_received_exceeds_required'
  | 'deposit_amount_invalid'
  | 'deposit_available_amount_invalid'
  | 'deposit_deduct_amount_exceeds_available'
  | 'deposit_refund_amount_exceeds_available'
  | 'deposit_reason_required'
  | 'deposit_approved_by_required'
  | 'operation_action_invalid'
  | 'operation_operator_required'
  | 'operation_target_required'
  | 'operation_reason_required'
  | 'operation_log_context_required';

export const rentalCoreErrorMessages: Record<RentalCoreErrorCode, string> = {
  weekly_payable_days_invalid: '每周应付天数只能是 3、4、5、6、7。',
  default_free_weekdays_invalid: '默认免租日配置无效，必须来自合同配置且数量、枚举和唯一性正确。',
  fixed_term_months_invalid: '时限合同租期必须不少于 6 个自然月。',
  ledger_overpaid: '每日租金台账已付金额超过可收金额，单日不可超付。',
  ledger_over_waived: '每日租金台账免除金额超过应收金额。',
  date_range_invalid: '日期范围无效，开始日期不能晚于结束日期。',
  contract_type_invalid: '合同类型无效，仅支持长租合同和时限合同。',
  daily_rent_amount_invalid: '每日租金必须大于或等于 0，且应收日必须大于 0。',
  horizon_days_invalid: '长租合同未来台账生成天数必须大于或等于 0。',
  payment_amount_invalid: '付款金额必须大于 0。',
  payment_allocations_required: '付款必须分配到具体租金日期。',
  payment_allocation_amount_mismatch: '付款金额必须等于分配金额合计。',
  payment_contract_mismatch: '付款合同必须与每日台账合同一致。',
  payment_driver_mismatch: '付款司机必须与每日台账司机一致。',
  payment_vehicle_mismatch: '付款车辆必须与每日台账车辆一致。',
  payment_ledger_not_found: '付款分配对应的每日租金台账不存在。',
  payment_ledger_not_payable: '付款不能分配到免租日或非应收日期。',
  payment_ledger_cancelled: '付款不能分配到已取消台账。',
  payment_allocation_amount_invalid: '付款分配金额必须大于 0。',
  unpaid_reason_required: '未付或未结清日期必须填写未付原因。',
  unpaid_reason_invalid: '未付原因枚举无效。',
  shortfall_disposition_required: '未结清余额必须标记欠款、免除、待审批免除或争议。',
  waiver_amount_invalid: '免除金额必须大于 0。',
  waiver_amount_exceeds_balance: '免除金额不能超过当前欠款余额。',
  waiver_request_invalid_status: '免除申请状态无效。',
  payment_reversal_reason_required: '付款冲正必须填写原因。',
  payment_reversal_invalid_status: '只有已确认付款可以冲正。',
  payment_reversal_paid_amount_negative: '付款冲正不能导致每日台账已付金额小于 0。',
  calendar_driver_required: '司机日历查询必须提供司机标识。',
  calendar_date_range_invalid: '司机日历日期范围无效，开始日期不能晚于结束日期。',
  permission_user_required: '权限过滤必须提供当前内部用户。',
  permission_role_invalid: '当前内部用户角色无效，无法判断敏感字段可见性。',
  summary_today_required: '财务汇总必须提供当前日期。',
  deposit_required_amount_invalid: '押金应收金额必须大于或等于 0。',
  deposit_received_amount_invalid: '押金实收金额必须大于或等于 0。',
  deposit_received_exceeds_required: '押金实收金额不能大于应收金额。',
  deposit_amount_invalid: '押金操作金额必须大于 0 且不能超过可处理金额。',
  deposit_available_amount_invalid: '押金可用金额无效，不能小于 0。',
  deposit_deduct_amount_exceeds_available: '押金抵扣金额不能超过当前可用押金。',
  deposit_refund_amount_exceeds_available: '押金退款金额不能超过当前可用押金。',
  deposit_reason_required: '押金抵扣、退款或免除必须填写原因。',
  deposit_approved_by_required: '押金免除必须记录审批人。',
  operation_action_invalid: '操作日志动作枚举无效。',
  operation_operator_required: '操作日志必须记录操作人。',
  operation_target_required: '操作日志必须记录目标集合和目标记录。',
  operation_reason_required: '关键操作必须填写操作原因。',
  operation_log_context_required: '操作日志必须包含变更前后内容、原因或备注。',
};

export class BusinessError extends Error {
  code: RentalCoreErrorCode;

  constructor(code: RentalCoreErrorCode, message = rentalCoreErrorMessages[code]) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
  }
}

export function throwBusinessError(code: RentalCoreErrorCode): never {
  throw new BusinessError(code);
}

/** 兼容早期骨架中使用的错误码对象。 */
export const rentalCoreErrorCodes = {
  weeklyPayableDaysInvalid: 'weekly_payable_days_invalid',
  defaultFreeWeekdaysInvalid: 'default_free_weekdays_invalid',
  fixedTermMonthsInvalid: 'fixed_term_months_invalid',
  ledgerOverpaid: 'ledger_overpaid',
  ledgerOverWaived: 'ledger_over_waived',
  dateRangeInvalid: 'date_range_invalid',
  contractTypeInvalid: 'contract_type_invalid',
  dailyRentAmountInvalid: 'daily_rent_amount_invalid',
  horizonDaysInvalid: 'horizon_days_invalid',
  paymentAmountInvalid: 'payment_amount_invalid',
  paymentAllocationsRequired: 'payment_allocations_required',
  paymentAllocationAmountMismatch: 'payment_allocation_amount_mismatch',
  paymentContractMismatch: 'payment_contract_mismatch',
  paymentDriverMismatch: 'payment_driver_mismatch',
  paymentVehicleMismatch: 'payment_vehicle_mismatch',
  paymentLedgerNotFound: 'payment_ledger_not_found',
  paymentLedgerNotPayable: 'payment_ledger_not_payable',
  paymentLedgerCancelled: 'payment_ledger_cancelled',
  paymentAllocationAmountInvalid: 'payment_allocation_amount_invalid',
  unpaidReasonRequired: 'unpaid_reason_required',
  unpaidReasonInvalid: 'unpaid_reason_invalid',
  shortfallDispositionRequired: 'shortfall_disposition_required',
  waiverAmountInvalid: 'waiver_amount_invalid',
  waiverAmountExceedsBalance: 'waiver_amount_exceeds_balance',
  waiverRequestInvalidStatus: 'waiver_request_invalid_status',
  paymentReversalReasonRequired: 'payment_reversal_reason_required',
  paymentReversalInvalidStatus: 'payment_reversal_invalid_status',
  paymentReversalPaidAmountNegative: 'payment_reversal_paid_amount_negative',
  calendarDriverRequired: 'calendar_driver_required',
  calendarDateRangeInvalid: 'calendar_date_range_invalid',
  permissionUserRequired: 'permission_user_required',
  permissionRoleInvalid: 'permission_role_invalid',
  summaryTodayRequired: 'summary_today_required',
  depositRequiredAmountInvalid: 'deposit_required_amount_invalid',
  depositReceivedAmountInvalid: 'deposit_received_amount_invalid',
  depositReceivedExceedsRequired: 'deposit_received_exceeds_required',
  depositAmountInvalid: 'deposit_amount_invalid',
  depositAvailableAmountInvalid: 'deposit_available_amount_invalid',
  depositDeductAmountExceedsAvailable: 'deposit_deduct_amount_exceeds_available',
  depositRefundAmountExceedsAvailable: 'deposit_refund_amount_exceeds_available',
  depositReasonRequired: 'deposit_reason_required',
  depositApprovedByRequired: 'deposit_approved_by_required',
  operationActionInvalid: 'operation_action_invalid',
  operationOperatorRequired: 'operation_operator_required',
  operationTargetRequired: 'operation_target_required',
  operationReasonRequired: 'operation_reason_required',
  operationLogContextRequired: 'operation_log_context_required',
  vehicleConflict: 'RENTAL_CORE_VEHICLE_CONFLICT',
  permissionDenied: 'RENTAL_CORE_PERMISSION_DENIED',
} as const;
