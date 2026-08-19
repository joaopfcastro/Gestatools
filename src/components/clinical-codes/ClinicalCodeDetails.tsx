import React, { useState } from 'react';
import {
  Cid10Record,
  CidProcedureRelation,
  ClinicalCodeSearchMode,
  SigtapProcedureRecord,
} from '../../types';
import { copyCodeToClipboard } from '../../utils/clinicalCodes';
import { hapticSuccess, hapticSelection, hapticLight } from '../../utils/haptics';
import RelationTypeBadge from './RelationTypeBadge';
import Icon from '../Icon';

interface ClinicalCodeDetailsProps {
  layout?: 'mobile' | 'desktop';
  onBack?: () => void;
  mode: ClinicalCodeSearchMode;
  cid: Cid10Record | null;
  procedure: SigtapProcedureRecord | null;
  relatedProcedures: { relation: CidProcedureRelation; procedure: SigtapProcedureRecord }[];
  relatedCids: { relation: CidProcedureRelation; cid: Cid10Record }[];
  competenceLabel: string;
  onNavigateToProcedure: (proc: SigtapProcedureRecord) => void;
  onNavigateToCid: (cid: Cid10Record) => void;
}

export default function ClinicalCodeDetails({
  layout = 'desktop',
  onBack,
  mode,
  cid,
  procedure,
  relatedProcedures,
  relatedCids,
  competenceLabel,
  onNavigateToProcedure,
  onNavigateToCid,
}: ClinicalCodeDetailsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    const success = await copyCodeToClipboard(text);
    if (success) {
      hapticSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isMobile = layout === 'mobile';

  // 1. Empty state if no active selection
  if (mode === 'cid' && !cid) {
    return (
      <div className="glass-panel p-6 rounded-[1.25rem] md:rounded-[2rem] text-center space-y-3 h-full flex flex-col items-center justify-center min-h-[280px]">
        <Icon name="touch_app" className="text-[36px] text-secondary/60" />
        <p className="text-secondary text-xs md:text-sm max-w-xs">
          Selecione um CID da lista para ver os detalhes e procedimentos relacionados.
        </p>
      </div>
    );
  }

  if (mode === 'procedure' && !procedure) {
    return (
      <div className="glass-panel p-6 rounded-[1.25rem] md:rounded-[2rem] text-center space-y-3 h-full flex flex-col items-center justify-center min-h-[280px]">
        <Icon name="touch_app" className="text-[36px] text-secondary/60" />
        <p className="text-secondary text-xs md:text-sm max-w-xs">
          Selecione um procedimento da lista para ver os detalhes e CIDs vinculados.
        </p>
      </div>
    );
  }

  // 2. Details for CID selection
  if (mode === 'cid' && cid) {
    return (
      <div className="glass-panel p-3.5 sm:p-5 md:p-6 rounded-[1.25rem] md:rounded-[2rem] space-y-4 animate-card border border-surface-variant shadow-xs md:max-h-[calc(100dvh-9.5rem)] min-[1366px]:max-h-[calc(100dvh-10.5rem)] md:overflow-y-auto overscroll-contain touch-pan-y results-scroll-panel">
        {/* Header bar */}
        {isMobile ? (
          <div className="space-y-2.5 pb-3 border-b border-surface-variant/60">
            {/* Top row: Voltar on left, Copiar on right */}
            <div className="flex items-center justify-between gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    onBack();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-xl bg-surface-variant/80 hover:bg-surface-variant text-primary text-xs font-bold transition-colors cursor-pointer active:scale-95"
                  aria-label="Voltar para a lista de resultados"
                >
                  <Icon name="arrow_back" className="text-[18px]" />
                  <span>Voltar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleCopy(cid.displayCode)}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer active:scale-95 ml-auto"
                title="Copiar código CID"
                aria-label="Copiar código CID"
              >
                <Icon name={copied ? 'check' : 'content_copy'} className="text-[16px]" />
                <span className="hidden min-[360px]:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Sub-info: Type & Competence */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20">
                CID-10
              </span>
              <span className="text-xs text-secondary font-medium">Competência {competenceLabel}</span>
            </div>

            {/* Code display on its own line */}
            <h2 className="font-mono font-bold text-xl sm:text-2xl text-primary tracking-tight leading-none pt-0.5">
              {cid.displayCode}
            </h2>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-variant/60">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20">
                  CID-10
                </span>
                <span className="text-xs text-secondary font-medium">Competência {competenceLabel}</span>
              </div>
              <h2 className="font-mono font-bold text-xl md:text-2xl text-primary tracking-tight">
                {cid.displayCode}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(cid.displayCode)}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
              title="Copiar código CID"
              aria-label="Copiar código CID"
            >
              <Icon name={copied ? 'check' : 'content_copy'} className="text-[16px]" />
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Descrição oficial</span>
          <p className="text-xs sm:text-sm font-semibold text-on-surface leading-relaxed">
            {cid.description}
          </p>
        </div>

        {/* Related SIGTAP Procedures list */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              Procedimentos SIGTAP relacionados ({relatedProcedures.length})
            </h3>
          </div>

          {relatedProcedures.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-surface-variant/30 text-xs text-secondary text-center">
              Nenhum procedimento SIGTAP relacionado a este CID na competência {competenceLabel}.
            </div>
          ) : (
            <div className={`space-y-2 ${isMobile ? '' : 'max-h-[380px] overflow-y-auto pr-1'}`}>
              {relatedProcedures.map(({ relation, procedure: proc }) => (
                <button
                  key={`${cid.code}-${proc.code}`}
                  type="button"
                  onClick={() => {
                    hapticSelection();
                    onNavigateToProcedure(proc);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-surface-variant/40 hover:bg-primary/10 border border-surface-variant/50 transition-all cursor-pointer space-y-1 group min-w-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-primary group-hover:underline flex-shrink-0">
                      {proc.displayCode}
                    </span>
                    <RelationTypeBadge type={relation.relationType} />
                  </div>
                  <p className="text-xs font-medium text-on-surface leading-snug line-clamp-2 min-w-0">
                    {proc.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informational Disclaimer */}
        <div className="p-3 rounded-xl bg-surface-variant/30 text-[11px] text-secondary leading-relaxed">
          Informações extraídas da Tabela Unificada SIGTAP/DATASUS ({competenceLabel}). A relação oficial não garante cobertura automática e deve respeitar diretrizes locais.
        </div>
      </div>
    );
  }

  // 3. Details for Procedure selection
  if (mode === 'procedure' && procedure) {
    return (
      <div className="glass-panel p-3.5 sm:p-5 md:p-6 rounded-[1.25rem] md:rounded-[2rem] space-y-4 animate-card border border-surface-variant shadow-xs md:max-h-[calc(100dvh-9.5rem)] min-[1366px]:max-h-[calc(100dvh-10.5rem)] md:overflow-y-auto overscroll-contain touch-pan-y results-scroll-panel">
        {/* Header bar */}
        {isMobile ? (
          <div className="space-y-2.5 pb-3 border-b border-surface-variant/60">
            {/* Top row: Voltar on left, Copiar on right */}
            <div className="flex items-center justify-between gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={() => {
                    hapticLight();
                    onBack();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-xl bg-surface-variant/80 hover:bg-surface-variant text-primary text-xs font-bold transition-colors cursor-pointer active:scale-95"
                  aria-label="Voltar para a lista de resultados"
                >
                  <Icon name="arrow_back" className="text-[18px]" />
                  <span>Voltar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleCopy(procedure.displayCode)}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer active:scale-95 ml-auto"
                title="Copiar código do procedimento"
                aria-label="Copiar código do procedimento"
              >
                <Icon name={copied ? 'check' : 'content_copy'} className="text-[16px]" />
                <span className="hidden min-[360px]:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Sub-info: Type & Competence */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20">
                SIGTAP
              </span>
              <span className="text-xs text-secondary font-medium">Competência {competenceLabel}</span>
            </div>

            {/* Code display on its own line */}
            <h2 className="font-mono font-bold text-xl sm:text-2xl text-primary tracking-tight leading-none pt-0.5">
              {procedure.displayCode}
            </h2>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-variant/60">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20">
                  SIGTAP
                </span>
                <span className="text-xs text-secondary font-medium">Competência {competenceLabel}</span>
              </div>
              <h2 className="font-mono font-bold text-xl md:text-2xl text-primary tracking-tight">
                {procedure.displayCode}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(procedure.displayCode)}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
              title="Copiar código do procedimento"
              aria-label="Copiar código do procedimento"
            >
              <Icon name={copied ? 'check' : 'content_copy'} className="text-[16px]" />
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        )}

        {/* Procedure Name & Description */}
        <div className="space-y-2">
          <div>
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Nome do procedimento</span>
            <p className="text-xs sm:text-sm font-bold text-on-surface leading-snug mt-0.5">
              {procedure.name}
            </p>
          </div>

          {procedure.description && (
            <div className="pt-0.5">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Descrição / Instrução</span>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                {procedure.description}
              </p>
            </div>
          )}

          {/* Group / Subgroup / Organization Info if present */}
          {(procedure.groupName || procedure.subgroupName) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {procedure.groupName && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-variant/70 text-secondary">
                  Grupo: {procedure.groupName}
                </span>
              )}
              {procedure.subgroupName && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-variant/70 text-secondary">
                  Subgrupo: {procedure.subgroupName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Related CIDs list */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              Diagnósticos CID-10 relacionados ({relatedCids.length})
            </h3>
          </div>

          {relatedCids.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-surface-variant/30 text-xs text-secondary text-center">
              Nenhum CID-10 relacionado a este procedimento na competência {competenceLabel}.
            </div>
          ) : (
            <div className={`space-y-2 ${isMobile ? '' : 'max-h-[380px] overflow-y-auto pr-1'}`}>
              {relatedCids.map(({ relation, cid: c }) => (
                <button
                  key={`${procedure.code}-${c.code}`}
                  type="button"
                  onClick={() => {
                    hapticSelection();
                    onNavigateToCid(c);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-surface-variant/40 hover:bg-primary/10 border border-surface-variant/50 transition-all cursor-pointer space-y-1 group min-w-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-primary group-hover:underline flex-shrink-0">
                      {c.displayCode}
                    </span>
                    <RelationTypeBadge type={relation.relationType} />
                  </div>
                  <p className="text-xs font-medium text-on-surface leading-snug line-clamp-2 min-w-0">
                    {c.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informational Disclaimer */}
        <div className="p-3 rounded-xl bg-surface-variant/30 text-[11px] text-secondary leading-relaxed">
          Relações oficiais da Tabela Unificada SIGTAP ({competenceLabel}). A indicação e faturamento devem seguir regramentos assistenciais e administrativos da instituição.
        </div>
      </div>
    );
  }

  return null;
}
