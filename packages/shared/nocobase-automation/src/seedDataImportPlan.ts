/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SeedDataDependencyPlan, SeedDataEntityPlan, SeedDataEntityType, SeedDataImportPlan } from './types';

export const seedDataFileByEntity: Record<SeedDataEntityType, string> = {
  drivers: 'drivers.generated.json',
  vehicles: 'vehicles.generated.json',
  gps_devices: 'gps-devices.generated.json',
  lease_contracts: 'lease-contracts.generated.json',
  contract_billing_weeks: 'contract-billing-weeks.generated.json',
  rent_daily_ledgers: 'rent-daily-ledgers.generated.json',
  rent_payments: 'rent-payments.generated.json',
  rent_payment_allocations: 'rent-payment-allocations.generated.json',
  deposit_records: 'deposit-records.generated.json',
  gps_location_snapshots: 'gps-location-snapshots.generated.json',
  gps_daily_mileages: 'gps-daily-mileages.generated.json',
  contract_documents: 'contract-documents.generated.json',
  operation_logs: 'operation-logs.generated.json',
};

export const getDefaultSeedDataImportOrder = (): SeedDataEntityType[] => [
  'drivers',
  'vehicles',
  'gps_devices',
  'lease_contracts',
  'contract_billing_weeks',
  'rent_daily_ledgers',
  'rent_payments',
  'rent_payment_allocations',
  'deposit_records',
  'gps_location_snapshots',
  'gps_daily_mileages',
  'contract_documents',
  'operation_logs',
];

const dep = (
  entityType: SeedDataEntityType,
  dependsOn: SeedDataEntityType,
  relationField: string,
  targetKey: string,
): SeedDataDependencyPlan => ({
  entityType,
  dependsOn,
  relationField,
  targetKey,
  required: true,
  notes: [`${entityType}.${relationField} 必须引用已导入的 ${dependsOn}.${targetKey}。`],
});

export const buildSeedDataDependencyPlan = (): SeedDataDependencyPlan[] => [
  dep('lease_contracts', 'drivers', 'driver_id', 'driver_id'),
  dep('lease_contracts', 'vehicles', 'vehicle_id', 'vehicle_id'),
  dep('contract_billing_weeks', 'lease_contracts', 'contract_id', 'contract_id'),
  dep('rent_daily_ledgers', 'lease_contracts', 'contract_id', 'contract_id'),
  dep('rent_daily_ledgers', 'drivers', 'driver_id', 'driver_id'),
  dep('rent_daily_ledgers', 'vehicles', 'vehicle_id', 'vehicle_id'),
  dep('rent_payment_allocations', 'rent_payments', 'payment_id', 'payment_id'),
  dep('rent_payment_allocations', 'rent_daily_ledgers', 'ledger_id', 'ledger_id'),
  dep('deposit_records', 'lease_contracts', 'contract_id', 'contract_id'),
  dep('gps_location_snapshots', 'gps_devices', 'device_id', 'device_id'),
  dep('gps_daily_mileages', 'gps_devices', 'device_id', 'device_id'),
  dep('contract_documents', 'lease_contracts', 'contract_id', 'contract_id'),
];

export const buildSeedDataUniqueKeyPlan = (): Record<SeedDataEntityType, string[][]> => ({
  drivers: [['driver_no']],
  vehicles: [['vehicle_no'], ['plate_no']],
  gps_devices: [['imei']],
  lease_contracts: [['contract_no']],
  contract_billing_weeks: [['billing_week_id']],
  rent_daily_ledgers: [['contract_id', 'rent_date']],
  rent_payments: [['payment_no']],
  rent_payment_allocations: [['allocation_id']],
  deposit_records: [['deposit_no'], ['deposit_id']],
  gps_location_snapshots: [['snapshot_id']],
  gps_daily_mileages: [['device_id', 'mileage_date']],
  contract_documents: [['document_no']],
  operation_logs: [['log_no'], ['log_id']],
});

export const buildSeedDataSensitiveFieldPlan = (): Record<SeedDataEntityType, string[]> => ({
  drivers: ['id_no', 'id_front_file', 'id_back_file', 'license_front_file', 'license_back_file'],
  vehicles: [],
  gps_devices: [],
  lease_contracts: [],
  contract_billing_weeks: [],
  rent_daily_ledgers: ['total_paid_amount', 'future_receivable_amount'],
  rent_payments: ['screenshot_file', 'payment_screenshot', 'method', 'payment_method'],
  rent_payment_allocations: [],
  deposit_records: ['screenshot_file', 'proof_file', 'required_amount', 'received_amount'],
  gps_location_snapshots: ['raw_response.token', 'raw_response.login_key', 'raw_response.access_token'],
  gps_daily_mileages: ['raw_response.token', 'raw_response.login_key', 'raw_response.access_token'],
  contract_documents: ['signed_scan_file', 'generated_docx_file', 'generated_pdf_file'],
  operation_logs: ['before', 'after'],
});

const validationRulesByEntity: Record<SeedDataEntityType, string[]> = {
  drivers: ['不包含真实证件号', 'driver_no 唯一'],
  vehicles: ['每份合同绑定具体车牌', '不按车型出租'],
  gps_devices: ['不包含真实 IOPGPS 凭据', 'imei 唯一'],
  lease_contracts: ['driver_id 和 vehicle_id 引用存在', '不包含短租订单'],
  contract_billing_weeks: ['contract_id 引用存在'],
  rent_daily_ledgers: ['contract_id + rent_date 唯一', '单日不可超付', '免租日 due_amount = 0'],
  rent_payments: ['付款截图为 TEST 占位', '付款金额等于分配合计'],
  rent_payment_allocations: ['ledger_id 和 payment_id 引用存在', '不得分配到免租日'],
  deposit_records: ['押金不计入租金收入', '押金金额不为负'],
  gps_location_snapshots: ['GPS 不参与租金计算', 'raw_response 脱敏'],
  gps_daily_mileages: ['device_id + mileage_date 唯一', 'GPS 不参与租金计算'],
  contract_documents: ['不包含真实合同文件', '合同扫描件敏感'],
  operation_logs: ['操作日志脱敏', '最后导入'],
};

export const buildSeedDataImportPlan = (
  generatedDataManifest: string[] = Object.values(seedDataFileByEntity),
): SeedDataImportPlan => {
  const importOrder = getDefaultSeedDataImportOrder();
  const dependencies = buildSeedDataDependencyPlan();
  const uniqueKeys = buildSeedDataUniqueKeyPlan();
  const sensitiveFields = buildSeedDataSensitiveFieldPlan();
  const manifest = new Set(generatedDataManifest);
  const entities: SeedDataEntityPlan[] = importOrder.map((entityType, index) => ({
    entityType,
    sourceFile: seedDataFileByEntity[entityType],
    targetCollection: entityType,
    importOrder: index + 1,
    required: true,
    recordsCount: -1,
    dependencies: dependencies.filter((dependency) => dependency.entityType === entityType),
    uniqueKeys: uniqueKeys[entityType],
    sensitiveFields: sensitiveFields[entityType],
    validationRules: validationRulesByEntity[entityType],
    notes: [
      manifest.has(seedDataFileByEntity[entityType])
        ? '生成文件在 manifest 中。'
        : '生成文件未在 manifest 中；执行器会校验文件是否存在。',
      '本计划只用于 mock 测试数据导入 dry-run，不写数据库。',
    ],
  }));
  return {
    entities,
    dependencies,
    importOrder,
    warnings: ['当前仓库不是完整 NocoBase 源码工程；待接入真实 NocoBase 工程后替换真实 seed data adapter。'],
    notes: ['不连接真实 NocoBase，不上传文件，不导入真实司机、付款截图或合同扫描件。'],
  };
};
