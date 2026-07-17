import React, { useState } from 'react';
import Icon from './Icon';
import { motion, AnimatePresence } from 'motion/react';

interface GestationalMilestonesProps {
  dumDate: Date;
  currentDays: number;
}

export default function GestationalMilestones({ dumDate, currentDays }: GestationalMilestonesProps) {
  const [expanded, setExpanded] = useState(false);

  const addWeeks = (weeks: number) => {
    return new Date(dumDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
  };
  
  const addDays = (days: number) => {
    return new Date(dumDate.getTime() + days * 24 * 60 * 60 * 1000);
  };

  const formatDateStr = (d: Date) => {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const currentWeeks = Math.floor(currentDays / 7);

  const milestones = [
    { label: 'Morfológico 1º Tri (11s - 13s6d)', date: `${formatDateStr(addWeeks(11))} a ${formatDateStr(addDays(13*7 + 6))}`, weekMin: 11, weekMax: 13 },
    { label: 'Morfológico 2º Tri (20s - 24s)', date: `${formatDateStr(addWeeks(20))} a ${formatDateStr(addWeeks(24))}`, weekMin: 20, weekMax: 24 },
    { label: 'Viabilidade Fetal (24s)', date: formatDateStr(addWeeks(24)), weekMin: 24, weekMax: 24 },
    { label: 'Início 3º Trimestre (28s)', date: formatDateStr(addWeeks(28)), weekMin: 28, weekMax: 28 },
    { label: 'USG 3º Trimestre (32s - 34s)', date: `${formatDateStr(addWeeks(32))} a ${formatDateStr(addWeeks(34))}`, weekMin: 32, weekMax: 34 },
    { label: 'Feto a Termo (37s)', date: formatDateStr(addWeeks(37)), weekMin: 37, weekMax: 37 },
    { label: 'DPP (40s)', date: formatDateStr(addWeeks(40)), weekMin: 40, weekMax: 40 },
  ];

  // Map gestational age in weeks to obstetric months
  let month = 0;
  if (currentWeeks <= 4) month = 1;
  else if (currentWeeks <= 8) month = 2;
  else if (currentWeeks <= 13) month = 3;
  else if (currentWeeks <= 17) month = 4;
  else if (currentWeeks <= 22) month = 5;
  else if (currentWeeks <= 27) month = 6;
  else if (currentWeeks <= 31) month = 7;
  else if (currentWeeks <= 35) month = 8;
  else month = 9;

  return (
    <div className="flex flex-col gap-2 bg-surface-variant/20 rounded-xl overflow-hidden border border-surface-variant/50 mt-2 text-left">
      <button 
        type="button" 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-surface-variant/30 transition-colors"
      >
        <div className="flex flex-col gap-1 pr-2">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">Marcos Gestacionais</span>
          <span className="text-sm font-semibold text-on-surface">
            {month}º Mês de Gestação
          </span>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <span className="hidden sm:inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
            Ver datas importantes
          </span>
          <span className="sm:hidden text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-1 rounded-md">
            Ver datas
          </span>
          <Icon name={expanded ? 'expand_less' : 'expand_more'} className="text-secondary text-[20px] md:text-[24px]" />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 flex flex-col gap-3">
              {milestones.map((m, idx) => {
                const isPast = currentWeeks > m.weekMax;
                const isCurrent = currentWeeks >= m.weekMin && currentWeeks <= m.weekMax;
                
                return (
                  <div 
                    key={idx} 
                    className={`flex justify-between items-center text-xs md:text-sm border-t border-surface-variant/40 pt-2 first:border-0 first:pt-0 ${isPast ? 'opacity-50' : ''} ${isCurrent ? 'font-semibold text-primary' : ''}`}
                  >
                    <span className={`${isCurrent ? 'text-primary' : 'text-secondary'}`}>
                      {m.label}
                      {isCurrent && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-primary" />}
                    </span>
                    <span className={`${isCurrent ? 'text-primary' : 'text-on-surface'} font-medium`}>{m.date}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
