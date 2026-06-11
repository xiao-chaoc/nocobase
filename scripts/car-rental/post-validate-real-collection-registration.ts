import * as fs from 'node:fs';
import * as path from 'node:path';
import { Database } from '@nocobase/database';
import {
  depositRecordsCollectionDraft,
  driversCollectionDraft,
  leaseContractsCollectionDraft,
  operationLogsCollectionDraft,
  rentDailyLedgersCollectionDraft,
  rentPaymentAllocationsCollectionDraft,
  rentPaymentsCollectionDraft,
  vehiclesCollectionDraft,
} from '../../packages/plugins/plugin-rental-core/src/server/collections';
import {
  makeRealCollectionSchemaDraftFromPluginDraft,
  mapRealCollectionSchemaToNocobaseSchema,
} from './realNocobaseCollectionAdapter';
import { MINIMAL_COLLECTION_SCOPE } from './validate-real-collection-execute-request';

const DEFAULT_OUTPUT_PATH = 'test-data/generated/real-collection-post-validate.generated.json';
const PENDING_STATUS = 'pending_real_api_verification';
const FORBIDDEN_COLLECTIONS = [
  'booking',
  'reservation',
  'short_rental_order',
  'driver_login',
  'customer_portal',
  'vehicle_category_rental',
] as const;

type CheckStatus = 'passed' | 'failed' | typeof PENDING_STATUS;

interface PostValidateCheck {
  id: string;
  description: string;
  status: CheckStatus;
  details?: string;
}

interface PostValidateReport {
  generated_at: string;
  mode: 'post-validate';
  writesDatabase: false;
  readsEnvFile: false;
  queriesDatabase: boolean;
  overallStatus: CheckStatus;
  production_ready: false;
  requiredCollections: readonly string[];
  forbiddenCollections: readonly string[];
  checks: PostValidateCheck[];
  outputPath: string;
  note: string;
}

function getArgValue(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  return args[index + 1] ?? fallback;
}

function requiredEnvValue(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} 未在运行环境中提供；post-validate 不读取 .env 文件。`);
  return value;
}

function createDatabase(): Database {
  const rawDialect = requiredEnvValue('DB_DIALECT');
  if (rawDialect !== 'postgres' && rawDialect !== 'postgresql')
    throw new Error('DB_DIALECT 必须是 postgres/postgresql。');
  return new Database({
    dialect: 'postgres',
    host: requiredEnvValue('DB_HOST'),
    port: Number(requiredEnvValue('DB_PORT')),
    database: requiredEnvValue('DB_DATABASE'),
    username: requiredEnvValue('DB_USER'),
    password: requiredEnvValue('DB_PASSWORD'),
    schema: process.env.DB_SCHEMA || 'public',
    logging: false,
    underscored: true,
  });
}

function defineMinimalCollections(db: Database): void {
  [
    driversCollectionDraft,
    vehiclesCollectionDraft,
    leaseContractsCollectionDraft,
    rentDailyLedgersCollectionDraft,
    rentPaymentsCollectionDraft,
    rentPaymentAllocationsCollectionDraft,
    depositRecordsCollectionDraft,
    operationLogsCollectionDraft,
  ]
    .map((draft) => mapRealCollectionSchemaToNocobaseSchema(makeRealCollectionSchemaDraftFromPluginDraft(draft)))
    .forEach((schema) => {
      db.collection({
        name: schema.name,
        title: schema.title,
        origin: schema.origin,
        autoGenId: true,
        timestamps: true,
        fields: [],
      });
    });
}

async function runRealPostValidate(outputPath: string): Promise<PostValidateReport> {
  const checks: PostValidateCheck[] = [];
  const db = createDatabase();
  try {
    await db.auth({ retry: 1 });
    await db.prepare();
    defineMinimalCollections(db);

    for (const collection of MINIMAL_COLLECTION_SCOPE) {
      const exists = await db.collectionExistsInDb(collection);
      checks.push({
        id: `collection_exists_${collection}`,
        description: `${collection} 是否存在`,
        status: exists ? 'passed' : 'failed',
      });
    }

    for (const collection of FORBIDDEN_COLLECTIONS) {
      const transient = db.collection({ name: collection, fields: [] });
      const exists = await db.collectionExistsInDb(collection);
      db.removeCollection(transient.name);
      checks.push({
        id: `collection_absent_${collection}`,
        description: `禁止项 ${collection} 不存在`,
        status: exists ? 'failed' : 'passed',
      });
    }
  } finally {
    await db.close();
  }

  const failed = checks.some((check) => check.status === 'failed');
  return {
    generated_at: new Date().toISOString(),
    mode: 'post-validate',
    writesDatabase: false,
    readsEnvFile: false,
    queriesDatabase: true,
    overallStatus: failed ? 'failed' : 'passed',
    production_ready: false,
    requiredCollections: MINIMAL_COLLECTION_SCOPE,
    forbiddenCollections: FORBIDDEN_COLLECTIONS,
    checks,
    outputPath,
    note: '通过 NocoBase Database.collectionExistsInDb 对隔离 PostgreSQL 测试库进行只读验证；不写入业务数据。',
  };
}

export function buildPendingPostValidateReport(outputPath = DEFAULT_OUTPUT_PATH, reason: string): PostValidateReport {
  return {
    generated_at: new Date().toISOString(),
    mode: 'post-validate',
    writesDatabase: false,
    readsEnvFile: false,
    queriesDatabase: false,
    overallStatus: PENDING_STATUS,
    production_ready: false,
    requiredCollections: MINIMAL_COLLECTION_SCOPE,
    forbiddenCollections: FORBIDDEN_COLLECTIONS,
    checks: [
      ...MINIMAL_COLLECTION_SCOPE.map((collection) => ({
        id: `collection_exists_${collection}`,
        description: `${collection} 是否存在`,
        status: PENDING_STATUS,
        details: reason,
      })),
      ...FORBIDDEN_COLLECTIONS.map((collection) => ({
        id: `collection_absent_${collection}`,
        description: `禁止项 ${collection} 不存在`,
        status: PENDING_STATUS,
        details: reason,
      })),
    ],
    outputPath,
    note: '无法完成真实只读查询时返回 pending_real_api_verification，不伪造成功。',
  };
}

function writeReport(outputPath: string, report: PostValidateReport): void {
  const absoluteOutputPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

export async function writePostValidateReport(outputPath = DEFAULT_OUTPUT_PATH): Promise<PostValidateReport> {
  try {
    const report = await runRealPostValidate(outputPath);
    writeReport(outputPath, report);
    return report;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const report = buildPendingPostValidateReport(outputPath, reason);
    writeReport(outputPath, report);
    return report;
  }
}

async function main(): Promise<void> {
  const outputPath = getArgValue(process.argv.slice(2), '--output', DEFAULT_OUTPUT_PATH);
  const report = await writePostValidateReport(outputPath);
  console.log(JSON.stringify(report, null, 2));
  if (report.overallStatus !== 'passed') process.exitCode = 1;
}

if (require.main === module) {
  main();
}
