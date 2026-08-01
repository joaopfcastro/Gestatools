import React, { RefObject } from 'react';
import { ClinicalCodeSearchMode } from '../../types';
import Icon from '../Icon';

interface ClinicalCodeSearchProps {
  mode: ClinicalCodeSearchMode;
  onModeChange: (mode: ClinicalCodeSearchMode) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onClear: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  totalResultsCount?: number;
  competenceLabel?: string;
}

export default function ClinicalCodeSearch({
  mode,
  onModeChange,
  query,
  onQueryChange,
  onClear,
  inputRef,
  totalResultsCount,
  competenceLabel = '07/2026',
}: ClinicalCodeSearchProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {/* Segmented Control */}
      <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-2 w-full border border-surface-variant shadow-xs bg-white dark:bg-black">
        <button
          type="button"
          onClick={() => onModeChange('cid')}
          className={`min-h-[44px] py-2 px-2 text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center text-center leading-tight whitespace-normal min-w-0 ${
            mode === 'cid'
              ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
              : 'text-secondary hover:text-on-surface'
          }`}
          aria-selected={mode === 'cid'}
        >
          CID-10
        </button>
        <button
          type="button"
          onClick={() => onModeChange('procedure')}
          className={`min-h-[44px] py-2 px-2 text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center text-center leading-tight whitespace-normal min-w-0 ${
            mode === 'procedure'
              ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
              : 'text-secondary hover:text-on-surface'
          }`}
          aria-selected={mode === 'procedure'}
        >
          Procedimentos SIGTAP
        </button>
      </div>

      {/* Competence Badge */}
      <div className="flex items-center justify-between px-0.5 pt-0.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-secondary">
          <Icon name="event" className="text-[16px] text-primary" />
          <span>Base SIGTAP • competência {competenceLabel}</span>
        </span>
      </div>

      {/* Input Field Container */}
      <div className="relative w-full mt-0.5">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
          <Icon name="search" className="text-[20px]" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={
            mode === 'cid'
              ? 'CID ou diagnóstico'
              : 'Código ou nome do procedimento'
          }
          className="ios-input w-full h-12 pl-10 pr-11 rounded-xl text-[16px] font-medium text-on-surface"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          aria-label="Campo de busca de CIDs e procedimentos"
        />
        {query && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-2 flex items-center justify-center min-w-[44px] min-h-[44px] text-secondary hover:text-on-surface active:scale-90 transition-transform cursor-pointer"
            title="Limpar pesquisa"
            aria-label="Limpar pesquisa"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        )}
      </div>

      {/* Helper text & count notice */}
      <div className="flex flex-col gap-1 px-1">
        <span className="text-[12px] text-secondary/80 font-medium">
          {mode === 'cid' ? 'Ex.: O80, O24 ou parto' : 'Ex.: 03.10.01.003-9 ou parto normal'}
        </span>

        {query.trim().length > 0 && typeof totalResultsCount === 'number' && (
          <div className="text-[12px] text-secondary font-semibold pt-0.5" aria-live="polite">
            {totalResultsCount === 0
              ? 'Nenhum resultado encontrado'
              : `${totalResultsCount} ${totalResultsCount === 1 ? 'resultado encontrado' : 'resultados encontrados'}`}
          </div>
        )}
      </div>
    </div>
  );
}
