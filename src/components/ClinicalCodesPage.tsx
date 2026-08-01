import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Cid10Record,
  CidProcedureRelation,
  ClinicalCodeSearchMode,
  SigtapProcedureRecord,
} from '../types';
import { useClinicalCodesCatalog } from '../hooks/useClinicalCodesCatalog';
import { searchCids, searchProcedures } from '../services/clinicalCodesCatalog';
import ClinicalCodeSearch from './clinical-codes/ClinicalCodeSearch';
import ClinicalCodeResults from './clinical-codes/ClinicalCodeResults';
import ClinicalCodeDetails from './clinical-codes/ClinicalCodeDetails';
import ClinicalCodeDetailSheet from './clinical-codes/ClinicalCodeDetailSheet';
import ClinicalCodesSkeleton from './clinical-codes/ClinicalCodesSkeleton';
import Icon from './Icon';

export default function ClinicalCodesPage() {
  const { catalog, status, error, reload } = useClinicalCodesCatalog();

  const [mode, setMode] = useState<ClinicalCodeSearchMode>('cid');
  const [query, setQuery] = useState('');
  const [selectedCid, setSelectedCid] = useState<Cid10Record | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<SigtapProcedureRecord | null>(null);

  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global clear-form handler
  const handleClear = useCallback(() => {
    setQuery('');
    setSelectedCid(null);
    setSelectedProcedure(null);
    setMode('cid');
    setIsMobileDetailOpen(false);
  }, []);

  useEffect(() => {
    const onGlobalClear = () => {
      handleClear();
    };
    window.addEventListener('clear-form', onGlobalClear);
    return () => window.removeEventListener('clear-form', onGlobalClear);
  }, [handleClear]);

  // Mode change handler
  const handleModeChange = (newMode: ClinicalCodeSearchMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setQuery('');
      setSelectedCid(null);
      setSelectedProcedure(null);
      setIsMobileDetailOpen(false);
    }
  };

  // Perform searches
  const cidResults = useMemo(() => {
    if (!catalog) return [];
    return searchCids(catalog, query);
  }, [catalog, query]);

  const procedureResults = useMemo(() => {
    if (!catalog) return [];
    return searchProcedures(catalog, query);
  }, [catalog, query]);

  // Helper counts
  const getRelationsCountForCid = useCallback(
    (cidCode: string) => {
      if (!catalog) return 0;
      return catalog.proceduresByCid.get(cidCode)?.length || 0;
    },
    [catalog]
  );

  const getRelationsCountForProcedure = useCallback(
    (procedureCode: string) => {
      if (!catalog) return 0;
      return catalog.cidsByProcedure.get(procedureCode)?.length || 0;
    },
    [catalog]
  );

  // Related lists for details view
  const relatedProceduresForSelectedCid = useMemo(() => {
    if (!catalog || !selectedCid) return [];
    const rels = catalog.proceduresByCid.get(selectedCid.code) || [];
    return rels
      .map((rel) => {
        const proc = catalog.procedureByCode.get(rel.procedureCode);
        return proc ? { relation: rel, procedure: proc } : null;
      })
      .filter((x): x is { relation: CidProcedureRelation; procedure: SigtapProcedureRecord } => x !== null);
  }, [catalog, selectedCid]);

  const relatedCidsForSelectedProcedure = useMemo(() => {
    if (!catalog || !selectedProcedure) return [];
    const rels = catalog.cidsByProcedure.get(selectedProcedure.code) || [];
    return rels
      .map((rel) => {
        const c = catalog.cidByCode.get(rel.cidCode);
        return c ? { relation: rel, cid: c } : null;
      })
      .filter((x): x is { relation: CidProcedureRelation; cid: Cid10Record } => x !== null);
  }, [catalog, selectedProcedure]);

  // Selection handlers with blur before opening mobile sheet
  const handleSelectCid = (item: Cid10Record) => {
    if (inputRef.current) inputRef.current.blur();
    setSelectedCid(item);
    setIsMobileDetailOpen(true);
  };

  const handleSelectProcedure = (item: SigtapProcedureRecord) => {
    if (inputRef.current) inputRef.current.blur();
    setSelectedProcedure(item);
    setIsMobileDetailOpen(true);
  };

  // Bidirectional navigation handlers
  const handleNavigateToProcedure = (proc: SigtapProcedureRecord) => {
    setMode('procedure');
    setSelectedProcedure(proc);
    setIsMobileDetailOpen(true);
  };

  const handleNavigateToCid = (c: Cid10Record) => {
    setMode('cid');
    setSelectedCid(c);
    setIsMobileDetailOpen(true);
  };

  if (status === 'loading') {
    return <ClinicalCodesSkeleton />;
  }

  if (status === 'error' || !catalog) {
    return (
      <div className="glass-panel p-6 md:p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <Icon name="error" className="text-[28px]" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-on-surface text-base md:text-lg">Erro ao carregar catálogo</h3>
          <p className="text-secondary text-xs md:text-sm">
            {error || 'Não foi possível carregar a base CID-10/SIGTAP. Verifique sua conexão e tente novamente.'}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs md:text-sm hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const competenceLabel = catalog.manifest.competenceLabel || '07/2026';
  const totalResults = mode === 'cid' ? cidResults.length : procedureResults.length;

  return (
    <div className="w-full space-y-4 md:space-y-6 animate-card min-w-0">
      {/* Top Header */}
      <div className="px-1 w-full min-w-0">
        <div className="flex flex-col min-[1024px]:flex-row min-[1024px]:items-end min-[1024px]:justify-between gap-2">
          <div>
            <h1 className="text-xl md:text-2xl min-[1366px]:text-3xl font-bold text-on-surface leading-tight">
              CID-10 e SIGTAP
            </h1>
            <p className="font-body-sm text-secondary hidden md:block text-xs min-[1366px]:text-sm mt-0.5">
              Consulte diagnósticos, procedimentos e relações oficiais por competência
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-surface-variant/70 dark:bg-white/10 px-2.5 py-1 rounded-lg w-fit">
            <Icon name="event" className="text-[16px] text-primary" />
            Competência: {competenceLabel}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full">
        <ClinicalCodeSearch
          mode={mode}
          onModeChange={handleModeChange}
          query={query}
          onQueryChange={setQuery}
          onClear={() => setQuery('')}
          inputRef={inputRef}
          totalResultsCount={query.trim().length > 0 ? totalResults : undefined}
        />
      </div>

      {/* Main Grid Master-Detail Layout */}
      <div className="grid grid-cols-1 min-[1024px]:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)] min-[1366px]:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)] gap-4 min-[1024px]:gap-6 min-[1366px]:gap-8 min-w-0 items-start">
        {/* Results List Column */}
        <div className="min-w-0 w-full">
          <ClinicalCodeResults
            mode={mode}
            query={query}
            cidResults={cidResults}
            procedureResults={procedureResults}
            selectedCid={selectedCid}
            selectedProcedure={selectedProcedure}
            onSelectCid={handleSelectCid}
            onSelectProcedure={handleSelectProcedure}
            getRelationsCountForCid={getRelationsCountForCid}
            getRelationsCountForProcedure={getRelationsCountForProcedure}
            onSetExampleQuery={(q) => setQuery(q)}
          />
        </div>

        {/* Details Column (Desktop >= 1024px) */}
        <div className="hidden min-[1024px]:block min-w-0 w-full sticky top-[calc(64px+env(safe-area-inset-top))]">
          <ClinicalCodeDetails
            mode={mode}
            cid={selectedCid}
            procedure={selectedProcedure}
            relatedProcedures={relatedProceduresForSelectedCid}
            relatedCids={relatedCidsForSelectedProcedure}
            competenceLabel={competenceLabel}
            onNavigateToProcedure={handleNavigateToProcedure}
            onNavigateToCid={handleNavigateToCid}
          />
        </div>
      </div>

      {/* Mobile / Tablet Detail Sheet Overlay (< 1024px) */}
      <ClinicalCodeDetailSheet
        isOpen={isMobileDetailOpen}
        onClose={() => setIsMobileDetailOpen(false)}
        title={mode === 'cid' ? selectedCid?.displayCode || 'CID-10' : selectedProcedure?.displayCode || 'SIGTAP'}
      >
        <ClinicalCodeDetails
          mode={mode}
          cid={selectedCid}
          procedure={selectedProcedure}
          relatedProcedures={relatedProceduresForSelectedCid}
          relatedCids={relatedCidsForSelectedProcedure}
          competenceLabel={competenceLabel}
          onNavigateToProcedure={handleNavigateToProcedure}
          onNavigateToCid={handleNavigateToCid}
          onCloseMobileDetail={() => setIsMobileDetailOpen(false)}
        />
      </ClinicalCodeDetailSheet>
    </div>
  );
}
