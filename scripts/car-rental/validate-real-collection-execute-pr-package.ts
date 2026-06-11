import * as fs from 'node:fs';
import * as path from 'node:path';

const REQUIRED_FILES = [
  'docs/car-rental-real-collection-execute-pr-package.md',
  'docs/car-rental-real-collection-execute-pr-review-checklist.md',
  'docs/car-rental-real-collection-execute-rollback-drill.md',
  'scripts/car-rental/execute-real-collection-registration.ts',
  'scripts/car-rental/post-validate-real-collection-registration.ts',
  'scripts/car-rental/restore-collection-test-db.sh',
  'test-data/generated/real-collection-execute-preflight.generated.json',
];

const REQUIRED_DOCUMENT_SNIPPETS = [
  'backups-test/car-rental/pre-real-collection-register-20260610-235309.dump',
  'scripts/car-rental/restore-collection-test-db.sh',
  'NocoBase 2.0.61',
  'yarn',
  'postgresql',
  'isolated_test_database',
  'IOPGPS_SYNC_ENABLED = false',
  'mock_data_only = true',
  '不生产部署',
  '不使用生产库',
  '不提交 dump',
  '不提交 filled request',
  '不执行真实 Collection 创建',
];

interface ValidationResult {
  valid: boolean;
  blockers: string[];
  checkedFiles: string[];
  safety: {
    readsEnvFile: false;
    connectsDatabase: false;
    writesDatabase: false;
    createsCollection: false;
    runsMigration: false;
    callsIopgps: false;
  };
}

function readFile(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), 'utf8');
}

export function validateRealCollectionExecutePrPackage(): ValidationResult {
  const blockers: string[] = [];

  for (const filePath of REQUIRED_FILES) {
    if (!fs.existsSync(path.resolve(filePath))) blockers.push(`缺少必需文件：${filePath}`);
  }

  const existingRequiredFiles = REQUIRED_FILES.filter((filePath) => fs.existsSync(path.resolve(filePath)));
  const combinedDocs = [
    'docs/car-rental-real-collection-execute-pr-package.md',
    'docs/car-rental-real-collection-execute-pr-review-checklist.md',
    'docs/car-rental-real-collection-execute-rollback-drill.md',
  ]
    .filter((filePath) => fs.existsSync(path.resolve(filePath)))
    .map(readFile)
    .join('\n');

  for (const snippet of REQUIRED_DOCUMENT_SNIPPETS) {
    if (!combinedDocs.includes(snippet)) blockers.push(`文档缺少必需内容：${snippet}`);
  }

  const executeScriptPath = 'scripts/car-rental/execute-real-collection-registration.ts';
  const executeScript = fs.existsSync(path.resolve(executeScriptPath)) ? readFile(executeScriptPath) : '';
  const executeRequiredSnippets = [
    '--execute',
    '--confirm-real-collection-execute',
    'dry-run',
    'writesDatabase: false',
    'createsCollection: false',
    'runsMigration: false',
    'registerCollectionsForReal',
  ];
  for (const snippet of executeRequiredSnippets) {
    if (!executeScript.includes(snippet)) blockers.push(`execute 脚本缺少必需内容：${snippet}`);
  }
  if (executeScript.includes('writesDatabase: true') || executeScript.includes('createsCollection: true')) {
    blockers.push('execute 脚本不得默认写数据库或创建 Collection。');
  }

  const postValidatePath = 'scripts/car-rental/post-validate-real-collection-registration.ts';
  const postValidateScript = fs.existsSync(path.resolve(postValidatePath)) ? readFile(postValidatePath) : '';
  if (!postValidateScript.includes('pending_real_api_verification')) {
    blockers.push('post-validate 脚本必须标记 pending_real_api_verification。');
  }
  if (postValidateScript.includes("overallStatus: 'success'") || postValidateScript.includes("status: 'passed'")) {
    blockers.push('post-validate 脚本不得伪造成功。');
  }

  return {
    valid: blockers.length === 0,
    blockers,
    checkedFiles: existingRequiredFiles,
    safety: {
      readsEnvFile: false,
      connectsDatabase: false,
      writesDatabase: false,
      createsCollection: false,
      runsMigration: false,
      callsIopgps: false,
    },
  };
}

function main(): void {
  const result = validateRealCollectionExecutePrPackage();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) {
  main();
}
