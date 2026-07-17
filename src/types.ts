export type TabType = 'usg' | 'dum' | 'peso' | 'ila';

export interface HistoryRecord {
  id: string;
  patientName: string;
  date: string; // ISO string
  type: 'USG' | 'DUM' | 'Peso' | 'ILA';
  summary: string;
  details: Record<string, any>;
  isFavorite?: boolean;
}

export interface AppSettings {
  defaultCycleLength: number;
  useBiometryInMm: boolean;
  theme: 'light' | 'dark' | 'system';
}
