/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ID, ServiceResult } from '../types/commonTypes';
import type { LeaseContractDraftInput } from '../types/contractTypes';

/**
 * createLeaseContractDraft：合同草稿创建服务骨架。
 * TODO 处理步骤：校验司机、车辆、合同类型、周付天数、默认免租日、押金、日租金。
 * TODO 数据库事务说明：后续接入 NocoBase 后创建合同草稿，不立即生成台账。
 * TODO 权限控制说明：仅内部授权角色可创建，司机不登录系统。
 * TODO 操作日志说明：写入 contract_created 日志且脱敏。
 */
export async function createLeaseContractDraft(
  input: LeaseContractDraftInput,
): Promise<ServiceResult<{ contractId: ID }>> {
  void input;
  throw new Error('TODO: createLeaseContractDraft 仅为骨架，尚未接入真实业务实现。');
}

/**
 * activateLeaseContract：合同激活服务骨架。
 * TODO 处理步骤：校验司机非黑名单、驾照未过期、押金/签署、车辆无冲突、计费规则完整。
 * TODO 数据库事务说明：激活合同、更新车辆状态、生成台账必须放入同一事务。
 * TODO 权限控制说明：仅经理、系统管理员或授权运营可激活。
 * TODO 操作日志说明：写入 contract_activated 与 ledger_generated 日志。
 */
export async function activateLeaseContract(
  contractId: ID,
): Promise<ServiceResult<{ contractId: ID; status: string }>> {
  void contractId;
  throw new Error('TODO: activateLeaseContract 仅为骨架，尚未接入真实业务实现。');
}
