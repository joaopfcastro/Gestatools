import React from 'react';
import { CidProcedureRelationType } from '../../types';

interface RelationTypeBadgeProps {
  type: CidProcedureRelationType;
  className?: string;
}

export default function RelationTypeBadge({ type, className = '' }: RelationTypeBadgeProps) {
  if (type === 'principal') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary ${className}`}
      >
        CID principal
      </span>
    );
  }

  if (type === 'secondary') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-variant text-on-surface-variant dark:bg-white/10 dark:text-secondary ${className}`}
      >
        CID secundário
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-variant/80 text-secondary dark:bg-white/5 dark:text-secondary ${className}`}
    >
      Relação SIGTAP
    </span>
  );
}
