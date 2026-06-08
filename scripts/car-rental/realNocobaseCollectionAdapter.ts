import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  CollectionRelationType,
  RealCollectionFieldSchemaDraft,
  RealCollectionIndexSchemaDraft,
  RealCollectionRegistrationMode,
  RealCollectionRelationSchemaDraft,
  RealCollectionSchemaDraft,
} from '../../packages/shared/nocobase-automation/src/types';

export interface NocobaseCollectionApiEvidence {
  capability: string;
  filePath: string;
  methodName: string;
  summary: string;
  usableForAdapter: boolean;
  verified: boolean;
  requiresValidation: boolean;
}

export interface NocobaseCollectionApiInspectionResult {
  rootDir: string;
  targetVersion: '2.0.61';
  hasDatabaseCollectionMethod: boolean;
  hasDefineCollectionHelper: boolean;
  hasRepositoryApi: boolean;
  hasCollectionModelLoadApi: boolean;
  hasDbSync: boolean;
  hasMigrationApi: boolean;
  hasCollectionDefinitionExamples: boolean;
  canPlanWithVerifiedApi: boolean;
  canDryRunWithoutDatabaseWrites: true;
  evidence: NocobaseCollectionApiEvidence[];
  warnings: string[];
  errors: string[];
}

export interface NocobaseCollectionFieldSchema {
  name: string;
  type: string;
  interface?: string;
  title?: string;
  allowNull?: boolean;
  defaultValue?: unknown;
  unique?: boolean;
  index?: boolean;
  target?: string;
  foreignKey?: string;
  targetKey?: string;
  sourceKey?: string;
  uiSchema?: Record<string, unknown>;
  carRental?: {
    sensitive?: boolean;
    notes: string[];
  };
}

export interface NocobaseCollectionSchemaDraft {
  name: string;
  title: string;
  origin: string;
  dumpRules: { group: string };
  migrationRules: string[];
  fields: NocobaseCollectionFieldSchema[];
  indexes: Array<{ name: string; fields: string[]; unique: boolean; notes: string[] }>;
  uniqueConstraints: string[][];
  relations: RealCollectionRelationSchemaDraft[];
  sensitiveFields: string[];
  sourcePlugin: string;
  notes: string[];
  metadata: {
    generatedBy: 'car-rental-real-nocobase-collection-adapter';
    planOnly: true;
    dryRunOnly: true;
  };
}

export interface NocobaseCollectionSchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PlannedCollectionRegistration {
  collectionName: string;
  plannedAction: 'plan_schema' | 'validate_schema' | 'dry_run_register' | 'blocked_real_register';
  schema: NocobaseCollectionSchemaDraft;
  validation: NocobaseCollectionSchemaValidationResult;
  executed: false;
  writesDatabase: false;
  createsCollection: false;
  runsMigration: false;
}

export interface CollectionRegistrationPlanOnlyResult {
  mode: RealCollectionRegistrationMode;
  executed: false;
  writesDatabase: false;
  createsCollection: false;
  runsMigration: false;
  apiInspection: NocobaseCollectionApiInspectionResult;
  collections: PlannedCollectionRegistration[];
  warnings: string[];
  errors: string[];
}

export interface CollectionExecutionContext {
  mode: RealCollectionRegistrationMode;
  allowRealExecution?: boolean;
  backupConfirmed?: boolean;
  isolatedDatabase?: boolean;
  iopgpsDisabled?: boolean;
  mockDataOnly?: boolean;
}

export class CollectionRegistrationExecutionBlockedError extends Error {
  constructor(
    message: string,
    public readonly reasons: string[],
  ) {
    super(message);
    this.name = 'CollectionRegistrationExecutionBlockedError';
  }
}

const API_EVIDENCE: NocobaseCollectionApiEvidence[] = [
  {
    capability: 'database.collection',
    filePath: 'packages/core/database/src/database.ts',
    methodName: 'Database.collection(options)',
    summary:
      'Database.collection(options) 会 clone options、触发 beforeDefineCollection/afterDefineCollection，并通过 collectionFactory 创建 Collection。',
    usableForAdapter: true,
    verified: true,
    requiresValidation: false,
  },
  {
    capability: 'database.import',
    filePath: 'packages/core/database/src/database.ts',
    methodName: 'Database.import({ directory, from, extensions })',
    summary: 'Database.import 通过 ImporterReader 读取目录，并对每个模块调用 this.collection({...module, origin})。',
    usableForAdapter: true,
    verified: true,
    requiresValidation: true,
  },
  {
    capability: 'defineCollection',
    filePath: 'packages/core/database/src/database.ts',
    methodName: 'defineCollection(collectionOptions)',
    summary: 'defineCollection 直接返回 CollectionOptions，是插件内声明 Collection 的现有 helper。',
    usableForAdapter: true,
    verified: true,
    requiresValidation: false,
  },
  {
    capability: 'repository',
    filePath: 'packages/core/database/src/database.ts',
    methodName: 'Database.getRepository(name)',
    summary: 'getRepository(name) 基于已定义 Collection 返回 collection.repository；可用于执行后验证，但本轮不写库。',
    usableForAdapter: false,
    verified: true,
    requiresValidation: true,
  },
  {
    capability: 'collection model load',
    filePath: 'packages/plugins/@nocobase/plugin-data-source-main/src/server/models/collection.ts',
    methodName: 'CollectionModel.load(options)',
    summary: 'data-source-main 的 Collection model load 会在缺失时调用 this.db.collection(collectionOptions)。',
    usableForAdapter: true,
    verified: true,
    requiresValidation: true,
  },
  {
    capability: 'schema sync',
    filePath: 'packages/core/database/src/database.ts',
    methodName: 'Database.sync(options)',
    summary: 'Database.sync 会调用 sequelize.sync；本轮仅识别，严禁调用。',
    usableForAdapter: false,
    verified: true,
    requiresValidation: true,
  },
  {
    capability: 'migration loadCollections',
    filePath:
      'packages/plugins/@nocobase/plugin-data-source-main/src/server/migrations/20230918024546-set-collection-schema.ts',
    methodName: "app.emitAsync('loadCollections')",
    summary: '迁移示例在更新 collections 元数据后 emit loadCollections；本轮不执行 migration。',
    usableForAdapter: false,
    verified: true,
    requiresValidation: true,
  },
  {
    capability: 'collection definition example',
    filePath: 'packages/plugins/@nocobase/plugin-users/src/server/collections/users.ts',
    methodName: 'defineCollection({...})',
    summary: '插件 Collection 示例使用 defineCollection 声明 name、origin、migrationRules、fields、unique 等结构。',
    usableForAdapter: true,
    verified: true,
    requiresValidation: false,
  },
];

const FORBIDDEN_COLLECTION_NAMES = new Set([
  'booking',
  'bookings',
  'reservation',
  'reservations',
  'short_rental_order',
  'short_rental_orders',
  'driver_login',
  'driver_logins',
  'customer_portal',
  'customer_portals',
  'vehicle_category_rental',
  'vehicle_category_rentals',
]);

const REQUIRED_MINIMAL_COLLECTIONS = [
  'drivers',
  'vehicles',
  'lease_contracts',
  'rent_daily_ledgers',
  'rent_payments',
  'rent_payment_allocations',
  'deposit_records',
  'operation_logs',
];

function fileContains(rootDir: string, relativePath: string, patterns: string[]): boolean {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) return false;
  const content = fs.readFileSync(absolutePath, 'utf8');
  return patterns.every((pattern) => content.includes(pattern));
}

export function inspectCollectionApi(rootDir = process.cwd()): NocobaseCollectionApiInspectionResult {
  const resolvedRoot = path.resolve(rootDir);
  const hasDatabaseCollectionMethod = fileContains(resolvedRoot, 'packages/core/database/src/database.ts', [
    'collection<Attributes',
    'collectionFactory.createCollection',
  ]);
  const hasDefineCollectionHelper = fileContains(resolvedRoot, 'packages/core/database/src/database.ts', [
    'defineCollection',
    'collectionOptions',
  ]);
  const hasRepositoryApi = fileContains(resolvedRoot, 'packages/core/database/src/database.ts', [
    'getRepository',
    'repository',
  ]);
  const hasCollectionModelLoadApi = fileContains(
    resolvedRoot,
    'packages/plugins/@nocobase/plugin-data-source-main/src/server/models/collection.ts',
    ['async load', 'this.db.collection(collectionOptions)'],
  );
  const hasDbSync = fileContains(resolvedRoot, 'packages/core/database/src/database.ts', [
    'async sync',
    'sequelize.sync',
  ]);
  const hasMigrationApi = fileContains(
    resolvedRoot,
    'packages/plugins/@nocobase/plugin-data-source-main/src/server/migrations/20230918024546-set-collection-schema.ts',
    ['Migration', 'loadCollections'],
  );
  const hasCollectionDefinitionExamples = fileContains(
    resolvedRoot,
    'packages/plugins/@nocobase/plugin-users/src/server/collections/users.ts',
    ['defineCollection', "name: 'users'", 'fields'],
  );
  const errors: string[] = [];
  if (!hasDatabaseCollectionMethod) errors.push('未确认 Database.collection(options) 能力。');
  if (!hasDefineCollectionHelper) errors.push('未确认 defineCollection(collectionOptions) helper。');
  if (!hasCollectionDefinitionExamples) errors.push('未确认插件 Collection 定义示例。');
  return {
    rootDir: resolvedRoot,
    targetVersion: '2.0.61',
    hasDatabaseCollectionMethod,
    hasDefineCollectionHelper,
    hasRepositoryApi,
    hasCollectionModelLoadApi,
    hasDbSync,
    hasMigrationApi,
    hasCollectionDefinitionExamples,
    canPlanWithVerifiedApi: errors.length === 0,
    canDryRunWithoutDatabaseWrites: true,
    evidence: API_EVIDENCE,
    warnings: [
      '本轮仅识别 API 能力并生成 plan/dry-run 报告，不调用 Database.collection、Database.sync 或 migration。',
      'Database.import、CollectionModel.load 与 repository API 已定位，但真实执行仍需下一轮隔离环境验证。',
    ],
    errors,
  };
}

function fieldTypeForName(fieldName: string, draftType?: string): string {
  if (draftType && draftType !== 'unknown') return draftType;
  if (
    fieldName.endsWith('_at') ||
    fieldName.endsWith('_time') ||
    fieldName === 'paid_at' ||
    fieldName === 'received_at'
  ) {
    return 'date';
  }
  if (fieldName.endsWith('_date') || fieldName.includes('date')) return 'dateOnly';
  if (
    fieldName.endsWith('_amount') ||
    fieldName.endsWith('_lat') ||
    fieldName.endsWith('_lng') ||
    fieldName.endsWith('_count') ||
    fieldName.includes('rent_days')
  ) {
    return 'decimal';
  }
  if (fieldName.endsWith('_id') || fieldName.endsWith('_by')) return 'bigInt';
  if (fieldName.includes('file')) return 'belongsTo';
  if (fieldName === 'remark' || fieldName.endsWith('_reason') || fieldName.endsWith('_address')) return 'text';
  return 'string';
}

function interfaceForType(type: string): string {
  if (type === 'date' || type === 'dateOnly') return 'datetime';
  if (type === 'decimal' || type === 'bigInt' || type === 'integer') return 'number';
  if (type === 'text') return 'textarea';
  if (type === 'belongsTo') return 'm2o';
  return 'input';
}

function relationToField(relation: RealCollectionRelationSchemaDraft): Partial<NocobaseCollectionFieldSchema> {
  const targetName = relation.targetCollection.split('.')[0] || relation.targetCollection;
  const relationType = relation.relationType === 'externalPluginReference' ? 'belongsTo' : relation.relationType;
  return {
    type: relationType,
    interface: relationType === 'belongsTo' ? 'm2o' : relationType,
    target: targetName,
    foreignKey: relation.foreignKey || relation.sourceField,
    targetKey: relation.targetKey || 'id',
  };
}

export function mapRealCollectionSchemaToNocobaseSchema(
  schemaDraft: RealCollectionSchemaDraft,
): NocobaseCollectionSchemaDraft {
  const relationByField = new Map(schemaDraft.relations.map((relation) => [relation.sourceField, relation]));
  const uniqueFields = new Set(
    schemaDraft.uniqueConstraints.filter((fields) => fields.length === 1).map(([field]) => field),
  );
  const indexedFields = new Set(schemaDraft.indexes.flatMap((index) => index.fields));
  const fields = schemaDraft.fields.map((field): NocobaseCollectionFieldSchema => {
    const relation = field.relation ?? relationByField.get(field.name);
    const type = relation
      ? relation.relationType === 'externalPluginReference'
        ? 'belongsTo'
        : relation.relationType
      : fieldTypeForName(field.name, field.nocobaseFieldType);
    return {
      name: field.name,
      type,
      interface: interfaceForType(type),
      title: field.title || field.name,
      allowNull: !field.required,
      defaultValue: field.defaultValue,
      unique: field.unique || uniqueFields.has(field.name),
      index: field.index || indexedFields.has(field.name),
      ...(relation ? relationToField(relation) : {}),
      uiSchema: {
        type: type === 'decimal' || type === 'bigInt' ? 'number' : 'string',
        title: field.title || field.name,
      },
      carRental: {
        sensitive: field.sensitive || schemaDraft.sensitiveFields.includes(field.name),
        notes: field.notes,
      },
    };
  });
  return {
    name: schemaDraft.name,
    title: schemaDraft.title,
    origin: schemaDraft.sourcePlugin,
    dumpRules: { group: 'car-rental' },
    migrationRules: ['schema-only', 'overwrite'],
    fields,
    indexes: schemaDraft.indexes.map((index) => ({
      name: index.name,
      fields: [...index.fields],
      unique: index.unique,
      notes: [...index.notes, ...index.warnings],
    })),
    uniqueConstraints: schemaDraft.uniqueConstraints.map((fields) => [...fields]),
    relations: schemaDraft.relations.map((relation) => ({
      ...relation,
      notes: [...relation.notes],
      warnings: [...relation.warnings],
    })),
    sensitiveFields: [...schemaDraft.sensitiveFields],
    sourcePlugin: schemaDraft.sourcePlugin,
    notes: [...schemaDraft.nocobaseSchemaNotes, ...schemaDraft.warnings],
    metadata: {
      generatedBy: 'car-rental-real-nocobase-collection-adapter',
      planOnly: true,
      dryRunOnly: true,
    },
  };
}

function includesForbiddenText(values: unknown[], patterns: string[]): boolean {
  const joined = values
    .map((value) => (typeof value === 'string' ? value : JSON.stringify(value)))
    .join('\n')
    .toLowerCase();
  return patterns.some((pattern) => joined.includes(pattern));
}

export function validateNocobaseCollectionSchema(
  schema: NocobaseCollectionSchemaDraft,
): NocobaseCollectionSchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!schema.name) errors.push('Collection schema 缺少 name。');
  if (!schema.fields || schema.fields.length === 0)
    errors.push(`Collection ${schema.name || '(unknown)'} 缺少 fields。`);
  if (FORBIDDEN_COLLECTION_NAMES.has(schema.name)) errors.push(`禁止注册 Collection：${schema.name}。`);
  const fieldNames = schema.fields.map((field) => field.name);
  for (const constraint of schema.uniqueConstraints) {
    if (constraint.length === 0) errors.push(`Collection ${schema.name} 存在空唯一约束。`);
    for (const field of constraint) {
      if (!fieldNames.includes(field)) errors.push(`Collection ${schema.name} 唯一约束引用不存在字段：${field}。`);
    }
  }
  for (const sensitiveField of schema.sensitiveFields) {
    if (!fieldNames.includes(sensitiveField))
      errors.push(`Collection ${schema.name} 敏感字段不存在：${sensitiveField}。`);
  }
  if (
    includesForbiddenText([schema.name, schema.fields, schema.notes], ['booking', 'reservation', 'short_rental_order'])
  ) {
    errors.push(`Collection ${schema.name} 包含短租或预订相关内容。`);
  }
  if (includesForbiddenText([schema.name, schema.fields, schema.notes], ['driver_login', 'customer_portal'])) {
    errors.push(`Collection ${schema.name} 包含司机登录或客户门户相关内容。`);
  }
  if (includesForbiddenText([schema.name, schema.fields, schema.notes], ['vehicle_category_rental'])) {
    errors.push(`Collection ${schema.name} 包含按车型出租相关内容。`);
  }
  if (
    includesForbiddenText(
      [schema.notes],
      ['gps 参与租金计算', 'gps参与租金计算', 'gps rent calculation', 'gps billing'],
    )
  ) {
    errors.push(`Collection ${schema.name} 违反规则：GPS 数据不得参与租金计算。`);
  }
  if (
    includesForbiddenText(
      [schema.notes],
      ['押金计入租金收入', '押金计入租金已付', 'deposit counts as rent revenue', 'deposit counts as paid rent'],
    )
  ) {
    errors.push(`Collection ${schema.name} 违反规则：押金不得计入租金收入或租金已付。`);
  }
  if (!REQUIRED_MINIMAL_COLLECTIONS.includes(schema.name)) {
    warnings.push(`Collection ${schema.name} 不在本轮最小范围内；本轮仅 plan/dry-run，不真实注册。`);
  }
  return { valid: errors.length === 0, errors, warnings };
}

function planCollections(
  collectionPlans: RealCollectionSchemaDraft[],
  mode: RealCollectionRegistrationMode,
  apiInspection: NocobaseCollectionApiInspectionResult,
): CollectionRegistrationPlanOnlyResult {
  const collections = collectionPlans.map((collectionDraft): PlannedCollectionRegistration => {
    const schema = mapRealCollectionSchemaToNocobaseSchema(collectionDraft);
    const validation = validateNocobaseCollectionSchema(schema);
    return {
      collectionName: schema.name,
      plannedAction:
        mode === 'dry_run' ? 'dry_run_register' : mode === 'validate_only' ? 'validate_schema' : 'plan_schema',
      schema,
      validation,
      executed: false,
      writesDatabase: false,
      createsCollection: false,
      runsMigration: false,
    };
  });
  return {
    mode,
    executed: false,
    writesDatabase: false,
    createsCollection: false,
    runsMigration: false,
    apiInspection,
    collections,
    warnings: [...apiInspection.warnings, ...collections.flatMap((collection) => collection.validation.warnings)],
    errors: [...apiInspection.errors, ...collections.flatMap((collection) => collection.validation.errors)],
  };
}

export function planRegisterCollections(
  collectionPlans: RealCollectionSchemaDraft[],
  rootDir = process.cwd(),
): CollectionRegistrationPlanOnlyResult {
  return planCollections(collectionPlans, 'plan_only', inspectCollectionApi(rootDir));
}

export function dryRunRegisterCollections(
  collectionPlans: RealCollectionSchemaDraft[],
  rootDir = process.cwd(),
): CollectionRegistrationPlanOnlyResult {
  return planCollections(collectionPlans, 'dry_run', inspectCollectionApi(rootDir));
}

export function assertCanExecuteCollectionRegistration(context: CollectionExecutionContext): void {
  const reasons: string[] = [];
  if (context.mode !== 'real') reasons.push('只有 mode=real 才能进入真实执行门禁。');
  if (!context.allowRealExecution) reasons.push('必须显式设置 allowRealExecution=true。');
  if (!context.backupConfirmed) reasons.push('必须确认已完成备份。');
  if (!context.isolatedDatabase) reasons.push('必须使用隔离数据库。');
  if (!context.iopgpsDisabled) reasons.push('必须确认 IOPGPS 已禁用。');
  if (!context.mockDataOnly) reasons.push('必须限定 mock 数据，不得使用真实司机或生产数据。');
  reasons.push('当前任务未要求真实创建 Collection，本轮强制禁止真实执行。');
  throw new CollectionRegistrationExecutionBlockedError('真实 Collection 注册被安全门禁阻止。', reasons);
}

export function registerCollections(
  collectionPlans: RealCollectionSchemaDraft[],
  context: CollectionExecutionContext,
  rootDir = process.cwd(),
): CollectionRegistrationPlanOnlyResult {
  assertCanExecuteCollectionRegistration(context);
  return planCollections(collectionPlans, 'real', inspectCollectionApi(rootDir));
}

export function makeRealCollectionFieldDraft(
  fieldName: string,
  schemaDraft: {
    sensitiveFields: readonly string[];
    indexes: readonly string[];
    uniqueConstraints: readonly (readonly string[])[];
    relations: readonly { field: string; target: string; type: string }[];
  },
): RealCollectionFieldSchemaDraft {
  const relation = schemaDraft.relations.find((item) => item.field === fieldName);
  return {
    name: fieldName,
    type: fieldTypeForName(fieldName),
    title: fieldName,
    required: fieldName.endsWith('_id') || fieldName.endsWith('_no') || fieldName === 'plate_no',
    enumValues: [],
    relation: relation ? makeRelationDraft(relation, fieldName) : undefined,
    sensitive: schemaDraft.sensitiveFields.includes(fieldName),
    unique: schemaDraft.uniqueConstraints.some((fields) => fields.length === 1 && fields[0] === fieldName),
    index: schemaDraft.indexes.includes(fieldName),
    nocobaseFieldType: fieldTypeForName(fieldName),
    notes: [],
  };
}

export function makeRelationDraft(
  relation: { field: string; target: string; type: string },
  sourceField = relation.field,
): RealCollectionRelationSchemaDraft {
  const [targetCollection, targetKey = 'id'] = relation.target.split('.');
  return {
    sourceCollection: '',
    sourceField,
    targetCollection,
    relationType: relation.type as CollectionRelationType,
    foreignKey: relation.field,
    targetKey,
    notes: [],
    warnings:
      relation.type === 'externalPluginReference' ? ['目标 Collection 来自后续插件阶段，本轮只保留关系草案。'] : [],
  };
}

export function makeIndexDraft(
  collectionName: string,
  fields: readonly string[],
  unique: boolean,
): RealCollectionIndexSchemaDraft {
  return {
    name: `${collectionName}_${fields.join('_')}_${unique ? 'uniq' : 'idx'}`,
    fields: [...fields],
    unique,
    notes: [],
    warnings: [],
  };
}

export function makeRealCollectionSchemaDraftFromPluginDraft(draft: {
  name: string;
  title: string;
  fields: readonly string[];
  indexes: readonly string[];
  uniqueConstraints: readonly (readonly string[])[];
  sensitiveFields: readonly string[];
  relations: readonly { field: string; target: string; type: string }[];
  notes: readonly string[];
}): RealCollectionSchemaDraft {
  const relations = draft.relations.map((relation) => ({
    ...makeRelationDraft(relation),
    sourceCollection: draft.name,
  }));
  const indexes = [
    ...draft.indexes.map((field) => makeIndexDraft(draft.name, [field], false)),
    ...draft.uniqueConstraints.map((fields) => makeIndexDraft(draft.name, fields, true)),
  ];
  return {
    name: draft.name,
    title: draft.title,
    fields: draft.fields.map((field) => makeRealCollectionFieldDraft(field, draft)),
    indexes,
    uniqueConstraints: draft.uniqueConstraints.map((fields) => [...fields]),
    relations,
    sensitiveFields: [...draft.sensitiveFields],
    sourcePlugin: '@car-rental/plugin-rental-core',
    nocobaseSchemaNotes: [...draft.notes],
    unsupportedFeatures: [],
    warnings: [],
  };
}
