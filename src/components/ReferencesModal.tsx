import React from 'react';
import HelpModal from './HelpModal';
import Icon from './Icon';

interface ReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferencesModal({ isOpen, onClose }: ReferencesModalProps) {
  return (
    <HelpModal isOpen={isOpen} onClose={onClose} title="Referências Bibliográficas">
      <div className="flex flex-col gap-4 text-xs md:text-sm text-secondary leading-relaxed">
        <p className="text-on-surface font-medium mb-1">
          As metodologias, fórmulas e parâmetros clínicos utilizados no GestaTools baseiam-se em referências científicas e consensos obstétricos reconhecidos internacionalmente:
        </p>

        <div className="bg-surface-variant/40 dark:bg-white/5 p-3.5 rounded-xl border border-surface-variant/50 flex flex-col gap-1">
          <span className="font-bold text-on-surface flex items-center gap-1.5 text-xs md:text-sm">
            <Icon name="calculate" className="text-primary text-[16px]" />
            Datação Obstétrica & DUM (Naegele)
          </span>
          <p className="text-[11px] md:text-xs">
            ACOG Committee Opinion No. 700: Methods for Estimating the Due Date. <i>Obstet Gynecol</i>. 2017 May;129(5):e150-e154.
          </p>
        </div>

        <div className="bg-surface-variant/40 dark:bg-white/5 p-3.5 rounded-xl border border-surface-variant/50 flex flex-col gap-1">
          <span className="font-bold text-on-surface flex items-center gap-1.5 text-xs md:text-sm">
            <Icon name="straighten" className="text-primary text-[16px]" />
            Fórmula de Hadlock (Biometria Fetal e Peso)
          </span>
          <p className="text-[11px] md:text-xs">
            Hadlock FP, et al. Estimating fetal weight with the use of head, body, and femur measurements - a prospective study. <i>Am J Obstet Gynecol</i>. 1985 Feb 1;151(3):333-7.
          </p>
          <p className="text-[11px] md:text-xs mt-0.5">
            Hadlock FP, et al. Fetal crown-rump length: relation to menstrual age and projection of expected date of confinement. <i>Radiology</i>. 1982.
          </p>
        </div>

        <div className="bg-surface-variant/40 dark:bg-white/5 p-3.5 rounded-xl border border-surface-variant/50 flex flex-col gap-1">
          <span className="font-bold text-on-surface flex items-center gap-1.5 text-xs md:text-sm">
            <Icon name="show_chart" className="text-primary text-[16px]" />
            Curvas de Percentil (Barcelona & Hadlock)
          </span>
          <p className="text-[11px] md:text-xs">
            Fetal Medicine Barcelona (FMB) Reference standards for fetal growth and weight. Gratacós E, et al. Medicina Fetal Barcelona.
          </p>
          <p className="text-[11px] md:text-xs mt-0.5">
            Hadlock FP, et al. In utero analysis of fetal growth: a sonographic weight standard. <i>Radiology</i>. 1991.
          </p>
        </div>

        <div className="bg-surface-variant/40 dark:bg-white/5 p-3.5 rounded-xl border border-surface-variant/50 flex flex-col gap-1">
          <span className="font-bold text-on-surface flex items-center gap-1.5 text-xs md:text-sm">
            <Icon name="water_drop" className="text-primary text-[16px]" />
            Avaliação de Líquido Amniótico (ILA e MBV)
          </span>
          <p className="text-[11px] md:text-xs">
            Phelan JP, et al. Amniotic fluid volume assessment with the four-quadrant technique at 36-42 weeks' gestation. <i>J Reprod Med</i>. 1987 Jul;32(7):540-2.
          </p>
        </div>

        <div className="bg-surface-variant/40 dark:bg-white/5 p-3.5 rounded-xl border border-surface-variant/50 flex flex-col gap-1">
          <span className="font-bold text-on-surface flex items-center gap-1.5 text-xs md:text-sm">
            <Icon name="database" className="text-primary text-[16px]" />
            Tabela SIGTAP / DATASUS & CID-10
          </span>
          <p className="text-[11px] md:text-xs">
            Ministério da Saúde - DATASUS. Sistema de Gerenciamento da Tabela de Procedimentos, Medicamentos e OPM do SUS (SIGTAP) - Competência 07/2026.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 p-3.5 rounded-xl text-[11px] md:text-xs text-on-surface leading-relaxed mt-1">
          <p>
            <strong>Aviso Clínico:</strong> Esta ferramenta destina-se exclusivamente a apoio de decisão clínica para profissionais de saúde devidamente habilitados.
          </p>
        </div>
      </div>
    </HelpModal>
  );
}
