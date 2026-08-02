export interface NumericInputRules {
  maxIntegerDigits: number;
  decimalPlaces: 0 | 1 | 2;
  allowZero?: boolean;
}

export interface NumericSanitizeResult {
  accepted: boolean;
  value: string;
  reason?: 'invalid-character' | 'too-many-digits' | 'too-many-decimals';
}

/**
 * Sanitizes a candidate numeric string input according to strict formatting rules.
 * Does NOT clamp or alter values to fit clinical ranges.
 * Keeps raw string representation during editing.
 */
export function sanitizeNumericDraft(
  candidate: string,
  previousValue: string,
  rules: NumericInputRules
): NumericSanitizeResult {
  if (candidate === '') {
    return { accepted: true, value: '' };
  }

  // Pre-process paste: trim known unit suffixes like "g", "mm", "cm", "semanas", "dias"
  let cleanCandidate = candidate.trim();
  cleanCandidate = cleanCandidate.replace(/\s*(g|mm|cm|semanas|dias|s|d)$/i, '');

  const { maxIntegerDigits, decimalPlaces } = rules;

  // Rejection of invalid characters (anything other than digits, comma, dot)
  if (/[^\d,.]/.test(cleanCandidate)) {
    return {
      accepted: false,
      value: previousValue,
      reason: 'invalid-character',
    };
  }

  // Count decimal separators
  const separatorMatches = cleanCandidate.match(/[,.]/g);
  if (separatorMatches && separatorMatches.length > 1) {
    return {
      accepted: false,
      value: previousValue,
      reason: 'invalid-character',
    };
  }

  const hasSeparator = separatorMatches && separatorMatches.length === 1;

  if (hasSeparator && decimalPlaces === 0) {
    return {
      accepted: false,
      value: previousValue,
      reason: 'invalid-character',
    };
  }

  // Split integer and decimal parts
  let intPart = cleanCandidate;
  let decPart = '';

  if (hasSeparator) {
    const separatorIndex = cleanCandidate.search(/[,.]/);
    intPart = cleanCandidate.slice(0, separatorIndex);
    decPart = cleanCandidate.slice(separatorIndex + 1);
  }

  // Check integer length limit
  if (intPart.length > maxIntegerDigits) {
    return {
      accepted: false,
      value: previousValue,
      reason: 'too-many-digits',
    };
  }

  // Check decimal length limit
  if (hasSeparator && decPart.length > decimalPlaces) {
    return {
      accepted: false,
      value: previousValue,
      reason: 'too-many-decimals',
    };
  }

  return {
    accepted: true,
    value: cleanCandidate,
  };
}

/**
 * Converts a raw string draft into a JS number.
 * Returns null if the draft is empty, incomplete (e.g. "3,"), or invalid.
 */
export function parseNumericDraft(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const normalized = value.trim().replace(',', '.');
  if (normalized.endsWith('.')) {
    // Incomplete decimal like "3."
    const num = parseFloat(normalized.slice(0, -1));
    return isNaN(num) ? null : num;
  }
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

export interface ValidateNumericOptions {
  required?: boolean;
  min?: number;
  minExclusive?: number;
  max?: number;
  label: string;
  unit?: string;
}

/**
 * Validates clinical numeric range.
 * Returns a human-friendly error message string if invalid, or null if valid.
 */
export function validateNumericRange(
  value: string,
  options: ValidateNumericOptions
): string | null {
  const { required = false, min, minExclusive, max, label, unit } = options;

  if (value === '' || value === null || value === undefined) {
    if (required) {
      return `Preencha o campo ${label}.`;
    }
    return null;
  }

  const parsed = parseNumericDraft(value);
  if (parsed === null) {
    return `O valor do campo ${label} é inválido.`;
  }

  const unitSuffix = unit ? ` ${unit}` : '';

  if (min !== undefined && parsed < min) {
    if (max !== undefined) {
      return `Use um valor entre ${min} e ${max}${unitSuffix}.`;
    }
    return `Use um valor maior ou igual a ${min}${unitSuffix}.`;
  }

  if (minExclusive !== undefined && parsed <= minExclusive) {
    if (max !== undefined) {
      return `Use um valor entre ${minExclusive + 1} e ${max}${unitSuffix}.`;
    }
    return `Use um valor maior que ${minExclusive}${unitSuffix}.`;
  }

  if (max !== undefined && parsed > max) {
    if (min !== undefined) {
      return `Use um valor entre ${min} e ${max}${unitSuffix}.`;
    }
    return `Use um valor até ${max}${unitSuffix}.`;
  }

  return null;
}
