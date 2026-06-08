/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  NocobaseAdapterEnvironment,
  RealBackupPlan,
  RealBackupRollbackContext,
  RealBackupRollbackMode,
  RealBackupStepDraft,
  RealBackupTargetType,
  RealFailureRecoveryPlan,
  RealFailureRecoveryType,
  RealRollbackPlan,
  RealRollbackStepDraft,
  RealRollbackTargetType,
} from './types';

const createdAt = '2026-06-05T00:00:00.000Z';

const disabledEnvironment: NocobaseAdapterEnvironment = {
  mode: 'dry_run',
  status: 'configured',
  hasNocobaseApp: false,
  hasDatabaseConnection: false,
  hasLogger: false,
  hasFileStorage: false,
  hasPluginManager: false,
  hasAcl: false,
  hasUiSchema: false,
  hasScheduler: false,
  hasWorkflow: false,
  warnings: ['当前 Backup / Rollback 草案不连接真实 NocoBase。'],
  errors: [],
};

export const realBackupTargets: RealBackupTargetType[] = [
  'database',
  'file_storage',
  'plugin_storage',
  'collection_schema',
  'runtime_registry',
  'page_schema',
  'seed_data',
  'logs',
  'environment_config',
];

export const realRollbackTargets: RealRollbackTargetType[] = [
  'database_restore',
  'file_storage_restore',
  'plugin_disable',
  'collection_schema_restore',
  'runtime_registry_restore',
  'page_schema_restore',
  'seed_data_cleanup',
  'generated_artifacts_cleanup',
  'logs_preserve',
  'environment_config_restore',
];

export const realFailureTypes: RealFailureRecoveryType[] = [
  'collection_registration_failed',
  'runtime_registration_failed',
  'page_registration_failed',
  'seed_data_import_failed',
  'smoke_test_failed',
  'permission_validation_failed',
  'gps_sync_unexpected_enabled',
  'contract_document_generation_failed',
  'overpayment_rule_failed',
  'sensitive_data_exposure_detected',
];

export function createRealBackupRollbackContext(
  context: Partial<RealBackupRollbackContext> = {},
): RealBackupRollbackContext {
  return {
    mode: context.mode ?? 'plan_only',
    adapterEnvironment: context.adapterEnvironment ?? disabledEnvironment,
    allowRealExecution: context.allowRealExecution ?? false,
    requireOperatorConfirmation: context.requireOperatorConfirmation ?? false,
    requireIsolatedDatabase: context.requireIsolatedDatabase ?? true,
    requireMockDataOnly: context.requireMockDataOnly ?? true,
    requireIopgpsDisabled: context.requireIopgpsDisabled ?? true,
    backupDirectory: context.backupDirectory ?? 'backups-test/real-backup-rollback-draft',
    rollbackDirectory: context.rollbackDirectory ?? 'backups-test/real-backup-rollback-draft/rollback',
    operator: context.operator ?? 'codex-web-draft',
    notes: context.notes ?? ['只生成真实 Backup / Rollback 草案，不执行真实备份和回滚。'],
  };
}

function normalizeMode(mode: RealBackupRollbackMode): RealBackupRollbackMode {
  return mode === 'real' ? 'real' : mode;
}

function backupStep(
  context: RealBackupRollbackContext,
  targetType: RealBackupTargetType,
  title: string,
  plannedCommand: string,
  plannedArtifact: string,
): RealBackupStepDraft {
  return {
    name: `backup_${targetType}`,
    title,
    targetType,
    mode: normalizeMode(context.mode),
    plannedCommand,
    plannedArtifact,
    required: true,
    canExecute: false,
    executed: false,
    warnings: ['当前步骤仅为计划草案，不执行真实备份，不读取真实密钥，不写入 Git。'],
    errors: context.mode === 'real' ? ['当前仓库不允许执行 real 模式备份。'] : [],
  };
}

function rollbackStep(
  context: RealBackupRollbackContext,
  targetType: RealRollbackTargetType,
  title: string,
  triggerCondition: string,
  plannedAction: string,
): RealRollbackStepDraft {
  return {
    name: `rollback_${targetType}`,
    title,
    targetType,
    mode: normalizeMode(context.mode),
    triggerCondition,
    plannedAction,
    required: true,
    canExecute: false,
    executed: false,
    warnings: ['当前步骤仅为回滚计划草案，不删除文件，不写数据库，不修改 storage。'],
    errors: context.mode === 'real' ? ['当前仓库不允许执行 real 模式回滚。'] : [],
  };
}

export function buildRealBackupPlan(input: Partial<RealBackupRollbackContext> = {}): RealBackupPlan {
  const context = createRealBackupRollbackContext(input);
  const steps: RealBackupStepDraft[] = [
    backupStep(
      context,
      'database',
      '数据库备份计划草案',
      '计划在隔离测试环境使用 pg_dump 生成数据库 dump；当前不执行命令，不读取连接密码。',
      `${context.backupDirectory}/database/<backupNo>.dump`,
    ),
    backupStep(
      context,
      'file_storage',
      '文件存储备份计划草案',
      '计划在隔离测试环境生成 storage snapshot；当前不复制文件，不修改 storage。',
      `${context.backupDirectory}/storage-snapshot/`,
    ),
    backupStep(
      context,
      'plugin_storage',
      '插件安装状态备份计划草案',
      '计划记录 storage/plugins snapshot；当前不读取插件真实内容，不禁用插件。',
      `${context.backupDirectory}/plugin-storage-snapshot/`,
    ),
    backupStep(
      context,
      'collection_schema',
      'Collection 注册前后 schema snapshot 草案',
      '计划采集 Collection schema 前后快照；当前不连接 Collection Manager。',
      `${context.backupDirectory}/snapshots/collection-schema.json`,
    ),
    backupStep(
      context,
      'runtime_registry',
      'Runtime 注册前后状态 snapshot 草案',
      '计划采集服务、权限、动作、调度和 i18n 注册状态；当前不连接 runtime。',
      `${context.backupDirectory}/snapshots/runtime-registry.json`,
    ),
    backupStep(
      context,
      'page_schema',
      'Page / UI Schema 注册前后 snapshot 草案',
      '计划采集菜单、页面、区块和动作 UI Schema；当前不写 UI Schema。',
      `${context.backupDirectory}/snapshots/page-schema.json`,
    ),
    backupStep(
      context,
      'seed_data',
      'Seed Data 导入前后 snapshot 草案',
      '计划采集 mock 数据导入前后状态；当前不导入或清理数据。',
      `${context.backupDirectory}/snapshots/seed-data.json`,
    ),
    backupStep(
      context,
      'logs',
      '日志保留计划草案',
      '计划保留 NocoBase、PostgreSQL、脚本输出和审计日志；当前不读取真实日志。',
      `${context.backupDirectory}/logs/`,
    ),
    backupStep(
      context,
      'environment_config',
      '环境配置存在性备份计划草案',
      '计划记录 .env.test 是否存在；当前不读取、不输出、不备份真实配置值。',
      `${context.backupDirectory}/environment/.env.test.exists.txt`,
    ),
  ];
  return {
    mode: context.mode,
    backupNo: 'backup-draft-20260605-000000',
    createdAt,
    targets: [...realBackupTargets],
    steps,
    artifacts: steps.map((step) => step.plannedArtifact),
    safetyChecks: [
      'mode 不能默认进入 real。',
      'real 模式必须被当前仓库拒绝。',
      '不得读取或输出 .env.test 真实值。',
      '备份产物不得进入 Git。',
      '不得执行 pg_dump 或复制 storage。',
    ],
    warnings: ['本计划仅为草案，不代表真实备份完成。'],
    errors: context.mode === 'real' ? ['当前仓库不允许真实备份。'] : [],
    notes: [...context.notes, 'environment_config 只记录存在性要求，不读取具体值。'],
  };
}

export function buildPostRollbackVerificationPlan(input: Partial<RealBackupRollbackContext> = {}): string[] {
  const context = createRealBackupRollbackContext(input);
  return [
    '验证 NocoBase 能否在隔离测试环境启动。',
    '验证 PostgreSQL 能否在隔离测试环境启动。',
    '验证测试数据库状态是否恢复到测试前 snapshot。',
    '验证 storage 是否恢复到测试前 snapshot。',
    '验证插件是否禁用或回滚到测试前状态。',
    '验证 mock 数据是否清理。',
    '验证真实数据未被触碰。',
    '验证 IOPGPS 真实同步仍处于禁用状态。',
    '验证日志已保留用于排查，且未进入 Git。',
    `验证本次回滚验证记录归档到操作人 ${context.operator ?? '未指定操作人'} 的草案备注中，不包含真实密钥。`,
  ];
}

export function buildRealRollbackPlan(input: Partial<RealBackupRollbackContext> = {}): RealRollbackPlan {
  const context = createRealBackupRollbackContext(input);
  const steps: RealRollbackStepDraft[] = [
    rollbackStep(
      context,
      'database_restore',
      '数据库恢复草案',
      '注册、导入或 smoke test 失败且需要恢复测试库。',
      '计划在隔离测试环境使用已确认 dump 恢复数据库；当前不执行 pg_restore。',
    ),
    rollbackStep(
      context,
      'file_storage_restore',
      '文件存储恢复草案',
      '文件存储 snapshot 对比失败或 smoke test 失败。',
      '计划恢复 storage snapshot；当前不删除、不覆盖任何文件。',
    ),
    rollbackStep(
      context,
      'plugin_disable',
      '插件禁用或回滚草案',
      '插件安装状态与测试前不一致。',
      '计划将插件回滚到测试前状态；当前不禁用真实插件。',
    ),
    rollbackStep(
      context,
      'collection_schema_restore',
      'Collection schema 恢复草案',
      'Collection 注册失败或 schema 验证失败。',
      '计划恢复 Collection schema snapshot；当前不修改 NocoBase schema。',
    ),
    rollbackStep(
      context,
      'runtime_registry_restore',
      'Runtime registry 恢复草案',
      '服务、权限、动作、调度或 i18n 注册失败。',
      '计划恢复 runtime registry snapshot；当前不注册或删除 runtime 项。',
    ),
    rollbackStep(
      context,
      'page_schema_restore',
      'Page / UI Schema 恢复草案',
      '页面注册失败或 UI Schema 验证失败。',
      '计划恢复页面 schema snapshot；当前不写 UI Schema。',
    ),
    rollbackStep(
      context,
      'seed_data_cleanup',
      'Seed Data cleanup 草案',
      'mock 数据导入失败或后置验证失败。',
      '计划清理本轮 mock 数据；当前不删除数据库记录。',
    ),
    rollbackStep(
      context,
      'generated_artifacts_cleanup',
      '生成产物 cleanup 草案',
      '合同文件、报表或中间产物生成失败。',
      '计划清理测试生成产物；当前不删除文件。',
    ),
    rollbackStep(
      context,
      'logs_preserve',
      '日志保留草案',
      '任何失败或安全阻断发生。',
      '计划保留日志用于排查；当前不读取或删除真实日志。',
    ),
    rollbackStep(
      context,
      'environment_config_restore',
      '环境配置恢复草案',
      '测试环境配置存在性或隔离性验证失败。',
      '计划恢复测试环境配置占位状态；当前不读取、不输出 .env.test 真实值。',
    ),
  ];
  return {
    mode: context.mode,
    rollbackNo: 'rollback-draft-20260605-000000',
    createdAt,
    triggerConditions: [
      'Collection 注册失败。',
      'Runtime 注册失败。',
      'Page / UI Schema 注册失败。',
      'Seed Data 导入失败。',
      'Smoke Test 失败。',
      '权限或敏感数据验证失败。',
      'IOPGPS 被意外启用。',
    ],
    targets: [...realRollbackTargets],
    steps,
    verificationSteps: buildPostRollbackVerificationPlan(context),
    safetyChecks: [
      '当前仓库不得执行 pg_restore。',
      '当前仓库不得删除 storage。',
      '当前仓库不得禁用真实插件。',
      '当前仓库不得修改 NocoBase schema。',
    ],
    warnings: ['本计划仅为草案，不代表真实回滚完成。'],
    errors: context.mode === 'real' ? ['当前仓库不允许真实回滚。'] : [],
    notes: [...context.notes, '所有回滚动作必须在下一阶段隔离测试环境中重新确认。'],
  };
}

const failureTitle: Record<RealFailureRecoveryType, string> = {
  collection_registration_failed: 'Collection 注册失败',
  runtime_registration_failed: 'Runtime 注册失败',
  page_registration_failed: 'Page / UI Schema 注册失败',
  seed_data_import_failed: 'Seed Data 导入失败',
  smoke_test_failed: 'Smoke Test 失败',
  permission_validation_failed: '权限验证失败',
  gps_sync_unexpected_enabled: 'IOPGPS 意外启用',
  contract_document_generation_failed: '合同文件生成失败',
  overpayment_rule_failed: '单日超付规则失败',
  sensitive_data_exposure_detected: '敏感数据暴露检测失败',
};

export function buildFailureRecoveryPlans(input: Partial<RealBackupRollbackContext> = {}): RealFailureRecoveryPlan[] {
  const context = createRealBackupRollbackContext(input);
  return realFailureTypes.map((failureType) => ({
    mode: context.mode,
    failureType,
    detectionMethod: `通过草案验证、日志保留计划和 smoke test 断言检测：${failureTitle[failureType]}。`,
    isolationSteps: [
      '立即停止后续真实注册或导入步骤。',
      '标记本轮测试为失败，保留现场日志和计划产物。',
      '确认失败仅发生在隔离测试环境和 mock 数据范围内。',
    ],
    rollbackSteps: [
      '按 rollback plan 选择对应目标执行回滚草案。',
      '优先恢复数据库、storage、插件状态和 schema snapshot。',
      '当前仓库只生成计划，不执行任何回滚动作。',
    ],
    verificationSteps: buildPostRollbackVerificationPlan(context),
    escalationSteps: [
      '将失败类型、检测方式、日志位置和草案报告交给负责人复核。',
      '在文档中记录阻塞项，未复核前不得进入 real 模式。',
    ],
    warnings: ['失败恢复计划当前仅为草案。'],
    errors: context.mode === 'real' ? ['当前仓库不允许真实失败恢复执行。'] : [],
    notes: [`${failureTitle[failureType]} 需要在下一阶段隔离测试环境中验证。`],
  }));
}
