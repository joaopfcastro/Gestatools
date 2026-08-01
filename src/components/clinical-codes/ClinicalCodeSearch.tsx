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
}

export default function ClinicalCodeSearch({
  mode,
  onModeChange,
  query,
  onQueryChange,
  onClear,
  inputRef,
  totalResultsCount,
}: ClinicalCodeSearchProps) {
  return (
    <div className="w-full space-y-3">
      {/* Mode Switcher Segmented Control */}
      <div className="inline-flex p-1 bg-surface-variant/70 dark:bg-white/10 rounded-xl max-w-full">
        <button
          type="button"
          onClick={() => onModeChange('cid')}
          className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
            mode === 'cid'
              ? 'bg-primary text-white shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          CID-10
        </button>
        <button
          type="button"
          onClick={() => onModeChange('procedure')}
          className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
            mode === 'procedure'
              ? 'bg-primary text-white shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Procedimentos SIGTAP
        </button>
      </div>

      {/* Input Field Container */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
          <Icon name="search" className="text-[20px] md:text-[22px]" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={
            mode === 'cid'
              ? 'Digite um CID ou diagnóstico (ex: O80, O26.8, parto)'
              : 'Digite código ou nome (ex: 03.10.01.003-9, parto normal)'
          }
          className="ios-input w-full pl-10 pr-11 py-3 text-sm md:text-base rounded-2xl placeholder:text-secondary/70 focus:outline-none"
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

      {/* Search Count & Context Notice */}
      {query.trim().length > 0 && typeof totalResultsCount === 'number' && (
        <div className="px-1 text-xs text-secondary font-medium">
          {totalResultsCount === 0
            ? 'Nenhum resultado encontrado'
            : `${totalResultsCount} ${totalResultsCount === 1 ? 'resultado encontrado' : 'resultados encontrados'}`}
        </div>
      )}
    </div>
  );
}
