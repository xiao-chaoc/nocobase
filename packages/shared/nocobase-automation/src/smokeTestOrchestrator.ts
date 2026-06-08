/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  SmokeTestDryRunResult,
  SmokeTestPlanStep,
  SmokeTestReport,
  SmokeTestStepName,
  SmokeTestStepResult,
  SmokeTestStepStatus,
  ValidationResult,
} from './types';

const REPOSITORY_SCAN_COMMAND =
  "find . -maxdepth 5 -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './.test-dist/*' -not -path './storage-test/*' -not -path './backups-test/*' -not -path './logs-test/*' -not -path './test-runtime/*' | sort";

const REQUIRED_PREREQUISITE_FILES = [
  'package.json',
  'docker-compose.test.yml',
  '.env.test.example',
  'scripts/nocobase/generate-automated-registration-plan.ts',
  'scripts/nocobase/dry-run-register-collections.ts',
  'scripts/nocobase/dry-run-register-runtime.ts',
  'scripts/nocobase/dry-run-initialize-pages.ts',
  'scripts/nocobase/dry-run-import-test-data.ts',
];

export function buildSmokeTestPlan(): SmokeTestPlanStep[] {
  return [
    {
      name: 'repository_scan',
      title: '仓库结构检查',
      command: REPOSITORY_SCAN_COMMAND,
      artifacts: ['docs/current-repository-scan.md'],
      blocking: true,
      notes: ['只检查本地工作区关键文件，不检查 git remote，不连接真实 NocoBase。'],
    },
    {
      name: 'generate_registration_plan',
      title: '自动化注册计划生成',
      command: 'npm run generate:registration-plan',
      artifacts: ['test-data/generated/automated-registration-plan.generated.json'],
      blocking: true,
      notes: ['生成 Collection、Runtime、页面与测试数据 dry-run 的基础计划。'],
    },
    {
      name: 'validate_registration_plan',
      title: '自动化注册计划校验',
      command: 'npm run validate:registration-plan',
      artifacts: ['test-data/generated/automated-registration-plan.generated.json'],
      blocking: true,
      notes: ['校验注册计划完整性与禁止业务模式。'],
    },
    {
      name: 'dry_run_register_collections',
      title: 'Collection 注册 dry-run',
      command: 'npm run dry-run:register-collections',
      artifacts: ['test-data/generated/collection-registration-dry-run.generated.json'],
      blocking: true,
      notes: ['使用 mock adapter 模拟 Collection 注册，不写数据库。'],
    },
    {
      name: 'validate_collection_registration',
      title: 'Collection 注册结果校验',
      command: 'npm run validate:collection-registration',
      artifacts: ['test-data/generated/collection-registration-dry-run.generated.json'],
      blocking: true,
      notes: ['确认 Collection dry-run 产物可用于后续步骤。'],
    },
    {
      name: 'dry_run_register_runtime',
      title: 'Runtime 注册 dry-run',
      command: 'npm run dry-run:register-runtime',
      artifacts: ['test-data/generated/runtime-registration-dry-run.generated.json'],
      blocking: true,
      notes: ['模拟服务、动作、权限、定时任务与 i18n 注册。'],
    },
    {
      name: 'validate_runtime_registration',
      title: 'Runtime 注册结果校验',
      command: 'npm run validate:runtime-registration',
      artifacts: ['test-data/generated/runtime-registration-dry-run.generated.json'],
      blocking: true,
      notes: ['确认 runtime dry-run 计划覆盖核心服务、动作、角色和语言。'],
    },
    {
      name: 'dry_run_initialize_pages',
      title: '页面初始化 dry-run',
      command: 'npm run dry-run:initialize-pages',
      artifacts: ['test-data/generated/page-initialization-dry-run.generated.json'],
      blocking: true,
      notes: ['模拟菜单、页面、区块、筛选器和按钮动作初始化。'],
    },
    {
      name: 'validate_page_initialization',
      title: '页面初始化结果校验',
      command: 'npm run validate:page-initialization',
      artifacts: ['test-data/generated/page-initialization-dry-run.generated.json'],
      blocking: true,
      notes: ['确认页面计划、敏感字段与必需动作完整。'],
    },
    {
      name: 'seed_test_data',
      title: 'mock 测试数据生成',
      command: 'npm run seed:test-data',
      artifacts: ['test-data/generated/generation-summary.generated.json'],
      blocking: true,
      notes: ['生成本地 mock JSON 数据，不导入数据库。'],
    },
    {
      name: 'validate_test_data',
      title: 'mock 测试数据校验',
      command: 'npm run validate:test-data',
      artifacts: ['test-data/generated/generation-summary.generated.json'],
      blocking: true,
      notes: ['校验 mock 数据业务规则与敏感数据占位。'],
    },
    {
      name: 'dry_run_import_test_data',
      title: 'mock 测试数据导入 dry-run',
      command: 'npm run dry-run:import-test-data',
      artifacts: ['test-data/generated/seed-data-import-dry-run.generated.json'],
      blocking: true,
      notes: ['模拟导入测试数据，不连接 NocoBase、不写数据库、不上传文件。'],
    },
    {
      name: 'validate_seed_data_import',
      title: 'mock 测试数据导入结果校验',
      command: 'npm run validate:seed-data-import',
      artifacts: ['test-data/generated/seed-data-import-dry-run.generated.json'],
      blocking: true,
      notes: ['确认导入 dry-run 结果没有引用、唯一键或业务规则错误。'],
    },
    {
      name: 'preflight_nas_test',
      title: 'NAS 测试文件预检',
      command: 'npm run preflight:nas-test',
      artifacts: ['docker-compose.test.yml', '.env.test.example'],
      blocking: true,
      notes: ['只执行本地文件预检，不部署真实 NAS。脚本不存在时必须明确 skipped。'],
    },
    {
      name: 'generate_smoke_report',
      title: '生成统一 Smoke Test 报告',
      command: '生成 JSON 与 Markdown 报告',
      artifacts: [
        'test-data/generated/automated-smoke-test-report.generated.json',
        'test-data/generated/automated-smoke-test-report.generated.md',
      ],
      blocking: false,
      notes: ['汇总所有步骤状态、阻塞项、警告、产物与下一步动作。'],
    },
  ];
}

export function createSmokeTestStepResult(input: {
  name: SmokeTestStepName;
  status: SmokeTestStepStatus;
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  command?: string;
  output_summary?: string;
  warnings?: string[];
  errors?: string[];
  artifacts?: string[];
}): SmokeTestStepResult {
  const now = new Date().toISOString();
  return {
    name: input.name,
    status: input.status,
    started_at: input.started_at ?? now,
    finished_at: input.finished_at ?? input.started_at ?? now,
    duration_ms: input.duration_ms ?? 0,
    command: input.command ?? '',
    output_summary: input.output_summary ?? '',
    warnings: input.warnings ?? [],
    errors: input.errors ?? [],
    artifacts: input.artifacts ?? [],
  };
}

export function summarizeSmokeTestResult(stepResults: SmokeTestStepResult[]): SmokeTestDryRunResult {
  const plan = buildSmokeTestPlan();
  const blockingNames = new Set(plan.filter((step) => step.blocking).map((step) => step.name));
  const started = stepResults[0]?.started_at ?? new Date().toISOString();
  const finished = stepResults[stepResults.length - 1]?.finished_at ?? started;
  const duration = Math.max(0, new Date(finished).getTime() - new Date(started).getTime());

  const failedBlockingSteps = stepResults.filter((step) => step.status === 'failed' && blockingNames.has(step.name));
  const warnings = stepResults.flatMap((step) => step.warnings.map((warning) => `${step.name}：${warning}`));
  const errors = stepResults.flatMap((step) => step.errors.map((error) => `${step.name}：${error}`));
  const blockers = failedBlockingSteps.map((step) => `${step.name} 阻塞失败：${step.errors[0] ?? step.output_summary}`);
  const artifacts = Array.from(new Set(stepResults.flatMap((step) => step.artifacts)));
  const failedSteps = stepResults.filter((step) => step.status === 'failed').length;
  const warningSteps = stepResults.filter((step) => step.status === 'warning').length;
  const skippedSteps = stepResults.filter((step) => step.status === 'skipped').length;
  const passedSteps = stepResults.filter((step) => step.status === 'passed').length;
  const nextActions =
    blockers.length > 0
      ? blockers.map((blocker) => `修复 ${blocker} 后重新运行 npm run smoke:dry-run。`)
      : ['保留 dry-run 边界，进入真实 NocoBase adapter 设计与隔离测试环境准备。'];

  return {
    success: failedBlockingSteps.length === 0 && failedSteps === 0,
    started_at: started,
    finished_at: finished,
    duration_ms: duration,
    steps: stepResults,
    warnings,
    errors,
    summary: {
      total_steps: stepResults.length,
      passed_steps: passedSteps,
      failed_steps: failedSteps,
      warning_steps: warningSteps,
      skipped_steps: skippedSteps,
      blocking_failed_steps: failedBlockingSteps.length,
      dryRunOnly: true,
    },
    artifacts,
    next_actions: nextActions,
  };
}

export function buildSmokeTestReport(result: SmokeTestDryRunResult): SmokeTestReport {
  const generatedAt = result.finished_at || new Date().toISOString();
  const reportDate = generatedAt.slice(0, 10).replace(/-/g, '');
  const failedBlockingSteps = result.errors.filter((error) => error.includes('阻塞') || error.includes('failed'));
  return {
    report_no: `SMOKE-DRY-RUN-${reportDate}`,
    generated_at: generatedAt,
    environment: 'Codex Web 本地 dry-run 工作区',
    success: result.success,
    passed_steps: result.summary.passed_steps,
    failed_steps: result.summary.failed_steps,
    warning_steps: result.summary.warning_steps,
    skipped_steps: result.summary.skipped_steps,
    blockers: result.summary.blocking_failed_steps > 0 ? result.next_actions : failedBlockingSteps,
    warnings: result.warnings,
    artifacts: result.artifacts,
    next_actions: result.next_actions,
    notes: [
      '本报告只来自本地脚本与 mock adapter dry-run。',
      '本报告不代表真实 NocoBase、真实数据库、真实 NAS 或真实 IOPGPS 已经完成上线测试。',
      '后续接入真实 NocoBase 工程时需要替换真实 adapter 并重新执行隔离环境验证。',
    ],
  };
}

export function validateSmokeTestPrerequisites(fileList: string[]): ValidationResult {
  const normalizedFiles = new Set(fileList.map((file) => file.replace(/^\.\//, '')));
  const errors = REQUIRED_PREREQUISITE_FILES.filter((requiredFile) => !normalizedFiles.has(requiredFile)).map(
    (requiredFile) => `缺少 smoke test 前置文件：${requiredFile}`,
  );

  return {
    passed: errors.length === 0,
    warnings: [],
    errors,
  };
}
