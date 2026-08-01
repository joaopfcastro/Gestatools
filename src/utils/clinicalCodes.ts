import { Cid10Record, SigtapProcedureRecord } from '../types';

/**
 * Normalizes text for search (uppercase, removes accents and special characters, collapses spaces).
 */
export function normalizeClinicalText(value: string): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes CID-10 code for searching/comparison (e.g., "o26.8" -> "O268").
 */
export function normalizeCidCode(value: string): string {
  if (!value) return '';
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Normalizes SIGTAP procedure code to digits only (e.g., "03.10.01.003-9" -> "0310010039").
 */
export function normalizeProcedureCode(value: string): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Formats a 10-digit SIGTAP procedure code to "03.10.01.003-9".
 */
export function formatSigtapCode(code: string): string {
  const digits = normalizeProcedureCode(code);
  if (digits.length !== 10) {
    return code;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Formats CID-10 code with standard dot notation if subcategory exists (e.g. "O268" -> "O26.8").
 */
export function formatCidCode(code: string): string {
  if (!code) return '';
  const clean = normalizeCidCode(code);
  if (clean.length > 3 && !code.includes('.')) {
    return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  }
  return code.toUpperCase();
}

/**
 * Ranks CID-10 search results deterministically.
 */
export function rankCidResult(
  record: Cid10Record,
  query: string,
  normQuery: string,
  normCodeQuery: string
): number {
  const normCode = normalizeCidCode(record.code);
  const normDesc = normalizeClinicalText(record.description);

  if (!normQuery) return 0;

  // Exact code match
  if (normCodeQuery && normCode === normCodeQuery) return 1000;

  // Code prefix match
  if (normCodeQuery && normCode.startsWith(normCodeQuery)) return 900;

  // Description starts with query
  if (normDesc.startsWith(normQuery)) return 800;

  // Description contains all query tokens
  const queryTokens = normQuery.split(' ').filter(Boolean);
  const allTokensMatch = queryTokens.length > 1 && queryTokens.every((token) => normDesc.includes(token));
  if (allTokensMatch) return 700;

  // Description contains full query
  if (normDesc.includes(normQuery)) return 500;

  // Description contains any query token
  const anyTokenMatch = queryTokens.some((token) => token.length >= 2 && normDesc.includes(token));
  if (anyTokenMatch) return 300;

  return 0;
}

/**
 * Ranks SIGTAP procedure search results deterministically.
 */
export function rankProcedureResult(
  record: SigtapProcedureRecord,
  query: string,
  normQuery: string,
  normDigitsQuery: string
): number {
  const normCode = normalizeProcedureCode(record.code);
  const normName = normalizeClinicalText(record.name);
  const normDesc = record.description ? normalizeClinicalText(record.description) : '';

  if (!normQuery) return 0;

  // Exact 10-digit code match
  if (normDigitsQuery && normCode === normDigitsQuery) return 1000;

  // Code prefix match
  if (normDigitsQuery && normCode.startsWith(normDigitsQuery)) return 900;

  // Name starts with query
  if (normName.startsWith(normQuery)) return 800;

  // Name contains all query tokens
  const queryTokens = normQuery.split(' ').filter(Boolean);
  const allTokensMatch = queryTokens.length > 1 && queryTokens.every((token) => normName.includes(token));
  if (allTokensMatch) return 700;

  // Name contains full query
  if (normName.includes(normQuery)) return 500;

  // Description contains full query
  if (normDesc && normDesc.includes(normQuery)) return 350;

  // Name contains any query token
  const anyTokenMatch = queryTokens.some((token) => token.length >= 2 && normName.includes(token));
  if (anyTokenMatch) return 300;

  return 0;
}

/**
 * Copies text to clipboard safely.
 */
export async function copyCodeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error('Failed to copy code to clipboard', err);
    return false;
  }
}
