export interface ClinicalInputLimit {
  min?: number;
  minExclusive?: number;
  max: number;
  maxIntegerDigits: number;
  decimalPlaces: 0 | 1 | 2;
  label: string;
  unit?: string;
}

export const CLINICAL_INPUT_LIMITS = {
  lmpCycle: {
    min: 20,
    max: 45,
    maxIntegerDigits: 2,
    decimalPlaces: 0,
    label: 'Duração do ciclo',
    unit: 'dias',
  },

  usgReportWeeks: {
    min: 3,
    max: 42,
    maxIntegerDigits: 2,
    decimalPlaces: 0,
    label: 'IG laudo (semanas)',
    unit: 'semanas',
  },

  percentileWeeks: {
    min: 20,
    max: 42,
    maxIntegerDigits: 2,
    decimalPlaces: 0,
    label: 'IG (semanas)',
    unit: 'semanas',
  },

  gestationalDays: {
    min: 0,
    max: 6,
    maxIntegerDigits: 1,
    decimalPlaces: 0,
    label: 'IG (dias)',
    unit: 'dias',
  },

  ccn: {
    min: 10,
    max: 84,
    maxIntegerDigits: 2,
    decimalPlaces: 1,
    label: 'CCN',
    unit: 'mm',
  },

  usgBpd: {
    minExclusive: 0,
    max: 120,
    maxIntegerDigits: 3,
    decimalPlaces: 1,
    label: 'DBP',
    unit: 'mm',
  },

  usgHc: {
    minExclusive: 0,
    max: 400,
    maxIntegerDigits: 3,
    decimalPlaces: 1,
    label: 'CC',
    unit: 'mm',
  },

  usgAc: {
    minExclusive: 0,
    max: 400,
    maxIntegerDigits: 3,
    decimalPlaces: 1,
    label: 'CA',
    unit: 'mm',
  },

  usgFl: {
    minExclusive: 0,
    max: 100,
    maxIntegerDigits: 3,
    decimalPlaces: 1,
    label: 'Fêmur',
    unit: 'mm',
  },

  fetalWeight: {
    min: 100,
    max: 6000,
    maxIntegerDigits: 4,
    decimalPlaces: 0,
    label: 'Peso fetal',
    unit: 'g',
  },

  percentileBpd: {
    min: 30,
    max: 120,
    maxIntegerDigits: 3,
    decimalPlaces: 0,
    label: 'DBP',
    unit: 'mm',
  },

  percentileHc: {
    min: 100,
    max: 400,
    maxIntegerDigits: 3,
    decimalPlaces: 0,
    label: 'CC',
    unit: 'mm',
  },

  percentileAc: {
    min: 100,
    max: 400,
    maxIntegerDigits: 3,
    decimalPlaces: 0,
    label: 'CA',
    unit: 'mm',
  },

  percentileFl: {
    min: 20,
    max: 100,
    maxIntegerDigits: 3,
    decimalPlaces: 0,
    label: 'Fêmur',
    unit: 'mm',
  },

  afiQuadrant: {
    min: 0,
    max: 20,
    maxIntegerDigits: 2,
    decimalPlaces: 1,
    label: 'Quadrante',
    unit: 'cm',
  },

  mbv: {
    min: 0,
    max: 20,
    maxIntegerDigits: 2,
    decimalPlaces: 1,
    label: 'Maior Bolso Vertical',
    unit: 'cm',
  },
} as const;
