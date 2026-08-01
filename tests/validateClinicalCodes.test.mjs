import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateClinicalCodesCatalog } from '../scripts/validate-clinical-codes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('validateClinicalCodesCatalog', () => {
  const catalogDir = path.resolve(__dirname, '../public/data/clinical-codes');

  it('validates public clinical codes catalog successfully', () => {
    const result = validateClinicalCodesCatalog({
      dir: catalogDir,
      allowSampleData: true,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.summary.cids).toBeGreaterThan(0);
    expect(result.summary.procedures).toBeGreaterThan(0);
    expect(result.summary.relations).toBeGreaterThan(0);
    expect(result.summary.orphans).toBe(0);
  });

  it('fails when catalog directory is invalid', () => {
    const result = validateClinicalCodesCatalog({
      dir: path.resolve(__dirname, '../invalid-dir-path'),
      allowSampleData: true,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
