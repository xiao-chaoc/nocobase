import * as fs from 'node:fs';
import * as path from 'node:path';
import { MINIMAL_COLLECTION_SCOPE } from './validate-real-collection-execute-request';

const DEFAULT_MODE = 'dry-run';
const REAL_QUERY_STATUS = 'pending_real_api_verification';
const DEFAULT_OUTPUT_PATH = 'test-data/generated/real-collection-post-validate.generated.json';

interface PostValidateCheck {
  id: string;
  description: string;
  status: typeof REAL_QUERY_STATUS;
}

interface PostValidatePlan {
  generated_at: string;
  mode: typeof DEFAULT_MODE;
  writesDatabase: false;
  readsEnvFile: false;
  queriesDatabase: false;
  overallStatus: typeof REAL_QUERY_STATUS;
  production_ready: false;
  checks: PostValidateCheck[];
  outputPath: string;
  note: string;
}

const REQUIRED_CHECKS: PostValidateCheck[] = [
  ...MINIMAL_COLLECTION_SCOPE.map((collection) => ({
    id: `collection_exists_${collection}`,
    description: `${collection} 是否存在`,
    status: REAL_QUERY_STATUS,
  })),
  { id: 'unique_constraints_exist', description: '唯一约束是否存在', status: REAL_QUERY_STATUS },
  { id: 'relations_exist', description: 'relation 是否存在', status: REAL_QUERY_STATUS },
  { id: 'sensitive_fields_retained', description: '敏感字段是否保留', status: REAL_QUERY_STATUS },
  { id: 'no_short_rental_collections', description: '没有短租 Collection', status: REAL_QUERY_STATUS },
  { id: 'no_driver_login', description: '没有 driver_login', status: REAL_QUERY_STATUS },
  { id: 'no_vehicle_category_rental', description: '没有 vehicle_category_rental', status: REAL_QUERY_STATUS },
  { id: 'gps_excluded_from_rent_calculation', description: 'GPS 不参与租金计算', status: REAL_QUERY_STATUS },
  { id: 'deposit_excluded_from_rent_revenue', description: '押金不计入租金收入', status: REAL_QUERY_STATUS },
];

function getArgValue(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  return args[index + 1] ?? fallback;
}

export function buildPostValidatePlan(outputPath = DEFAULT_OUTPUT_PATH): PostValidatePlan {
  return {
    generated_at: new Date().toISOString(),
    mode: DEFAULT_MODE,
    writesDatabase: false,
    readsEnvFile: false,
    queriesDatabase: false,
    overallStatus: REAL_QUERY_STATUS,
    production_ready: false,
    checks: REQUIRED_CHECKS,
    outputPath,
    note: '本轮仅生成 post-validate JSON 报告；真实只读查询 API 尚需验证，不伪造成功。',
  };
}

export function writePostValidateReport(outputPath = DEFAULT_OUTPUT_PATH): PostValidatePlan {
  const plan = buildPostValidatePlan(outputPath);
  const absoluteOutputPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return plan;
}

function main(): void {
  const outputPath = getArgValue(process.argv.slice(2), '--output', DEFAULT_OUTPUT_PATH);
  const report = writePostValidateReport(outputPath);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
}

if (require.main === module) {
  main();
}
