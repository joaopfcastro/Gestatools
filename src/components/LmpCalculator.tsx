import React, { useState, useEffect, useRef } from 'react';
import { clampValue, parseDateString, getTodayFormatted, validateDateStr } from '../utils/validation';
import { motion } from 'motion/react';
import { HistoryRecord } from '../types';
import Skeleton from "./Skeleton";
import HelpModal from './HelpModal';
import Icon from './Icon';
import { InfoBalloon } from './InfoBalloon';
import { useShortcut } from '../hooks/useShortcut';
import DateInput from './DateInput';
import GestationalMilestones from './GestationalMilestones';

interface LmpCalculatorProps {
  onSaveRecord: (record: Omit<HistoryRecord, 'id' | 'date'>) => void;
  defaultCycleLength: number;
}

export default function LmpCalculator({ onSaveRecord, defaultCycleLength }: LmpCalculatorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  useShortcut('Enter', () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  });

  const [dum, setDum] = useState<string>('');
  const [refDate, setRefDate] = useState<string>(getTodayFormatted());
  const [cycle, setCycle] = useState<number | "">(defaultCycleLength);
  const [patientName, setPatientName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mobileView, setMobileView] = useState<'inputs' | 'results'>('inputs');

  // Results state
  const [result, setResult] = useState<{
    weeks: number;
    days: number;
    dpp: string;
    conceptionDate: string;
    morphologicalMin: string;
    morphologicalMax: string;
    adjustedDumDate: Date;
    totalDays: number;
  } | null>(null);

  const [shimmer, setShimmer] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  // Help modal state
  const [helpTopic, setHelpTopic] = useState<'dum' | 'cycle' | null>(null);

  // Load defaults
  useEffect(() => {
    setCycle(defaultCycleLength);
  }, [defaultCycleLength]);

  // Real-time validation
  useEffect(() => {
    let err = null;
    if (dum.length === 10) {
      err = validateDateStr(dum, { noFuture: true });
    }
    if (!err && refDate.length === 10) {
      err = validateDateStr(refDate);
      if (!err && dum.length === 10) {
        const dumObj = parseDateString(dum);
        const refObj = parseDateString(refDate);
        if (dumObj && refObj && refObj < dumObj) {
          err = 'A data de referência não pode ser anterior à DUM.';
        }
      }
    }
    setErrorMessage(err || '');
  }, [dum, refDate]);

  const handleReset = () => {
    setDum('');
    setRefDate(getTodayFormatted());
    setCycle(defaultCycleLength);
    setPatientName('');
    setResult(null);
    setSaved(false);
    setShimmer(false);
    setErrorMessage('');
    setMobileView('inputs');
  };

  useShortcut('l', handleReset);
  useShortcut('s', () => {
    if (result && !saved) {
      handleSave();
    }
  });

  useEffect(() => {
    const handleClear = () => handleReset();
    window.addEventListener('clear-form', handleClear);
    return () => window.removeEventListener('clear-form', handleClear);
  }, [defaultCycleLength]);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (errorMessage) return; // Prevent calculation if reactive validation already caught an error.
    
    if (!dum || dum.length !== 10) {
      setErrorMessage('Por favor, informe a Data da Última Menstruação.');
      return;
    }

    const dumObj = parseDateString(dum);
    if (!dumObj) {
      setErrorMessage('A data da DUM é inválida.');
      return;
    }

    if (dumObj > new Date()) {
      setErrorMessage('A data da DUM não pode ser uma data futura.');
      return;
    }

    const refObj = parseDateString(refDate);
    if (!refObj) {
      setErrorMessage('A data de referência é inválida.');
      return;
    }

    if (refObj < dumObj) {
      setErrorMessage('A data de referência não pode ser anterior à DUM.');
      return;
    }
    
    const c = Number(cycle);
    if (cycle === '' || c < 20 || c > 45) {
      setErrorMessage('A duração do ciclo deve estar entre 20 e 45 dias.');
      return;
    }

    setShimmer(true); setTimeout(() => {
    
    // Cycle adjustment: if cycle is different from 28 days, ovulation happens (cycle - 14) days after DUM.
    const shiftDays = (Number(cycle) || 28) - 28;
    
    // Adjusted DUM used for gestational age calculation
    const adjustedDumMs = dumObj.getTime() - shiftDays * 24 * 60 * 60 * 1000;
    
    // Gestational age calculation
    const diffTime = refObj.getTime() - adjustedDumMs;
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    // DPP is 280 days after DUM, adjusted by shift
    const dppObj = new Date(dumObj.getTime() + (280 + shiftDays) * 24 * 60 * 60 * 1000);
    const conceptionObj = new Date(dumObj.getTime() + (14 + shiftDays) * 24 * 60 * 60 * 1000);
    
    // Morphological ultrasound: 20 to 24 weeks
    const morphMinObj = new Date(adjustedDumMs + 20 * 7 * 24 * 60 * 60 * 1000);
    const morphMaxObj = new Date(adjustedDumMs + 24 * 7 * 24 * 60 * 60 * 1000);

    const formatDateStr = (d: Date) => {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    setResult({
      weeks,
      days,
      dpp: formatDateStr(dppObj),
      conceptionDate: formatDateStr(conceptionObj),
      morphologicalMin: formatDateStr(morphMinObj),
      morphologicalMax: formatDateStr(morphMaxObj),
      adjustedDumDate: new Date(adjustedDumMs),
      totalDays
    });
    setMobileView('results');
    setSaved(false); setShimmer(false); }, 600);
  };

  const handleSave = () => {
    if (!result) return;
    const finalName = patientName.trim() || 'Paciente Sem Nome';
    
    onSaveRecord({
      patientName: finalName,
      type: 'DUM',
      summary: `${result.weeks} semanas e ${result.days} dias • DPP: ${result.dpp}`,
      details: {
        dum,
        refDate,
        cycle,
        weeks: result.weeks,
        days: result.days,
        dpp: result.dpp,
        conceptionDate: result.conceptionDate,
      },
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setPatientName('');
    }, 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-3 md:gap-6 p-2 md:p-8">
      <div className="pl-1 w-full">
        <h1 className="text-xl md:text-3xl font-bold text-on-surface leading-tight md:mb-1">
          Cálculo por DUM
        </h1>
        <p className="font-body-sm text-secondary hidden md:block">
          Datação obstétrica profissional baseada na data da última menstruação
        </p>
      </div>

      {/* Mobile Segmented Control */}
      {result && (
        <div className="lg:hidden flex p-1 bg-surface-variant/30 dark:bg-surface-variant/10 rounded-2xl w-full border border-surface-variant mb-1">
          <button
            type="button"
            onClick={() => setMobileView('inputs')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              mobileView === 'inputs'
                ? 'bg-surface text-on-surface shadow-sm border border-surface-variant/30'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Editar Parâmetros
          </button>
          <button
            type="button"
            onClick={() => setMobileView('results')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              mobileView === 'results'
                ? 'bg-surface text-on-surface shadow-sm border border-surface-variant/30'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Ver Resultado
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-12 items-start w-full">
      {/* Left Col: Inputs Form */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full lg:w-[45%] flex flex-col animate-card ${
          result && mobileView !== 'inputs' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <form ref={formRef} onSubmit={handleCalculate} noValidate className="glass-panel p-3 md:p-8 rounded-[1.5rem] md:rounded-[2rem] flex flex-col gap-3 md:gap-5 border border-surface-variant/50 shadow-sm">
          {errorMessage && (
            <InfoBalloon variant="error" text={errorMessage} />
          )}
          <div className="flex flex-col gap-2" title="Primeiro dia de sangramento do último ciclo.">
            <div className="flex flex-col gap-2 mb-1">
              <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="dum-date">
                Data da Última Menstruação (DUM)
              </label>
              <InfoBalloon 
                text="Primeiro dia de sangramento do último ciclo."
                onClick={() => setHelpTopic('dum')}
              />
            </div>
            <DateInput
              id="dum-date"
              required
              value={dum}
              onChange={setDum}
              className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
            />
          </div>

          <div className="flex flex-col gap-2" title="Data para a qual a idade gestacional será calculada.">
            <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="ref-date">
              Data de Referência (Hoje)
            </label>
            <DateInput
              id="ref-date"
              required
              value={refDate}
              onChange={setRefDate}
              className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
            />
          </div>

          <div className="flex flex-col gap-2 mt-2" title="Duração média do ciclo menstrual (padrão: 28 dias). Afeta a estimativa da ovulação.">
            <div className="flex flex-col gap-2 mb-1">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="font-body-sm text-secondary font-medium" htmlFor="cycle-length">
                  Duração do Ciclo (dias)
                </label>
                <span className="text-[12px] text-on-surface-variant">Padrão: 28</span>
              </div>
              <InfoBalloon 
                text="Afeta a data estimada da ovulação."
                onClick={() => setHelpTopic('cycle')}
              />
            </div>
            <input 
              id="cycle-length"
              type="number"
              min="20"
              max="45"
              required
              value={cycle}
              onChange={(e) => setCycle(clampValue(e.target.value, 45) as any)}
              className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
            />
          </div>

          <button
            type="submit"
            className="calc-btn mt-2 md:mt-4 h-11 md:h-12 w-full bg-primary text-white font-title-md text-[17px] font-semibold rounded-xl"
          >
            Calcular
          </button>
        </form>
      </motion.div>

      {/* Right Col: Results View */}
      <div 
        className={`w-full lg:w-[55%] flex flex-col animate-results lg:sticky lg:top-6 ${
          !result || mobileView !== 'results' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className={`glass-panel widget-gradient p-3 md:p-10 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center text-center w-full min-h-[300px] md:min-h-[380px] relative overflow-hidden border border-surface-variant/30 shadow-lg ${shimmer ? 'shimmer-active' : ''}`}
        >
          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Main IG Section */}
            <div className="relative flex justify-center items-center mb-2 md:mb-4 mt-1 md:mt-2">
              <svg viewBox="0 0 220 220" className="w-[120px] h-[120px] md:w-[220px] md:h-[220px] -rotate-90">
                <circle 
                  cx="110" cy="110" r="95"
                  className="stroke-surface-variant fill-none opacity-50"
                  strokeWidth="6"
                />
                {!shimmer && result && (
                  <motion.circle 
                    cx="110" cy="110" r="95"
                    className="stroke-primary fill-none drop-shadow-sm"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 95 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 95) - ((Math.min(result.totalDays, 280) / 280) * (2 * Math.PI * 95)) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ strokeDasharray: 2 * Math.PI * 95 }}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                {shimmer ? (
                  <Skeleton className="w-24 h-[48px] md:h-[64px]" type="dots" />
                ) : result ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display-lg text-[32px] md:text-[56px] leading-none text-primary tracking-tight">
                        {result.weeks < 0 ? '--' : result.weeks}
                      </span>
                      <span className="font-title-md text-primary opacity-80 text-lg md:text-xl">s</span>
                      <span className="font-display-lg text-[24px] md:text-[40px] leading-none text-tertiary tracking-tight ml-1">
                        {result.weeks < 0 ? '--' : result.days}
                      </span>
                      <span className="font-title-md text-tertiary opacity-80 text-lg md:text-xl">d</span>
                    </div>
                    <span className="text-[7px] md:text-[10px] font-bold text-secondary uppercase tracking-wider md:tracking-widest mt-1 md:mt-2 text-center max-w-[90px] md:max-w-none leading-tight">Idade Gestacional</span>
                  </>
                ) : (
                  <span className="font-display-lg text-[32px] md:text-[56px] leading-none text-secondary opacity-30">--</span>
                )}
              </div>
            </div>

            <div className="bg-surface-variant/30 rounded-2xl md:rounded-3xl px-4 md:px-8 py-2 md:py-5 flex flex-col items-center border border-surface-variant/50 w-full max-w-[280px] md:max-w-[320px] shadow-sm mb-2 md:mb-4">
              <p className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
                Data Provável do Parto
              </p>
              <span className="font-headline-lg text-xl md:text-[28px] font-semibold text-on-surface tracking-tight">
                {shimmer ? (
                  <Skeleton className="w-32 md:w-40 h-[24px] md:h-[32px] rounded-lg mt-1" />
                ) : result ? (
                  result.dpp
                ) : (
                  '-- / -- / ----'
                )}
              </span>
            </div>

            {/* Detailed clinical indicators, only visible when computed */}
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col gap-3 md:gap-4 mt-4 md:mt-8 pt-4 md:pt-6 border-t border-surface-variant"
              >
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="flex flex-col gap-1 bg-surface-variant/30 p-3 md:p-4 rounded-xl">
                    <span className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-wide">Concepção Estimada</span>
                    <span className="text-xs md:text-sm font-semibold text-on-surface">{result.conceptionDate}</span>
                  </div>
                  <div className="flex flex-col gap-1 bg-surface-variant/30 p-3 md:p-4 rounded-xl">
                    <span className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-wide">USG Morfológico</span>
                    <span className="text-[11px] md:text-xs font-semibold text-on-surface">{result.morphologicalMin} - {result.morphologicalMax}</span>
                  </div>
                </div>

                <GestationalMilestones dumDate={result.adjustedDumDate} currentDays={result.totalDays} />

                {/* Save record */}
                <div className="mt-2 md:mt-4 pt-3 md:pt-4 border-t border-surface-variant flex flex-col gap-2.5 text-left">
                  <label className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-secondary pl-1" htmlFor="pat-name">
                    Salvar no Histórico Local
                  </label>
                  <div className="flex gap-2">
                    <input 
                      id="pat-name"
                      type="text"
                      placeholder="Identificação da paciente..."
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="ios-input flex-grow h-11 md:h-12 px-3 rounded-xl text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSave}
                      className={`px-3 md:px-4 rounded-xl flex items-center justify-center gap-1 font-bold text-xs transition-all duration-150 cursor-pointer ${
                        saved
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-surface-variant text-on-surface hover:bg-surface-variant/80'
                      }`}
                    >
                      <Icon name={saved ? 'check_circle' : 'save'} className="text-[16px] md:text-[18px]" />
                      {saved ? 'Salvo' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
      </div>

      <HelpModal
        isOpen={helpTopic !== null}
        onClose={() => setHelpTopic(null)}
        title={
          helpTopic === 'dum' ? 'Data da Última Menstruação (DUM)' :
          helpTopic === 'cycle' ? 'Duração do Ciclo' : ''
        }
      >
        {helpTopic === 'dum' && (
          <p>
            A <strong>DUM (Data da Última Menstruação)</strong> refere-se ao primeiro dia de sangramento do último ciclo menstrual. 
            É o parâmetro clínico padrão para datar a gestação, assumindo um ciclo regular onde a ovulação ocorre cerca de 14 dias após a DUM.
          </p>
        )}
        {helpTopic === 'cycle' && (
          <p>
            A <strong>duração do ciclo</strong> afeta o momento da ovulação. Em um ciclo padrão de 28 dias, a ovulação ocorre no 14º dia. 
            Se o ciclo for mais longo ou mais curto, a data provável da concepção e, consequentemente, a idade gestacional real, 
            precisam ser ajustadas (regra de Naegele modificada).
          </p>
        )}
      </HelpModal>

      {/* Floating Action Button for Reset */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleReset}
        className="hidden md:flex fixed bottom-24 md:bottom-10 right-6 md:right-10 bg-surface text-on-surface shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:bg-surface-variant transition-colors p-4 rounded-full items-center justify-center border border-surface-variant/50 z-40 group"
        title="Zerar formulário"
      >
        <Icon name="refresh" className="text-[24px] group-hover:-rotate-180 transition-transform duration-500" />
      </motion.button>
    </div>
  );
}
