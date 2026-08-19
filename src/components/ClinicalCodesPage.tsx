import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Cid10Record,
  CidProcedureRelation,
  ClinicalCodeSearchMode,
  SigtapProcedureRecord,
} from '../types';
import { useClinicalCodesCatalog } from '../hooks/useClinicalCodesCatalog';
import { useRecentClinicalCodes } from '../hooks/useRecentClinicalCodes';
import { searchCids, searchProcedures } from '../services/clinicalCodesCatalog';
import { useShortcut } from '../hooks/useShortcut';
import ClinicalCodeSearch from './clinical-codes/ClinicalCodeSearch';
import ClinicalCodeResults from './clinical-codes/ClinicalCodeResults';
import ClinicalCodeDetails from './clinical-codes/ClinicalCodeDetails';
import ClinicalCodesSkeleton from './clinical-codes/ClinicalCodesSkeleton';
import Icon from './Icon';

type MobileCodesView = 'search' | 'detail';

export default function ClinicalCodesPage() {
  const { catalog, status, error, reload } = useClinicalCodesCatalog();
  const { recentCids, recentProcedures, recordAccess, clearHistory, isRecent } = useRecentClinicalCodes();

  const [mode, setMode] = useState<ClinicalCodeSearchMode>('cid');
  const [query, setQuery] = useState('');
  const [selectedCid, setSelectedCid] = useState<Cid10Record | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<SigtapProcedureRecord | null>(null);

  const [mobileView, setMobileView] = useState<MobileCodesView>('search');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Mobile Back button / popstate handling
  useEffect(() => {
    const handlePopState = () => {
      setMobileView('search');
      scrollToTop();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleBackToSearch = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.state?.page === 'detail') {
      window.history.back();
    } else {
      setMobileView('search');
      scrollToTop();
    }
  }, []);

  // Global clear-form handler
  const handleClear = useCallback(() => {
    setQuery('');
    setSelectedCid(null);
    setSelectedProcedure(null);
    setMode('cid');
    setMobileView('search');
    scrollToTop();

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select?.();
      }
    }, 50);
  }, []);

  useShortcut('l', handleClear);

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
      setMobileView('search');
      scrollToTop();

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select?.();
        }
      }, 50);
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

  // Selection handlers
  const handleSelectCid = (item: Cid10Record) => {
    if (inputRef.current) inputRef.current.blur();
    setSelectedCid(item);
    recordAccess('cid', item);

    if (mobileView !== 'detail') {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        window.history.pushState({ page: 'detail' }, '');
      }
      setMobileView('detail');
    }
    scrollToTop();
  };

  const handleSelectProcedure = (item: SigtapProcedureRecord) => {
    if (inputRef.current) inputRef.current.blur();
    setSelectedProcedure(item);
    recordAccess('procedure', item);

    if (mobileView !== 'detail') {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        window.history.pushState({ page: 'detail' }, '');
      }
      setMobileView('detail');
    }
    scrollToTop();
  };

  // Bidirectional navigation handlers
  const handleNavigateToProcedure = (proc: SigtapProcedureRecord) => {
    setMode('procedure');
    setSelectedProcedure(proc);
    recordAccess('procedure', proc);
    setMobileView('detail');
    scrollToTop();
  };

  const handleNavigateToCid = (c: Cid10Record) => {
    setMode('cid');
    setSelectedCid(c);
    recordAccess('cid', c);
    setMobileView('detail');
    scrollToTop();
  };

  if (status === 'loading') {
    return <ClinicalCodesSkeleton />;
  }

  if (status === 'error' || !catalog) {
    return (
      <div className="glass-panel p-6 md:p-8 rounded-[1.25rem] md:rounded-[2rem] text-center space-y-4 max-w-lg mx-auto my-8 border border-surface-variant">
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
    <div ref={topRef} className="w-full max-w-6xl min-[1366px]:max-w-7xl mx-auto flex flex-col justify-start gap-3 min-[1024px]:gap-5 p-0 sm:p-2 min-[1366px]:p-4 h-auto min-w-0 md:h-full md:min-h-0">
      {/* Top Header */}
      <div className="px-1 w-full min-w-0">
        <h1 className="text-xl md:text-2xl min-[1366px]:text-3xl font-bold text-on-surface leading-tight md:mb-1">
          CID-10 e SIGTAP
        </h1>
        <p className="font-body-sm text-secondary hidden md:block text-xs min-[1366px]:text-sm">
          Consulte diagnósticos, procedimentos e relações oficiais por competência
        </p>
      </div>

      {/* Responsive View Switch (<768px Mobile vs >=768px Desktop/Tablet) */}
      <div className="w-full min-w-0 md:flex-1 md:min-h-0">
        {/* Mobile View (< 768px) */}
        <div className="block md:hidden w-full min-w-0">
          {mobileView === 'search' ? (
            <div className="glass-panel p-3.5 sm:p-5 rounded-[1.25rem] md:rounded-[2rem] border border-surface-variant shadow-xs min-w-0 space-y-3">
              <ClinicalCodeSearch
                mode={mode}
                onModeChange={handleModeChange}
                query={query}
                onQueryChange={setQuery}
                onClear={() => setQuery('')}
                inputRef={inputRef}
                totalResultsCount={query.trim().length > 0 ? totalResults : undefined}
                competenceLabel={competenceLabel}
              />
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
                recentCids={recentCids}
                recentProcedures={recentProcedures}
                onClearRecent={clearHistory}
                isRecent={isRecent}
              />
            </div>
          ) : (
            <ClinicalCodeDetails
              layout="mobile"
              onBack={handleBackToSearch}
              mode={mode}
              cid={selectedCid}
              procedure={selectedProcedure}
              relatedProcedures={relatedProceduresForSelectedCid}
              relatedCids={relatedCidsForSelectedProcedure}
              competenceLabel={competenceLabel}
              onNavigateToProcedure={handleNavigateToProcedure}
              onNavigateToCid={handleNavigateToCid}
            />
          )}
        </div>

        {/* Desktop & Tablet Layout (>= 768px) */}
        <div className="hidden md:grid md:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)] min-[1366px]:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)] gap-4 md:gap-6 min-[1366px]:gap-8 items-start w-full min-w-0 md:h-full md:min-h-0">
          {/* Left Column: Search & Results Panel */}
          <div className="glass-panel p-4 md:p-5 min-[1024px]:p-6 rounded-[1.25rem] md:rounded-[2rem] border border-surface-variant shadow-xs min-w-0 w-full space-y-4 md:max-h-[calc(100dvh-9.5rem)] min-[1366px]:max-h-[calc(100dvh-10.5rem)] md:overflow-y-auto overscroll-contain">
            <ClinicalCodeSearch
              mode={mode}
              onModeChange={handleModeChange}
              query={query}
              onQueryChange={setQuery}
              onClear={() => setQuery('')}
              inputRef={inputRef}
              totalResultsCount={query.trim().length > 0 ? totalResults : undefined}
              competenceLabel={competenceLabel}
            />
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
              recentCids={recentCids}
              recentProcedures={recentProcedures}
              onClearRecent={clearHistory}
              isRecent={isRecent}
            />
          </div>

          {/* Right Column: Sticky Details Panel */}
          <div className="min-w-0 w-full md:sticky md:top-0 md:h-full md:min-h-0">
            <ClinicalCodeDetails
              layout="desktop"
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
      </div>
    </div>
  );
}

