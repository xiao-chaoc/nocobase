import { describe, expect, it } from 'vitest';
import {
  driversCollectionDraft,
  leaseContractsCollectionDraft,
  vehiclesCollectionDraft,
} from '../../../packages/plugins/plugin-rental-core/src/server/collections';
import type { RealCollectionSchemaDraft } from '../../../packages/shared/nocobase-automation/src/types';
import {
  assertCanExecuteCollectionRegistration,
  dryRunRegisterCollections,
  inspectCollectionApi,
  makeRealCollectionSchemaDraftFromPluginDraft,
  mapRealCollectionSchemaToNocobaseSchema,
  registerCollections,
  validateNocobaseCollectionSchema,
} from '../realNocobaseCollectionAdapter';

function makeDraft(pluginDraft = driversCollectionDraft): RealCollectionSchemaDraft {
  return makeRealCollectionSchemaDraftFromPluginDraft(pluginDraft);
}

describe('realNocobaseCollectionAdapter', () => {
  it('inspectCollectionApi 返回结构化结果', () => {
    const result = inspectCollectionApi(process.cwd());
    expect(result.targetVersion).toBe('2.0.61');
    expect(result.hasDatabaseCollectionMethod).toBe(true);
    expect(result.hasDefineCollectionHelper).toBe(true);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it('mapRealCollectionSchemaToNocobaseSchema 能映射 drivers', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema(makeDraft(driversCollectionDraft));
    expect(schema.name).toBe('drivers');
    expect(schema.fields.map((field) => field.name)).toContain('driver_no');
  });

  it('mapRealCollectionSchemaToNocobaseSchema 能映射 vehicles', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema(makeDraft(vehiclesCollectionDraft));
    expect(schema.name).toBe('vehicles');
    expect(schema.fields.map((field) => field.name)).toContain('plate_no');
  });

  it('mapRealCollectionSchemaToNocobaseSchema 能映射 lease_contracts', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema(makeDraft(leaseContractsCollectionDraft));
    expect(schema.name).toBe('lease_contracts');
    expect(schema.fields.map((field) => field.name)).toContain('contract_no');
  });

  it('mapRealCollectionSchemaToNocobaseSchema 能保留字段', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema(makeDraft());
    expect(schema.fields.length).toBe(driversCollectionDraft.fields.length);
  });

  it('mapRealCollectionSchemaToNocobaseSchema 能保留 relation', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema(makeDraft());
    expect(schema.relations).toHaveLength(driversCollectionDraft.relations.length);
    expect(schema.fields.find((field) => field.name === 'current_contract_id')?.target).toBe('lease_contracts');
  });

  it('mapRealCollectionSchemaToNocobaseSchema 能保留 uniqueConstraints', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema(makeDraft());
    expect(schema.uniqueConstraints).toEqual([['driver_no']]);
  });

  it('mapRealCollectionSchemaToNocobaseSchema 能保留 sensitiveFields', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema(makeDraft());
    expect(schema.sensitiveFields).toContain('id_no');
  });

  it('validateNocobaseCollectionSchema 拒绝 booking', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema({ ...makeDraft(), name: 'booking' });
    expect(validateNocobaseCollectionSchema(schema).valid).toBe(false);
  });

  it('validateNocobaseCollectionSchema 拒绝 driver_login', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema({ ...makeDraft(), name: 'driver_login' });
    expect(validateNocobaseCollectionSchema(schema).valid).toBe(false);
  });

  it('validateNocobaseCollectionSchema 拒绝 vehicle_category_rental', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema({ ...makeDraft(), name: 'vehicle_category_rental' });
    expect(validateNocobaseCollectionSchema(schema).valid).toBe(false);
  });

  it('validateNocobaseCollectionSchema 拒绝 GPS 参与租金计算', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema({
      ...makeDraft(vehiclesCollectionDraft),
      nocobaseSchemaNotes: ['gps 参与租金计算'],
    });
    expect(validateNocobaseCollectionSchema(schema).valid).toBe(false);
  });

  it('validateNocobaseCollectionSchema 拒绝押金计入租金收入', () => {
    const schema = mapRealCollectionSchemaToNocobaseSchema({
      ...makeDraft(),
      nocobaseSchemaNotes: ['押金计入租金收入'],
    });
    expect(validateNocobaseCollectionSchema(schema).valid).toBe(false);
  });

  it('dryRunRegisterCollections 不写数据库', () => {
    const result = dryRunRegisterCollections([makeDraft()]);
    expect(result.executed).toBe(false);
    expect(result.writesDatabase).toBe(false);
  });

  it('dryRunRegisterCollections 不创建 Collection', () => {
    const result = dryRunRegisterCollections([makeDraft()]);
    expect(result.createsCollection).toBe(false);
    expect(result.collections[0].createsCollection).toBe(false);
  });

  it('registerCollections 在未允许 real execution 时失败', () => {
    expect(() => registerCollections([makeDraft()], { mode: 'real' })).toThrow('真实 Collection 注册被安全门禁阻止');
  });

  it('assertCanExecuteCollectionRegistration 默认失败', () => {
    expect(() => assertCanExecuteCollectionRegistration({ mode: 'dry_run' })).toThrow(
      '真实 Collection 注册被安全门禁阻止',
    );
  });

  it('脚本不读取 .env', () => {
    const result = dryRunRegisterCollections([makeDraft()]);
    expect(JSON.stringify(result)).not.toContain('.env');
  });

  it('脚本不输出 APP_KEY / DB_PASSWORD / IOPGPS_LOGIN_KEY', () => {
    const result = dryRunRegisterCollections([makeDraft()]);
    const output = JSON.stringify(result);
    expect(output).not.toContain('APP_KEY');
    expect(output).not.toContain('DB_PASSWORD');
    expect(output).not.toContain('IOPGPS_LOGIN_KEY');
  });

  it('脚本不连接生产库', () => {
    const result = dryRunRegisterCollections([makeDraft()]);
    expect(result.apiInspection.canDryRunWithoutDatabaseWrites).toBe(true);
    expect(result.writesDatabase).toBe(false);
  });
});
