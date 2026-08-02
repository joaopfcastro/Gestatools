import { describe, it, expect } from 'vitest';
import {
  sanitizeNumericDraft,
  parseNumericDraft,
  validateNumericRange,
} from '../src/utils/numericInput';

describe('sanitizeNumericDraft', () => {
  it('allows empty string', () => {
    const res = sanitizeNumericDraft('', '12', { maxIntegerDigits: 2, decimalPlaces: 0 });
    expect(res).toEqual({ accepted: true, value: '' });
  });

  it('allows digits within maxIntegerDigits', () => {
    const res = sanitizeNumericDraft('28', '', { maxIntegerDigits: 2, decimalPlaces: 0 });
    expect(res).toEqual({ accepted: true, value: '28' });
  });

  it('rejects candidate if integer digits exceed maxIntegerDigits (weeks: max 2 digits)', () => {
    const res = sanitizeNumericDraft('800000000', '28', { maxIntegerDigits: 2, decimalPlaces: 0 });
    expect(res.accepted).toBe(false);
    expect(res.value).toBe('28');
    expect(res.reason).toBe('too-many-digits');
  });

  it('rejects candidate if days exceed maxIntegerDigits (days: max 1 digit)', () => {
    const res = sanitizeNumericDraft('12', '0', { maxIntegerDigits: 1, decimalPlaces: 0 });
    expect(res.accepted).toBe(false);
    expect(res.value).toBe('0');
    expect(res.reason).toBe('too-many-digits');
  });

  it('rejects candidate if weight exceeds maxIntegerDigits (weight: max 4 digits)', () => {
    const res = sanitizeNumericDraft('60010', '1200', { maxIntegerDigits: 4, decimalPlaces: 0 });
    expect(res.accepted).toBe(false);
    expect(res.value).toBe('1200');
    expect(res.reason).toBe('too-many-digits');
  });

  it('allows 4 digits for weight like 6001', () => {
    const res = sanitizeNumericDraft('6001', '', { maxIntegerDigits: 4, decimalPlaces: 0 });
    expect(res.accepted).toBe(true);
    expect(res.value).toBe('6001');
  });

  it('handles decimal input with comma or dot', () => {
    const resComma = sanitizeNumericDraft('3,5', '', { maxIntegerDigits: 2, decimalPlaces: 1 });
    expect(resComma).toEqual({ accepted: true, value: '3,5' });

    const resDot = sanitizeNumericDraft('3.5', '', { maxIntegerDigits: 2, decimalPlaces: 1 });
    expect(resDot).toEqual({ accepted: true, value: '3.5' });
  });

  it('allows intermediate decimal state like "3," or "3."', () => {
    const res = sanitizeNumericDraft('3,', '', { maxIntegerDigits: 2, decimalPlaces: 1 });
    expect(res).toEqual({ accepted: true, value: '3,' });
  });

  it('rejects second decimal separator', () => {
    const res = sanitizeNumericDraft('3,,5', '3,', { maxIntegerDigits: 2, decimalPlaces: 1 });
    expect(res.accepted).toBe(false);
    expect(res.value).toBe('3,');
  });

  it('rejects second decimal place if limit is 1 decimal place', () => {
    const res = sanitizeNumericDraft('3,55', '3,5', { maxIntegerDigits: 2, decimalPlaces: 1 });
    expect(res.accepted).toBe(false);
    expect(res.value).toBe('3,5');
    expect(res.reason).toBe('too-many-decimals');
  });

  it('cleans trailing units on paste like "1200 g" or "54 mm"', () => {
    const resWeight = sanitizeNumericDraft('1200 g', '', { maxIntegerDigits: 4, decimalPlaces: 0 });
    expect(resWeight).toEqual({ accepted: true, value: '1200' });

    const resFl = sanitizeNumericDraft('54 mm', '', { maxIntegerDigits: 3, decimalPlaces: 1 });
    expect(resFl).toEqual({ accepted: true, value: '54' });
  });

  it('rejects scientific notation or sign characters', () => {
    const resE = sanitizeNumericDraft('1e5', '', { maxIntegerDigits: 4, decimalPlaces: 0 });
    expect(resE.accepted).toBe(false);

    const resSign = sanitizeNumericDraft('-12', '', { maxIntegerDigits: 2, decimalPlaces: 0 });
    expect(resSign.accepted).toBe(false);
  });
});

describe('parseNumericDraft', () => {
  it('parses integers and decimals with comma or dot', () => {
    expect(parseNumericDraft('28')).toBe(28);
    expect(parseNumericDraft('3,5')).toBe(3.5);
    expect(parseNumericDraft('3.5')).toBe(3.5);
  });

  it('handles incomplete trailing separator', () => {
    expect(parseNumericDraft('3,')).toBe(3);
    expect(parseNumericDraft('3.')).toBe(3);
  });

  it('returns null for empty or invalid strings', () => {
    expect(parseNumericDraft('')).toBe(null);
    expect(parseNumericDraft('   ')).toBe(null);
  });
});

describe('validateNumericRange', () => {
  it('validates weeks range 3..42 without changing 43 to 42', () => {
    const err = validateNumericRange('43', {
      required: true,
      min: 3,
      max: 42,
      label: 'IG (semanas)',
      unit: 'semanas',
    });
    expect(err).toBe('Use um valor entre 3 e 42 semanas.');
  });

  it('validates days range 0..6', () => {
    const errValid = validateNumericRange('6', {
      required: true,
      min: 0,
      max: 6,
      label: 'IG (dias)',
      unit: 'dias',
    });
    expect(errValid).toBe(null);

    const errInvalid = validateNumericRange('9', {
      required: true,
      min: 0,
      max: 6,
      label: 'IG (dias)',
      unit: 'dias',
    });
    expect(errInvalid).toBe('Use um valor entre 0 e 6 dias.');
  });

  it('validates weight range 100..6000 g', () => {
    expect(
      validateNumericRange('1200', {
        required: true,
        min: 100,
        max: 6000,
        label: 'Peso fetal',
        unit: 'g',
      })
    ).toBe(null);

    expect(
      validateNumericRange('6001', {
        required: true,
        min: 100,
        max: 6000,
        label: 'Peso fetal',
        unit: 'g',
      })
    ).toBe('Use um valor entre 100 e 6000 g.');
  });

  it('validates CCN range 10..84 mm', () => {
    expect(
      validateNumericRange('85', {
        required: true,
        min: 10,
        max: 84,
        label: 'CCN',
        unit: 'mm',
      })
    ).toBe('Use um valor entre 10 e 84 mm.');
  });
});
