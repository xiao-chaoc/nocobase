/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  GoLiveReadinessGateName,
  GoLiveReadinessGateResult,
  GoLiveReadinessGateStatus,
  GoLiveReadinessReport,
  ReadinessLevel,
} from './types';

export interface GoLiveReadinessContext {
  repository?: string;
  branch?: string;
  generatedAt?: string;
  files: string[];
  directories: string[];
  fileContents?: Record<string, string>;
  generatedReports?: Record<string, unknown>;
  commandResults?: Partial<Record<GoLiveReadinessGateName, boolean>>;
  commandErrors?: Partial<Record<GoLiveReadinessGateName, string[]>>;
}

const REQUIRED_GATES: GoLiveReadinessGateName[] = [
  'repository_scan',
  'typecheck',
  'unit_tests',
  'registration_plan',
  'collection_registration_dry_run',
  'runtime_registration_dry_run',
  'page_initialization_dry_run',
  'seed_data_generation',
  'seed_data_validation',
  'seed_data_import_dry_run',
  'smoke_test_dry_run',
  'nas_test_files',
  'security_boundary',
  'forbidden_business_patterns',
  'plugin_installation_readiness',
  'real_nocobase_adapter_readiness',
  'production_readiness',
];

const GATE_META: Record<
  GoLiveReadinessGateName,
  Omit<GoLiveReadinessGateResult, 'status' | 'evidence' | 'blockers' | 'warnings' | 'next_actions'>
> = {
  repository_scan: {
    name: 'repository_scan',
    title: '仓库扫描',
    description: '确认 current-repository-scan 文档存在且关键文件未缺失。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  typecheck: {
    name: 'typecheck',
    title: 'TypeScript 类型检查',
    description: '确认 npm run typecheck 已通过或记录明确失败原因。',
    required_for_nas_test: false,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  unit_tests: {
    name: 'unit_tests',
    title: '纯函数与脚本测试',
    description: '确认 npm run test 已通过或记录明确失败原因。',
    required_for_nas_test: false,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  registration_plan: {
    name: 'registration_plan',
    title: '自动化注册计划',
    description: '确认注册计划已生成并通过校验。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  collection_registration_dry_run: {
    name: 'collection_registration_dry_run',
    title: 'Collection 注册 dry-run',
    description: '确认 Collection 注册 dry-run 结果存在且成功。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  runtime_registration_dry_run: {
    name: 'runtime_registration_dry_run',
    title: 'Runtime 注册 dry-run',
    description: '确认服务、动作、权限、定时任务和 i18n dry-run 结果存在且成功。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  page_initialization_dry_run: {
    name: 'page_initialization_dry_run',
    title: '页面初始化 dry-run',
    description: '确认菜单、页面、区块、筛选器和按钮动作 dry-run 结果存在且成功。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  seed_data_generation: {
    name: 'seed_data_generation',
    title: 'mock 测试数据生成',
    description: '确认 mock 测试数据生成产物存在。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: false,
  },
  seed_data_validation: {
    name: 'seed_data_validation',
    title: 'mock 测试数据校验',
    description: '确认 mock 测试数据校验通过。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: false,
  },
  seed_data_import_dry_run: {
    name: 'seed_data_import_dry_run',
    title: 'mock 测试数据导入 dry-run',
    description: '确认测试数据导入 dry-run 结果存在且成功。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: false,
  },
  smoke_test_dry_run: {
    name: 'smoke_test_dry_run',
    title: '自动化 Smoke Test dry-run',
    description: '确认统一 smoke test dry-run 报告存在且通过。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  nas_test_files: {
    name: 'nas_test_files',
    title: 'NAS 测试基础文件',
    description: '确认 NAS 测试 compose、env 模板和 runbook 齐备且没有风险挂载。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: false,
  },
  security_boundary: {
    name: 'security_boundary',
    title: '安全边界',
    description: '确认仓库没有真实密钥、真实 env、真实证件、截图、合同扫描件或 IOPGPS 凭据。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  forbidden_business_patterns: {
    name: 'forbidden_business_patterns',
    title: '禁止业务模式',
    description: '确认 dry-run 产物不包含短租、司机登录、按车型出租、GPS 参与租金计算或押金计入租金。',
    required_for_nas_test: true,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  plugin_installation_readiness: {
    name: 'plugin_installation_readiness',
    title: '插件安装准备度',
    description: '确认插件结构和注册描述齐备，但真实插件安装尚未执行。',
    required_for_nas_test: false,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  real_nocobase_adapter_readiness: {
    name: 'real_nocobase_adapter_readiness',
    title: '真实 NocoBase adapter 准备度',
    description: '确认真实 NocoBase adapter 已实现并验证。当前 dry-run 阶段预计未通过。',
    required_for_nas_test: false,
    required_for_plugin_integration_test: true,
    required_for_production: true,
  },
  production_readiness: {
    name: 'production_readiness',
    title: '生产部署准备度',
    description: '确认真实插件安装、UAT、权限、备份回滚和固定版本均已完成。当前阶段不适用。',
    required_for_nas_test: false,
    required_for_plugin_integration_test: false,
    required_for_production: true,
  },
};

function normalizePath(file: string): string {
  return file.replace(/^\.\//, '').replace(/\\/g, '/');
}

function hasFile(context: GoLiveReadinessContext, file: string): boolean {
  const files = new Set(context.files.map(normalizePath));
  return files.has(file);
}

function hasDir(context: GoLiveReadinessContext, dir: string): boolean {
  const normalized = dir.replace(/\/$/, '');
  const dirs = new Set(context.directories.map((item) => normalizePath(item).replace(/\/$/, '')));
  return dirs.has(normalized);
}

function reportSuccess(report: unknown): boolean {
  if (!report || typeof report !== 'object') return false;
  const value = report as {
    result?: { success?: boolean };
    report?: { success?: boolean };
    success?: boolean;
    validation?: { passed?: boolean };
  };
  return (
    value.success === true ||
    value.result?.success === true ||
    value.report?.success === true ||
    value.validation?.passed === true
  );
}

function makeGate(
  name: GoLiveReadinessGateName,
  status: GoLiveReadinessGateStatus,
  evidence: string[],
  blockers: string[] = [],
  warnings: string[] = [],
  nextActions: string[] = [],
): GoLiveReadinessGateResult {
  return {
    ...GATE_META[name],
    status,
    evidence,
    blockers,
    warnings,
    next_actions: nextActions.length > 0 ? nextActions : defaultNextActions(name, status),
  };
}

function defaultNextActions(name: GoLiveReadinessGateName, status: GoLiveReadinessGateStatus): string[] {
  if (status === 'passed') return ['保留当前证据，进入下一项 readiness gate。'];
  if (name === 'real_nocobase_adapter_readiness') return ['下一轮应实现真实 NocoBase adapter，并在隔离环境中验证。'];
  if (name === 'production_readiness')
    return ['等待真实插件安装、UAT、权限验证、备份回滚和固定版本全部完成后再评估生产部署。'];
  return [`修复 ${GATE_META[name].title} 后重新生成 readiness 报告。`];
}

function commandGate(
  context: GoLiveReadinessContext,
  name: GoLiveReadinessGateName,
  evidence: string[],
): GoLiveReadinessGateResult {
  const commandValue = context.commandResults?.[name];
  if (commandValue === true) return makeGate(name, 'passed', evidence);
  if (commandValue === false)
    return makeGate(name, 'failed', evidence, context.commandErrors?.[name] ?? [`${GATE_META[name].title} 命令失败。`]);
  return makeGate(
    name,
    'warning',
    evidence,
    [],
    [`本报告未直接执行 ${GATE_META[name].title}；请以本轮命令输出作为证据。`],
    [`确认 ${GATE_META[name].title} 在当前检查链路中通过。`],
  );
}

function generatedArtifactGate(
  context: GoLiveReadinessContext,
  name: GoLiveReadinessGateName,
  file: string,
  missingBlocker: string,
): GoLiveReadinessGateResult {
  if (!hasFile(context, file)) return makeGate(name, 'failed', [file], [missingBlocker]);
  if (!context.generatedReports || !(file in context.generatedReports)) {
    return makeGate(
      name,
      'warning',
      [file],
      [],
      [`${file} 存在，但本次报告未读取到可解析 JSON 内容，无法确认内部 success 或 validation 状态。`],
      [`重新生成并校验 ${GATE_META[name].title} 后，再生成 readiness 报告。`],
    );
  }
  if (!reportSuccess(context.generatedReports[file])) {
    return makeGate(name, 'failed', [file], [`${file} 存在，但报告未显示 success 或 validation 通过。`]);
  }
  return makeGate(name, 'passed', [file]);
}

function scanSecurityRisks(context: GoLiveReadinessContext): string[] {
  const risks: string[] = [];
  const files = new Set(context.files.map(normalizePath));
  for (const envFile of ['.env', '.env.test']) {
    if (files.has(envFile)) risks.push(`仓库包含禁止提交的环境文件：${envFile}`);
  }
  const text = Object.values(context.fileContents ?? {}).join('\n');
  const secretPatterns = [
    /sk-[A-Za-z0-9_-]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /access_token["'\s:=]+(?!TEST_|MOCK_|MASKED_|PLACEHOLDER_|已脱敏)[A-Za-z0-9._-]{16,}/i,
    /login_key["'\s:=]+(?!TEST_|MOCK_|MASKED_|PLACEHOLDER_|已脱敏)[A-Za-z0-9._-]{12,}/i,
    /https?:\/\/[^\s"']*(payment|screenshot|scan|contract)[^\s"']*/i,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) risks.push(`发现疑似真实敏感数据或凭据：${pattern}`);
  }
  return risks;
}

function scanForbiddenRisks(context: GoLiveReadinessContext): string[] {
  const risks: string[] = [];
  const text = Object.entries(context.fileContents ?? {})
    .filter(([fileName]) => fileName.includes('generated/') || fileName.endsWith('docker-compose.test.yml'))
    .map(([, content]) => content)
    .join('\n')
    .toLowerCase();
  for (const forbidden of [
    'booking',
    'reservation',
    'short_rental_order',
    'driver_login',
    'customer_portal',
    'vehicle_category_rental',
    'gps_rent_calculation',
    'deposit_as_rent_payment',
  ]) {
    if (text.includes(forbidden)) risks.push(`dry-run 产物中出现禁止业务模式：${forbidden}`);
  }
  return risks;
}

function nasRisks(context: GoLiveReadinessContext): { blockers: string[]; warnings: string[]; evidence: string[] } {
  const required = [
    'docker-compose.test.yml',
    '.env.test.example',
    'docs/deployment-nas-test.md',
    'docs/nas-test-runbook.md',
    'docs/nas-smoke-test-checklist.md',
  ];
  const blockers = required.filter((file) => !hasFile(context, file)).map((file) => `缺少 NAS 测试基础文件：${file}`);
  const warnings: string[] = [];
  const compose = context.fileContents?.['docker-compose.test.yml'] ?? '';
  if (compose) {
    const activeComposeLines = compose
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
    if (activeComposeLines.some((line) => line.includes('packages/plugins')))
      blockers.push('docker-compose.test.yml 不应直接挂载 packages/plugins。');
    if (!compose.includes('storage-test/nocobase'))
      blockers.push('docker-compose.test.yml 未使用独立 NocoBase storage 目录。');
    if (!compose.includes('storage-test/postgres'))
      blockers.push('docker-compose.test.yml 未使用独立 PostgreSQL 数据目录。');
    if (compose.includes('./storage-test:/app/nocobase/storage'))
      blockers.push('NocoBase storage 和 PostgreSQL 数据目录存在混放风险。');
    if (/(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})/.test(compose))
      blockers.push('docker-compose.test.yml 疑似包含真实密钥。');
  } else if (hasFile(context, 'docker-compose.test.yml')) {
    warnings.push('未提供 docker-compose.test.yml 文本，无法做挂载与密钥细检。');
  }
  return { blockers, warnings, evidence: required.filter((file) => hasFile(context, file)) };
}

export function buildGoLiveReadinessGates(context: GoLiveReadinessContext): GoLiveReadinessGateResult[] {
  const gates: GoLiveReadinessGateResult[] = [];
  const scanText = context.fileContents?.['docs/current-repository-scan.md'] ?? '';
  const scanHasMissingStatus = /：缺失（(?:文件|目录)）/.test(scanText);
  const scanMissingSection = scanText.match(/## 缺失项\n\n([\s\S]*?)(?:\n## |$)/)?.[1].trim() ?? '';
  const scanHasListedMissing = scanMissingSection.length > 0 && !/^[-*]\s*无。?$/.test(scanMissingSection);
  const scanBlockers = !hasFile(context, 'docs/current-repository-scan.md')
    ? ['缺少 docs/current-repository-scan.md。']
    : scanHasMissingStatus || scanHasListedMissing
      ? ['仓库扫描记录显示存在缺失项。']
      : [];
  gates.push(
    makeGate(
      'repository_scan',
      scanBlockers.length ? 'failed' : 'passed',
      ['docs/current-repository-scan.md'],
      scanBlockers,
    ),
  );

  gates.push(commandGate(context, 'typecheck', ['npm run typecheck']));
  gates.push(commandGate(context, 'unit_tests', ['npm run test']));

  gates.push(
    generatedArtifactGate(
      context,
      'registration_plan',
      'test-data/generated/automated-registration-plan.generated.json',
      '缺少自动化注册计划产物。',
    ),
  );
  gates.push(
    generatedArtifactGate(
      context,
      'collection_registration_dry_run',
      'test-data/generated/collection-registration-dry-run.generated.json',
      '缺少 Collection dry-run 产物。',
    ),
  );
  gates.push(
    generatedArtifactGate(
      context,
      'runtime_registration_dry_run',
      'test-data/generated/runtime-registration-dry-run.generated.json',
      '缺少 Runtime dry-run 产物。',
    ),
  );
  gates.push(
    generatedArtifactGate(
      context,
      'page_initialization_dry_run',
      'test-data/generated/page-initialization-dry-run.generated.json',
      '缺少页面初始化 dry-run 产物。',
    ),
  );

  const seedEvidence = [
    'test-data/generated/drivers.generated.json',
    'test-data/generated/vehicles.generated.json',
    'test-data/generated/generation-summary.generated.json',
  ];
  const seedMissing = seedEvidence.filter((file) => !hasFile(context, file));
  gates.push(
    makeGate(
      'seed_data_generation',
      seedMissing.length ? 'failed' : 'passed',
      seedEvidence.filter((file) => hasFile(context, file)),
      seedMissing.map((file) => `缺少 mock 测试数据产物：${file}`),
    ),
  );
  gates.push(commandGate(context, 'seed_data_validation', ['npm run validate:test-data']));
  gates.push(
    generatedArtifactGate(
      context,
      'seed_data_import_dry_run',
      'test-data/generated/seed-data-import-dry-run.generated.json',
      '缺少测试数据导入 dry-run 产物。',
    ),
  );

  const smokeReport = context.generatedReports?.['test-data/generated/automated-smoke-test-report.generated.json'];
  const smokePassed =
    hasFile(context, 'test-data/generated/automated-smoke-test-report.generated.json') && reportSuccess(smokeReport);
  gates.push(
    makeGate(
      'smoke_test_dry_run',
      smokePassed ? 'passed' : 'failed',
      ['test-data/generated/automated-smoke-test-report.generated.json'],
      smokePassed ? [] : ['缺少 smoke test 报告或报告未通过。'],
    ),
  );

  const nas = nasRisks(context);
  gates.push(
    makeGate('nas_test_files', nas.blockers.length ? 'failed' : 'passed', nas.evidence, nas.blockers, nas.warnings),
  );

  const security = scanSecurityRisks(context);
  gates.push(
    makeGate('security_boundary', security.length ? 'failed' : 'passed', ['仓库文件列表与关键文本扫描'], security),
  );
  const forbidden = scanForbiddenRisks(context);
  gates.push(
    makeGate(
      'forbidden_business_patterns',
      forbidden.length ? 'failed' : 'passed',
      ['dry-run 产物文本扫描'],
      forbidden,
    ),
  );

  const pluginEvidence = [
    'packages/plugins/plugin-rental-core',
    'packages/plugins/plugin-iopgps',
    'packages/plugins/plugin-contract-documents',
  ];
  const pluginMissing = pluginEvidence.filter((dir) => !hasDir(context, dir));
  gates.push(
    makeGate(
      'plugin_installation_readiness',
      pluginMissing.length ? 'failed' : 'warning',
      pluginEvidence.filter((dir) => hasDir(context, dir)),
      pluginMissing.map((dir) => `缺少插件目录：${dir}`),
      pluginMissing.length ? [] : ['插件结构和注册描述齐备，但尚未在真实 NocoBase 中安装。'],
      ['下一轮实现真实 NocoBase adapter 后，再执行真实插件安装测试。'],
    ),
  );

  gates.push(
    makeGate(
      'real_nocobase_adapter_readiness',
      'failed',
      ['当前仓库仅包含 mock adapter 与 dry-run 执行器'],
      ['真实 NocoBase adapter 尚未实现并验证，不能进入真实插件接入测试。'],
      [],
      ['下一轮应实现真实 NocoBase adapter，而不是继续新增 dry-run。'],
    ),
  );
  gates.push(
    makeGate(
      'production_readiness',
      'not_applicable',
      ['当前阶段没有真实插件安装、UAT、权限验证、备份回滚和固定版本证据'],
      [],
      ['当前阶段禁止标记为 production_ready。'],
      ['等待真实插件接入、UAT、回滚演练和生产检查全部通过后再评估生产部署。'],
    ),
  );

  return gates;
}

function gate(gates: GoLiveReadinessGateResult[], name: GoLiveReadinessGateName): GoLiveReadinessGateResult {
  const found = gates.find((item) => item.name === name);
  if (!found) throw new Error(`缺少 readiness gate：${name}`);
  return found;
}

function isPassed(gates: GoLiveReadinessGateResult[], name: GoLiveReadinessGateName): boolean {
  return gate(gates, name).status === 'passed';
}

export function evaluateGoLiveReadiness(
  gates: GoLiveReadinessGateResult[],
  options: { repository?: string; branch?: string; generatedAt?: string } = {},
): GoLiveReadinessReport {
  const blockers = gates.flatMap((item) => item.blockers.map((blocker) => `${item.name}：${blocker}`));
  const warnings = gates.flatMap((item) => item.warnings.map((warning) => `${item.name}：${warning}`));
  const securityFailed = gate(gates, 'security_boundary').status === 'failed';
  const forbiddenFailed = gate(gates, 'forbidden_business_patterns').status === 'failed';
  const realAdapterReady = isPassed(gates, 'real_nocobase_adapter_readiness');
  const smokePassed = isPassed(gates, 'smoke_test_dry_run');
  const nasPassed = isPassed(gates, 'nas_test_files');

  let readinessLevel: ReadinessLevel = 'dry_run_only';
  if (smokePassed && nasPassed && !realAdapterReady) readinessLevel = 'nas_base_environment_ready';
  if (smokePassed && nasPassed && realAdapterReady) readinessLevel = 'plugin_integration_test_ready';
  if (gate(gates, 'production_readiness').status === 'passed') readinessLevel = 'production_ready';
  if (readinessLevel === 'production_ready' && gate(gates, 'production_readiness').status !== 'passed')
    readinessLevel = 'production_not_ready';

  const allowedNextStage =
    smokePassed && nasPassed
      ? ['real_nocobase_adapter_implementation', 'nas_base_environment_test']
      : ['fix_dry_run_or_documentation'];
  const forbiddenNextStage = [
    ...(!realAdapterReady ? ['plugin_integration_test_ready'] : []),
    'uat_ready',
    'production_deployment',
  ];
  const nextActions =
    blockers.length > 0
      ? Array.from(new Set(gates.flatMap((item) => (item.blockers.length > 0 ? item.next_actions : []))))
      : ['实现真实 NocoBase adapter，并在隔离环境中验证插件安装、权限、页面和数据导入。'];
  const evidenceFiles = Array.from(new Set(gates.flatMap((item) => item.evidence).filter(Boolean)));

  return {
    report_no: `GO-LIVE-READINESS-${(options.generatedAt ?? new Date().toISOString()).slice(0, 10).replace(/-/g, '')}`,
    generated_at: options.generatedAt ?? new Date().toISOString(),
    repository: options.repository ?? 'car-rental-nocobase',
    branch: options.branch ?? 'work',
    success: blockers.length === 0 && !securityFailed && !forbiddenFailed,
    readiness_level: readinessLevel,
    gates,
    blockers,
    warnings,
    allowed_next_stage: allowedNextStage,
    forbidden_next_stage: Array.from(new Set(forbiddenNextStage)),
    next_actions: nextActions.length > 0 ? nextActions : ['继续保留 dry-run 边界并准备真实 adapter。'],
    evidence_files: evidenceFiles,
    notes: [
      '本报告只基于仓库文件、dry-run 产物和本地报告生成。',
      '本报告不连接真实 NocoBase，不部署 NAS，不安装真实插件，不调用 IOPGPS。',
      '当前阶段不得标记为 production_ready；生产部署必须等待真实插件安装、UAT、权限验证、备份回滚和固定版本全部通过。',
    ],
  };
}

export function summarizeGoLiveReadiness(report: GoLiveReadinessReport): string {
  const canNas =
    report.allowed_next_stage.includes('nas_base_environment_test') &&
    !report.forbidden_next_stage.includes('nas_base_environment_test');
  const canPlugin =
    report.readiness_level === 'plugin_integration_test_ready' ||
    report.readiness_level === 'uat_ready' ||
    report.readiness_level === 'production_ready';
  const canUat = report.readiness_level === 'uat_ready' || report.readiness_level === 'production_ready';
  const canProduction = report.readiness_level === 'production_ready';
  return [
    `当前 readiness_level：${report.readiness_level}`,
    `是否可进入 NAS 基础环境测试：${canNas ? '是' : '否'}`,
    `是否可进入真实 NocoBase 插件接入测试：${canPlugin ? '是' : '否'}`,
    `是否可进入 UAT：${canUat ? '是' : '否'}`,
    `是否可生产部署：${canProduction ? '是' : '否'}`,
    `阻塞项数量：${report.blockers.length}`,
    ...(report.blockers.length ? report.blockers.map((item) => `- 阻塞：${item}`) : ['- 阻塞：无']),
    `警告项数量：${report.warnings.length}`,
    ...(report.warnings.length ? report.warnings.map((item) => `- 警告：${item}`) : ['- 警告：无']),
    '下一步建议：',
    ...report.next_actions.map((item) => `- ${item}`),
  ].join('\n');
}

export function getRequiredGoLiveReadinessGateNames(): GoLiveReadinessGateName[] {
  return REQUIRED_GATES;
}

export function renderGoLiveReadinessMarkdown(report: GoLiveReadinessReport): string {
  const gateRows = report.gates
    .map(
      (gate) =>
        `| ${gate.name} | ${gate.status} | ${gate.required_for_nas_test ? '是' : '否'} | ${
          gate.required_for_plugin_integration_test ? '是' : '否'
        } | ${gate.required_for_production ? '是' : '否'} |`,
    )
    .join('\n');
  const blockers = report.blockers.length ? report.blockers.map((item) => `- ${item}`).join('\n') : '- 无';
  const warnings = report.warnings.length ? report.warnings.map((item) => `- ${item}`).join('\n') : '- 无';
  const nextActions = report.next_actions.map((item) => `- ${item}`).join('\n');
  return (
    `# 正式上线测试前 readiness 报告\n\n` +
    `- 报告编号：${report.report_no}\n` +
    `- 生成时间：${report.generated_at}\n` +
    `- 仓库：${report.repository}\n` +
    `- 分支：${report.branch}\n` +
    `- 当前 readiness_level：${report.readiness_level}\n` +
    `- 是否可生产部署：${report.readiness_level === 'production_ready' ? '是' : '否'}\n\n` +
    `## Gate 明细\n\n` +
    `| Gate | 状态 | 阻塞 NAS 测试 | 阻塞插件接入测试 | 阻塞生产 |\n` +
    `| --- | --- | --- | --- | --- |\n${gateRows}\n\n` +
    `## 阻塞项\n\n${blockers}\n\n` +
    `## 警告项\n\n${warnings}\n\n` +
    `## 下一步建议\n\n${nextActions}\n\n` +
    `## 说明\n\n` +
    `本报告只做 readiness 评估，不连接真实 NocoBase，不部署 NAS，不安装插件，不调用 IOPGPS，不生成真实合同文件。\n`
  );
}
