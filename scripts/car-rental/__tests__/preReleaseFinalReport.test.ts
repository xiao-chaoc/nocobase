const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../../..');
const read = (relativePath: string) => fs.readFileSync(path.join(rootDir, relativePath), 'utf8');

describe('pre-release final report aggregation', () => {
  it('creates and validates the final report artifacts', () => {
    expect(fs.existsSync(path.join(rootDir, 'scripts/car-rental/generate-pre-release-final-report.ts'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'scripts/car-rental/validate-pre-release-final-report.ts'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'docs/car-rental-pre-release-final-report.md'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'docs/car-rental-pre-release-remaining-modification-items.md'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'docs/car-rental-pre-release-risk-register.md'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'docs/car-rental-pre-release-go-no-go.md'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'docs/car-rental-uat-prerequisite-checklist.md'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'docs/car-rental-next-codex-task-package.md'))).toBe(true);

    const report = JSON.parse(read('test-data/generated/car-rental-pre-release-final-report.generated.json'));
    expect(report.workflow_mode).toBe('codex_only');
    expect(report.production_ready).toBe(false);
    expect(report.uat_ready).toBe(false);
    expect(report.local_pre_release_required).toBe(true);
    expect(report.mock_data_allowed_in_production).toBe(false);
    for (const stage of [
      'collection',
      'runtime',
      'permission_sensitive_field',
      'page_menu_block',
      'mock_data_import',
      'business_smoke',
      'contract_document',
      'gps_mock',
      'backup_rollback_rehearsal',
      'production_init_guard',
    ]) {
      expect(report.stage_summary[stage]).toBeTruthy();
    }
    expect(read('docs/car-rental-pre-release-go-no-go.md')).toContain('UAT: No-Go');
    expect(read('docs/car-rental-pre-release-go-no-go.md')).toContain('Production: No-Go');
    expect(read('docs/car-rental-pre-release-risk-register.md')).toContain('production_ready 被误标记');
    expect(read('docs/car-rental-next-codex-task-package.md').toLowerCase()).toContain('privacy data import guard');
    expect(read('docs/car-rental-pre-release-final-report.md')).toContain('Codex 不自动置 production_ready=true');
  });
});
