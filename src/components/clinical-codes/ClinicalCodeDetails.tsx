import React, { useState } from 'react';
import {
  Cid10Record,
  CidProcedureRelation,
  ClinicalCodeSearchMode,
  SigtapProcedureRecord,
} from '../../types';
import { copyCodeToClipboard } from '../../utils/clinicalCodes';
import RelationTypeBadge from './RelationTypeBadge';
import Icon from '../Icon';

interface ClinicalCodeDetailsProps {
  mode: ClinicalCodeSearchMode;
  cid: Cid10Record | null;
  procedure: SigtapProcedureRecord | null;
  relatedProcedures: { relation: CidProcedureRelation; procedure: SigtapProcedureRecord }[];
  relatedCids: { relation: CidProcedureRelation; cid: Cid10Record }[];
  competenceLabel: string;
  onNavigateToProcedure: (proc: SigtapProcedureRecord) => void;
  onNavigateToCid: (cid: Cid10Record) => void;
  onCloseMobileDetail?: () => void;
}

export default function ClinicalCodeDetails({
  mode,
  cid,
  procedure,
  relatedProcedures,
  relatedCids,
  competenceLabel,
  onNavigateToProcedure,
  onNavigateToCid,
  onCloseMobileDetail,
}: ClinicalCodeDetailsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    const success = await copyCodeToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1. Empty state if no active selection
  if (mode === 'cid' && !cid) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center space-y-3 h-full flex flex-col items-center justify-center min-h-[300px]">
        <Icon name="touch_app" className="text-[36px] text-secondary/60" />
        <p className="text-secondary text-sm">Selecione um CID da lista ao lado para ver os detalhes e procedimentos relacionados.</p>
      </div>
    );
  }

  if (mode === 'procedure' && !procedure) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center space-y-3 h-full flex flex-col items-center justify-center min-h-[300px]">
        <Icon name="touch_app" className="text-[36px] text-secondary/60" />
        <p className="text-secondary text-sm">Selecione um procedimento da lista ao lado para ver os detalhes e CIDs vinculados.</p>
      </div>
    );
  }

  // 2. Details for CID selection
  if (mode === 'cid' && cid) {
    return (
      <div className="glass-panel p-5 md:p-6 rounded-2xl space-y-5 animate-card border border-surface-variant/70 dark:border-white/5">
        {/* Top bar header inside panel */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-variant/50 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20">
                CID-10
              </span>
              <span className="text-xs text-secondary font-medium">Competência {competenceLabel}</span>
            </div>
            <h2 className="font-mono font-bold text-xl md:text-2xl text-primary tracking-tight">
              {cid.displayCode}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(cid.displayCode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-variant/80 hover:bg-primary/15 hover:text-primary text-xs font-semibold text-on-surface transition-colors cursor-pointer"
              title="Copiar código CID"
            >
              <Icon name={copied ? 'check' : 'content_copy'} className="text-[16px]" />
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            {onCloseMobileDetail && (
              <button
                type="button"
                onClick={onCloseMobileDetail}
                className="md:hidden p-1.5 rounded-xl bg-surface-variant/80 text-secondary hover:text-on-surface cursor-pointer"
                title="Fechar"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Descrição oficial</span>
          <p className="text-sm md:text-base font-semibold text-on-surface leading-relaxed">
            {cid.description}
          </p>
        </div>

        {/* Related SIGTAP Procedures list */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Procedimentos SIGTAP relacionados ({relatedProcedures.length})
            </h3>
          </div>

          {relatedProcedures.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-variant/40 dark:bg-white/5 text-xs text-secondary text-center">
              Nenhum procedimento SIGTAP relacionado a este CID na competência {competenceLabel}.
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {relatedProcedures.map(({ relation, procedure: proc }) => (
                <button
                  key={`${cid.code}-${proc.code}`}
                  type="button"
                  onClick={() => onNavigateToProcedure(proc)}
                  className="w-full text-left p-3 rounded-xl bg-surface-variant/40 hover:bg-primary/10 dark:bg-white/5 dark:hover:bg-primary/20 border border-surface-variant/40 dark:border-white/5 transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-primary group-hover:underline">
                      {proc.displayCode}
                    </span>
                    <RelationTypeBadge type={relation.relationType} />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-on-surface leading-snug line-clamp-2">
                    {proc.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informational Disclaimer */}
        <div className="p-3 rounded-xl bg-surface-variant/30 dark:bg-white/5 text-[11px] text-secondary leading-normal">
          Informações extraídas da Tabela Unificada SIGTAP/DATASUS ({competenceLabel}). A relação oficial não garante cobertura automática e deve respeitar diretrizes locais.
        </div>
      </div>
    );
  }

  // 3. Details for Procedure selection
  if (mode === 'procedure' && procedure) {
    return (
      <div className="glass-panel p-5 md:p-6 rounded-2xl space-y-5 animate-card border border-surface-variant/70 dark:border-white/5">
        {/* Top bar header inside panel */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-variant/50 dark:border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20">
                SIGTAP
              </span>
              <span className="text-xs text-secondary font-medium">Competência {competenceLabel}</span>
            </div>
            <h2 className="font-mono font-bold text-xl md:text-2xl text-primary tracking-tight">
              {procedure.displayCode}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(procedure.displayCode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-variant/80 hover:bg-primary/15 hover:text-primary text-xs font-semibold text-on-surface transition-colors cursor-pointer"
              title="Copiar código do procedimento"
            >
              <Icon name={copied ? 'check' : 'content_copy'} className="text-[16px]" />
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            {onCloseMobileDetail && (
              <button
                type="button"
                onClick={onCloseMobileDetail}
                className="md:hidden p-1.5 rounded-xl bg-surface-variant/80 text-secondary hover:text-on-surface cursor-pointer"
                title="Fechar"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            )}
          </div>
        </div>

        {/* Procedure Name & Description */}
        <div className="space-y-2">
          <div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Nome do procedimento</span>
            <p className="text-sm md:text-base font-bold text-on-surface leading-snug mt-0.5">
              {procedure.name}
            </p>
          </div>

          {procedure.description && (
            <div className="pt-1">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Descrição / Instrução</span>
              <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed mt-0.5">
                {procedure.description}
              </p>
            </div>
          )}

          {/* Group / Subgroup / Form Info if present */}
          {(procedure.groupName || procedure.subgroupName) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {procedure.groupName && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-surface-variant/70 text-secondary">
                  Grupo: {procedure.groupName}
                </span>
              )}
              {procedure.subgroupName && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-surface-variant/70 text-secondary">
                  Subgrupo: {procedure.subgroupName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Related CIDs list */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Diagnósticos CID-10 relacionados ({relatedCids.length})
            </h3>
          </div>

          {relatedCids.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-variant/40 dark:bg-white/5 text-xs text-secondary text-center">
              Nenhum CID-10 relacionado a este procedimento na competência {competenceLabel}.
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {relatedCids.map(({ relation, cid: c }) => (
                <button
                  key={`${procedure.code}-${c.code}`}
                  type="button"
                  onClick={() => onNavigateToCid(c)}
                  className="w-full text-left p-3 rounded-xl bg-surface-variant/40 hover:bg-primary/10 dark:bg-white/5 dark:hover:bg-primary/20 border border-surface-variant/40 dark:border-white/5 transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-primary group-hover:underline">
                      {c.displayCode}
                    </span>
                    <RelationTypeBadge type={relation.relationType} />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-on-surface leading-snug line-clamp-2">
                    {c.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informational Disclaimer */}
        <div className="p-3 rounded-xl bg-surface-variant/30 dark:bg-white/5 text-[11px] text-secondary leading-normal">
          Relações oficiais da Tabela Unificada SIGTAP ({competenceLabel}). A indicação e faturamento devem seguir regramentos assistenciais e administrativos da instituição.
        </div>
      </div>
    );
  }

  return null;
}
