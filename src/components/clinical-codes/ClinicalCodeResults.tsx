import React, { useState, useEffect } from 'react';
import { Cid10Record, ClinicalCodeSearchMode, SigtapProcedureRecord } from '../../types';
import Icon from '../Icon';

interface ClinicalCodeResultsProps {
  mode: ClinicalCodeSearchMode;
  query: string;
  cidResults: Cid10Record[];
  procedureResults: SigtapProcedureRecord[];
  selectedCid: Cid10Record | null;
  selectedProcedure: SigtapProcedureRecord | null;
  onSelectCid: (item: Cid10Record) => void;
  onSelectProcedure: (item: SigtapProcedureRecord) => void;
  getRelationsCountForCid: (code: string) => number;
  getRelationsCountForProcedure: (code: string) => number;
  onSetExampleQuery?: (q: string) => void;
}

const getInitialPageSize = () => {
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
    return 60;
  }
  return 30;
};

export default function ClinicalCodeResults({
  mode,
  query,
  cidResults,
  procedureResults,
  selectedCid,
  selectedProcedure,
  onSelectCid,
  onSelectProcedure,
  getRelationsCountForCid,
  getRelationsCountForProcedure,
  onSetExampleQuery,
}: ClinicalCodeResultsProps) {
  const [visibleCount, setVisibleCount] = useState(getInitialPageSize);

  useEffect(() => {
    setVisibleCount(getInitialPageSize());
  }, [mode, query]);

  const trimmedQuery = query.trim();

  // 1. Empty query state - Show compact instructions and examples
  if (!trimmedQuery) {
    const cidExamples = ['O80', 'O24', 'O14.1', 'PARTO', 'PRÉ-ECLÂMPSIA'];
    const procExamples = ['03.10.01.003-9', '04.11.01.003-4', '02.05.02.014-3', 'PARTO NORMAL', 'ULTRASSONOGRAFIA'];

    const activeExamples = mode === 'cid' ? cidExamples : procExamples;

    return (
      <div className="pt-2 pb-1 space-y-3">
        <div className="flex items-center gap-2.5 px-1 text-on-surface">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Icon name={mode === 'cid' ? 'medical_information' : 'clinical_notes'} className="text-[20px]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs md:text-sm text-on-surface leading-tight">
              {mode === 'cid' ? 'Pesquisar diagnósticos CID-10' : 'Pesquisar procedimentos SIGTAP'}
            </h3>
            <p className="text-secondary text-[11px] leading-tight">
              Pesquise pelo código ou pela descrição oficial.
            </p>
          </div>
        </div>

        {onSetExampleQuery && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-secondary block pl-1 uppercase tracking-wider">Exemplos de busca:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeExamples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => onSetExampleQuery(ex)}
                  className="min-h-[40px] px-3 rounded-xl bg-surface-variant/70 hover:bg-primary/15 hover:text-primary dark:bg-white/10 dark:hover:bg-primary/25 text-xs font-semibold text-on-surface transition-all cursor-pointer border border-surface-variant/50 flex items-center justify-center active:scale-95"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. CID mode results
  if (mode === 'cid') {
    if (cidResults.length === 0) {
      return (
        <div className="p-5 rounded-xl bg-surface-variant/30 text-center space-y-1.5 my-2">
          <Icon name="search_off" className="text-[28px] text-secondary mx-auto" />
          <h4 className="font-bold text-on-surface text-xs md:text-sm">Nenhum CID encontrado</h4>
          <p className="text-secondary text-[11px] max-w-xs mx-auto">
            Verifique a escrita, tente menos palavras ou pesquise pelo código sem pontuação.
          </p>
        </div>
      );
    }

    const items = cidResults.slice(0, visibleCount);

    return (
      <div className="space-y-2 pt-1">
        <ul className="space-y-2" aria-label="Resultados de CID-10">
          {items.map((item) => {
            const isSelected = selectedCid?.code === item.code;
            const relCount = getRelationsCountForCid(item.code);

            return (
              <li key={item.code}>
                <button
                  type="button"
                  onClick={() => onSelectCid(item)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border flex items-center justify-between gap-3 min-h-[64px] min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? 'bg-primary/10 border-primary/40 shadow-xs'
                      : 'bg-surface-variant/35 hover:bg-surface-variant/60 border-surface-variant/60 dark:border-white/5'
                  }`}
                  aria-selected={isSelected}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs md:text-sm px-2 py-0.5 rounded-md bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0">
                        {item.displayCode}
                      </span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-surface-variant text-secondary flex-shrink-0">
                        CID-10
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-medium leading-snug line-clamp-3 text-on-surface min-w-0">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-surface-variant/80 text-secondary">
                      {relCount} {relCount === 1 ? 'proc.' : 'procs.'}
                    </span>
                    <Icon name="chevron_right" className="text-[18px] text-secondary" />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {visibleCount < cidResults.length && (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 30)}
            className="w-full py-2.5 min-h-[44px] rounded-xl text-xs md:text-sm font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer border border-primary/20 flex items-center justify-center mt-2"
          >
            Mostrar mais ({cidResults.length - visibleCount} restantes)
          </button>
        )}
      </div>
    );
  }

  // 3. Procedure mode results
  if (procedureResults.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-surface-variant/30 text-center space-y-1.5 my-2">
        <Icon name="search_off" className="text-[28px] text-secondary mx-auto" />
        <h4 className="font-bold text-on-surface text-xs md:text-sm">Nenhum procedimento encontrado</h4>
        <p className="text-secondary text-[11px] max-w-xs mx-auto">
          Verifique se o código possui 10 dígitos ou tente buscar por termos gerais como "parto" ou "ultrassonografia".
        </p>
      </div>
    );
  }

  const items = procedureResults.slice(0, visibleCount);

  return (
    <div className="space-y-2 pt-1">
      <ul className="space-y-2" aria-label="Resultados de procedimentos SIGTAP">
        {items.map((item) => {
          const isSelected = selectedProcedure?.code === item.code;
          const relCount = getRelationsCountForProcedure(item.code);

          return (
            <li key={item.code}>
              <button
                type="button"
                onClick={() => onSelectProcedure(item)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border flex items-center justify-between gap-3 min-h-[64px] min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary/10 border-primary/40 shadow-xs'
                    : 'bg-surface-variant/35 hover:bg-surface-variant/60 border-surface-variant/60 dark:border-white/5'
                }`}
                aria-selected={isSelected}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs md:text-sm px-2 py-0.5 rounded-md bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0">
                      {item.displayCode}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-surface-variant text-secondary flex-shrink-0">
                      SIGTAP
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-semibold leading-snug line-clamp-3 text-on-surface min-w-0">
                    {item.name}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-surface-variant/80 text-secondary">
                    {relCount} {relCount === 1 ? 'CID' : 'CIDs'}
                  </span>
                  <Icon name="chevron_right" className="text-[18px] text-secondary" />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {visibleCount < procedureResults.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => prev + 30)}
          className="w-full py-2.5 min-h-[44px] rounded-xl text-xs md:text-sm font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer border border-primary/20 flex items-center justify-center mt-2"
        >
          Mostrar mais ({procedureResults.length - visibleCount} restantes)
        </button>
      )}
    </div>
  );
}
