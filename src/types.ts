export type TabType = 'usg' | 'dum' | 'peso' | 'ila' | 'codes';

export type ClinicalCodeSearchMode = 'cid' | 'procedure';

export type CidProcedureRelationType =
  | 'principal'
  | 'secondary'
  | 'unspecified';

export interface ClinicalCodesManifest {
  schemaVersion: number;
  competence: string;
  competenceLabel: string;
  generatedAt: string;
  source: string;
  basePath: string;
  counts: {
    cids: number;
    procedures: number;
    relations: number;
  };
  files: {
    cids: string;
    procedures: string;
    relations: string;
  };
}

export interface Cid10Record {
  code: string;
  displayCode: string;
  description: string;
  searchText: string;
}

export interface SigtapProcedureRecord {
  code: string;
  displayCode: string;
  name: string;
  description?: string;
  groupCode?: string;
  groupName?: string;
  subgroupCode?: string;
  subgroupName?: string;
  organizationCode?: string;
  organizationName?: string;
  searchText: string;
}

export interface CidProcedureRelation {
  cidCode: string;
  procedureCode: string;
  relationType: CidProcedureRelationType;
}

export interface ClinicalCodesCatalog {
  manifest: ClinicalCodesManifest;
  cids: Cid10Record[];
  procedures: SigtapProcedureRecord[];
  relations: CidProcedureRelation[];
  cidByCode: Map<string, Cid10Record>;
  procedureByCode: Map<string, SigtapProcedureRecord>;
  proceduresByCid: Map<string, CidProcedureRelation[]>;
  cidsByProcedure: Map<string, CidProcedureRelation[]>;
}

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
