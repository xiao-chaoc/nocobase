/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID, ServiceResult } from '../types/commonTypes';
import type { ContractAvailabilityInput, LeaseContractDraftInput } from '../types/contractTypes';
import type { DailyLedgerDraft, ManualAdjustmentType, ShortfallDisposition } from '../types/ledgerTypes';
import type { PaymentAllocationInput, RentPaymentInput } from '../types/paymentTypes';
import type { DepositRecordInput } from '../types/depositTypes';
import type { CalendarVisibleFields, CurrentUserPermissionContext } from '../types/permissionTypes';

/**
 * 服务骨架文件。
 * TODO: 后续接入真实 NocoBase 服务端上下文、数据库事务、权限系统和操作日志。
 */

/**
 * checkVehicleContractAvailability：服务方法骨架。
 * 中文说明：对应 docs/service-methods.md 中的 `checkVehicleContractAvailability`，当前只保留签名和 TODO，不实现完整业务逻辑。
 * 输入参数类型：`input: ContractAvailabilityInput`。
 * 返回类型：`Promise<ServiceResult<{ available: boolean; conflictContractIds: ID[] }>>`。
 * TODO 处理步骤：按文档顺序补齐服务端流程，禁止只依赖前端页面控制。
 * TODO 校验点：检查合同、台账、付款、权限、敏感字段、单日不可超付等业务规则。
 * TODO 数据库事务说明：涉及合同激活、台账生成、付款分配、免除审批、冲正、押金变更时必须使用事务。
 * TODO 权限控制说明：服务端校验角色权限，普通运营不能查看全部敏感财务数据。
 * TODO 操作日志说明：关键业务动作必须写入 operation_logs，日志需脱敏。
 */
export async function checkVehicleContractAvailability(
  input: ContractAvailabilityInput,
): Promise<ServiceResult<{ available: boolean; conflictContractIds: ID[] }>> {
  void [input];
  throw new Error('TODO: checkVehicleContractAvailability 仅为骨架，尚未接入真实业务实现。');
}
