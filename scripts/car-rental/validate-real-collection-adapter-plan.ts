import * as fs from 'node:fs';
import * as path from 'node:path';

const REQUIRED_COLLECTIONS = [
  'drivers',
  'vehicles',
  'lease_contracts',
  'rent_daily_ledgers',
  'rent_payments',
  'rent_payment_allocations',
  'deposit_records',
  'operation_logs',
];
const FORBIDDEN_TERMS = [
  'booking',
  'reservation',
  'short_rental_order',
  'driver_login',
  'customer_portal',
  'vehicle_category_rental',
  'APP_KEY',
  'DB_PASSWORD',
  'IOPGPS_LOGIN_KEY',
];

interface GeneratedCollectionSummary {
  collectionName: string;
  uniqueConstraints: string[][];
  sensitiveFields: string[];
}

interface GeneratedPlanReport {
  mode: string;
  executed: boolean;
  writesDatabase: boolean;
  createsCollection: boolean;
  runsMigration: boolean;
  collections: GeneratedCollectionSummary[];
  businessRules: Record<string, boolean>;
  safety: Record<string, boolean>;
}

function fail(errors: string[]): never {
  console.error(`real Collection Adapter 计划校验失败：\n${errors.map((error) => `- ${error}`).join('\n')}`);
  process.exit(1);
}

function main(): void {
  const reportPath = path.resolve(process.cwd(), 'test-data/generated/real-collection-adapter-plan.generated.json');
  if (!fs.existsSync(reportPath)) fail([`报告不存在：${reportPath}`]);
  const raw = fs.readFileSync(reportPath, 'utf8');
  const report = JSON.parse(raw) as GeneratedPlanReport;
  const errors: string[] = [];
  if (!['plan_only', 'dry_run'].includes(report.mode))
    errors.push(`mode 必须是 plan_only 或 dry_run，当前为 ${report.mode}。`);
  if (report.executed !== false) errors.push('executed 必须为 false。');
  if (report.writesDatabase !== false) errors.push('writesDatabase 必须为 false。');
  if (report.createsCollection !== false) errors.push('createsCollection 必须为 false。');
  if (report.runsMigration !== false) errors.push('runsMigration 必须为 false。');
  const collectionNames = new Set(report.collections.map((collection) => collection.collectionName));
  for (const collectionName of REQUIRED_COLLECTIONS) {
    if (!collectionNames.has(collectionName)) errors.push(`缺少最小范围 Collection：${collectionName}。`);
  }
  for (const collection of report.collections) {
    if (!collection.uniqueConstraints || collection.uniqueConstraints.length === 0) {
      errors.push(`${collection.collectionName} 未保留唯一约束。`);
    }
    if (!collection.sensitiveFields || collection.sensitiveFields.length === 0) {
      errors.push(`${collection.collectionName} 未保留敏感字段。`);
    }
  }
  for (const term of FORBIDDEN_TERMS) {
    if (raw.includes(term)) errors.push(`报告包含禁止内容或敏感键名：${term}。`);
  }
  if (report.businessRules.noBookingOrReservation !== true)
    errors.push('未确认禁止 booking / reservation / short_rental_order。');
  if (report.businessRules.noDriverLoginOrCustomerPortal !== true)
    errors.push('未确认禁止 driver_login / customer_portal。');
  if (report.businessRules.noVehicleCategoryRental !== true) errors.push('未确认禁止 vehicle_category_rental。');
  if (report.businessRules.gpsExcludedFromRentCalculation !== true) errors.push('未确认 GPS 不参与租金计算。');
  if (report.businessRules.depositExcludedFromRentRevenue !== true) errors.push('未确认押金不计入租金收入。');
  if (report.safety.readsEnv !== false) errors.push('脚本不得读取 .env。');
  if (report.safety.outputsSecrets !== false) errors.push('脚本不得输出真实密钥。');
  if (report.safety.connectsProductionDatabase !== false) errors.push('脚本不得连接生产库。');
  if (errors.length > 0) fail(errors);
  console.log('real Collection Adapter 计划校验通过。');
  console.log(`Collection 数量：${report.collections.length}`);
}

main();
