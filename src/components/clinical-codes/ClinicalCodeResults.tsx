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

const PAGE_SIZE = 60;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [mode, query]);

  const trimmedQuery = query.trim();

  // 1. Empty query state - Show examples
  if (!trimmedQuery) {
    const cidExamples = ['O80', 'O26.8', 'O14.1', 'PARTO', 'PRÉ-ECLÂMPSIA'];
    const procExamples = ['03.10.01.003-9', '04.11.01.003-4', '02.05.02.014-3', 'PARTO NORMAL', 'ULTRASSONOGRAFIA'];

    const activeExamples = mode === 'cid' ? cidExamples : procExamples;

    return (
      <div className="glass-panel p-5 md:p-6 rounded-2xl text-center space-y-4 my-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Icon name={mode === 'cid' ? 'medical_information' : 'clinical_notes'} className="text-[26px]" />
        </div>
        <div>
          <h3 className="font-bold text-on-surface text-base md:text-lg">
            {mode === 'cid' ? 'Pesquisar diagnósticos CID-10' : 'Pesquisar procedimentos SIGTAP'}
          </h3>
          <p className="text-secondary text-xs md:text-sm mt-1 max-w-md mx-auto">
            {mode === 'cid'
              ? 'Digite o código da doença (com ou sem ponto) ou o diagnóstico desejado.'
              : 'Digite os 10 dígitos do código do procedimento ou o nome oficial.'}
          </p>
        </div>

        {onSetExampleQuery && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-secondary block mb-2">Exemplos de busca:</span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {activeExamples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => onSetExampleQuery(ex)}
                  className="px-2.5 py-1 rounded-lg bg-surface-variant/80 hover:bg-primary/15 hover:text-primary dark:bg-white/10 dark:hover:bg-primary/25 text-xs font-medium text-on-surface transition-all cursor-pointer"
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
        <div className="glass-panel p-6 rounded-2xl text-center space-y-2">
          <Icon name="search_off" className="text-[32px] text-secondary mx-auto" />
          <h4 className="font-bold text-on-surface text-base">Nenhum CID encontrado</h4>
          <p className="text-secondary text-xs md:text-sm">
            Verifique a escrita, tente menos palavras ou pesquise pelo código sem pontuação.
          </p>
        </div>
      );
    }

    const items = cidResults.slice(0, visibleCount);

    return (
      <div className="space-y-2">
        <ul className="space-y-2 role-list" aria-label="Resultados de CID-10">
          {items.map((item) => {
            const isSelected = selectedCid?.code === item.code;
            const relCount = getRelationsCountForCid(item.code);

            return (
              <li key={item.code}>
                <button
                  type="button"
                  onClick={() => onSelectCid(item)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'glass-panel hover:bg-surface-variant/70 border-surface-variant/60 dark:border-white/5'
                  }`}
                  aria-selected={isSelected}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold text-xs md:text-sm px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary dark:bg-primary/20'
                      }`}>
                        {item.displayCode}
                      </span>
                      <span className={`text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/10 text-white/90' : 'bg-surface-variant text-secondary'
                      }`}>
                        CID-10
                      </span>
                    </div>
                    <p className={`text-xs md:text-sm font-medium leading-snug line-clamp-2 ${
                      isSelected ? 'text-white' : 'text-on-surface'
                    }`}>
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 self-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-surface-variant/80 text-secondary'
                    }`}>
                      {relCount} {relCount === 1 ? 'proc.' : 'procs.'}
                    </span>
                    <Icon name="chevron_right" className={`text-[18px] ${isSelected ? 'text-white' : 'text-secondary'}`} />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {visibleCount < cidResults.length && (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="w-full py-2.5 rounded-xl text-xs md:text-sm font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
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
      <div className="glass-panel p-6 rounded-2xl text-center space-y-2">
        <Icon name="search_off" className="text-[32px] text-secondary mx-auto" />
        <h4 className="font-bold text-on-surface text-base">Nenhum procedimento encontrado</h4>
        <p className="text-secondary text-xs md:text-sm">
          Verifique se o código possui 10 dígitos ou tente buscar por termos gerais como "parto" ou "ultrassonografia".
        </p>
      </div>
    );
  }

  const items = procedureResults.slice(0, visibleCount);

  return (
    <div className="space-y-2">
      <ul className="space-y-2" aria-label="Resultados de procedimentos SIGTAP">
        {items.map((item) => {
          const isSelected = selectedProcedure?.code === item.code;
          const relCount = getRelationsCountForProcedure(item.code);

          return (
            <li key={item.code}>
              <button
                type="button"
                onClick={() => onSelectProcedure(item)}
                className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer border flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'glass-panel hover:bg-surface-variant/70 border-surface-variant/60 dark:border-white/5'
                }`}
                aria-selected={isSelected}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-xs md:text-sm px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary dark:bg-primary/20'
                    }`}>
                      {item.displayCode}
                    </span>
                    <span className={`text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/10 text-white/90' : 'bg-surface-variant text-secondary'
                    }`}>
                      SIGTAP
                    </span>
                  </div>
                  <p className={`text-xs md:text-sm font-semibold leading-snug line-clamp-2 ${
                    isSelected ? 'text-white' : 'text-on-surface'
                  }`}>
                    {item.name}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 self-center">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-surface-variant/80 text-secondary'
                  }`}>
                    {relCount} {relCount === 1 ? 'CID' : 'CIDs'}
                  </span>
                  <Icon name="chevron_right" className={`text-[18px] ${isSelected ? 'text-white' : 'text-secondary'}`} />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {visibleCount < procedureResults.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          className="w-full py-2.5 rounded-xl text-xs md:text-sm font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
          Mostrar mais ({procedureResults.length - visibleCount} restantes)
        </button>
      )}
    </div>
  );
}
