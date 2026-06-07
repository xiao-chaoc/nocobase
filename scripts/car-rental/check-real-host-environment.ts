import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertCanStartRealCollectionAdapter,
  detectNocobaseHostEnvironment,
  summarizeNocobaseHostEnvironment,
} from './realHostEnvironmentDetector';

function matrixToChinese(matrix: Record<string, string>): string {
  return Object.entries(matrix)
    .map(([name, state]) => `- ${name}: ${state === 'present' ? '存在' : state === 'missing' ? '缺失' : '未知'}`)
    .join('\n');
}

function main(): void {
  const result = detectNocobaseHostEnvironment();
  const reportPath = path.resolve(process.cwd(), 'test-data/generated/real-host-environment-report.generated.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify({ generated_at: new Date().toISOString(), root: process.cwd(), ...result }, null, 2)}\n`,
    'utf8',
  );

  console.log(summarizeNocobaseHostEnvironment(result));
  console.log('\n能力矩阵：');
  console.log(matrixToChinese(result.capability_matrix));
  console.log('\n阻塞项：');
  console.log(result.blockers.length > 0 ? result.blockers.map((blocker) => `- ${blocker}`).join('\n') : '- 无');
  console.log('\n下一步：');
  console.log(result.next_actions.map((action) => `- ${action}`).join('\n'));
  console.log(`\n报告文件：${reportPath}`);

  try {
    assertCanStartRealCollectionAdapter(result);
    console.log('\n结论：可以进入真实 Collection Adapter 实现。');
  } catch (error) {
    console.log(
      `\n结论：暂不能进入真实 Collection Adapter 实现。${error instanceof Error ? `\n${error.message}` : ''}`,
    );
  }
}

main();
