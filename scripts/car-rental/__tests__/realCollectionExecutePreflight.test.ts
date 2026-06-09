import {
  buildRealCollectionExecutePreflightContext,
  validateRealCollectionExecutePreflight,
  type RealCollectionExecutePreflightContext,
} from '../realCollectionExecutePreflight';

const safeEnv = {
  DB_DIALECT: 'postgres',
  CAR_RENTAL_ISOLATED_DATABASE_CONFIRMED: 'true',
  CAR_RENTAL_BACKUP_PLAN_CONFIRMED: 'true',
  CAR_RENTAL_ROLLBACK_PLAN_CONFIRMED: 'true',
  CAR_RENTAL_MOCK_DATA_ONLY: 'true',
  IOPGPS_SYNC_ENABLED: 'false',
};

function makeContext(
  overrides: Partial<RealCollectionExecutePreflightContext> = {},
): RealCollectionExecutePreflightContext {
  return buildRealCollectionExecutePreflightContext({ env: safeEnv, overrides });
}

function expectBlocked(context: RealCollectionExecutePreflightContext, text: string): void {
  const result = validateRealCollectionExecutePreflight(context);
  expect(result.valid).toBe(false);
  expect(result.blockers.join('\n')).toContain(text);
}

describe('realCollectionExecutePreflight', () => {
  it('buildRealCollectionExecutePreflightContext 返回结构化结果', () => {
    const context = makeContext();
    expect(context.targetVersion).toBe('2.0.61');
    expect(context.packageManager).toBe('yarn');
    expect(context.databaseDialect).toBe('postgres');
    expect(Array.isArray(context.blockers)).toBe(true);
    expect(Array.isArray(context.nextActions)).toBe(true);
    expect(context.safety.readsEnvFile).toBe(false);
  });

  it('targetVersion 不是 2.0.61 时失败', () => {
    expectBlocked(makeContext({ targetVersion: '2.0.60' }), '当前 NocoBase 版本不是 2.0.61。');
  });

  it('packageManager 不是 yarn 时失败', () => {
    expectBlocked(makeContext({ packageManager: 'pnpm' }), '当前包管理器不是 yarn。');
  });

  it('databaseDialect 不是 postgres/postgresql 时失败', () => {
    expectBlocked(
      makeContext({ databaseDialect: 'sqlite', isPostgreSQL: false }),
      '数据库类型未明确为 postgres / postgresql。',
    );
  });

  it('未确认隔离数据库时失败', () => {
    expectBlocked(
      makeContext({ isIsolatedDatabase: false, databaseSafetyLabel: 'unconfirmed' }),
      '未明确确认当前数据库是隔离测试库。',
    );
  });

  it('生产库标识时失败', () => {
    expectBlocked(
      makeContext({ isProductionLikeDatabase: true, databaseSafetyLabel: 'production_like' }),
      '当前数据库被标识为生产或类生产库。',
    );
  });

  it('缺少 backup plan 时失败', () => {
    expectBlocked(makeContext({ hasBackupPlan: false }), '未确认数据库备份计划。');
  });

  it('缺少 rollback plan 时失败', () => {
    expectBlocked(makeContext({ hasRollbackPlan: false }), '未确认回滚计划。');
  });

  it('iopgpsRealSyncAllowed = true 时失败', () => {
    expectBlocked(makeContext({ iopgpsRealSyncAllowed: true }), 'IOPGPS 真实同步未禁用。');
  });

  it('mockDataOnly = false 时失败', () => {
    expectBlocked(makeContext({ mockDataOnly: false }), '未确认只允许 mock 数据。');
  });

  it('缺少 real collection plan 时失败', () => {
    expectBlocked(makeContext({ realCollectionPlanExists: false }), '未检测到安全的真实 Collection adapter plan。');
  });

  it('executeExplicitlyAllowed 默认 false', () => {
    const context = buildRealCollectionExecutePreflightContext({ env: {} });
    expect(context.executeExplicitlyAllowed).toBe(false);
  });

  it('本轮不允许真实执行', () => {
    const result = validateRealCollectionExecutePreflight(makeContext());
    expect(result.realExecutionAllowedThisRound).toBe(false);
  });

  it('不读取 .env 真实值', () => {
    const context = makeContext();
    expect(context.safety.readsEnvFile).toBe(false);
    expect(JSON.stringify(context)).not.toContain('.env');
  });

  it('不输出 APP_KEY', () => {
    expect(JSON.stringify(makeContext())).not.toContain('APP_KEY');
  });

  it('不输出 DB_PASSWORD', () => {
    expect(JSON.stringify(makeContext())).not.toContain('DB_PASSWORD');
  });

  it('不输出 IOPGPS_LOGIN_KEY', () => {
    expect(JSON.stringify(makeContext())).not.toContain('IOPGPS_LOGIN_KEY');
  });
});
