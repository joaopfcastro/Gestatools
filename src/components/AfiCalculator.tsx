import React, { useState, useEffect, useRef } from 'react';
import { clampValue } from '../utils/validation';
import { motion } from 'motion/react';
import { HistoryRecord } from '../types';
import Skeleton from "./Skeleton";
import HelpModal from './HelpModal';
import Icon from './Icon';
import { InfoBalloon } from './InfoBalloon';
import { useShortcut } from '../hooks/useShortcut';
import { triggerHaptic } from '../utils/haptics';
import CalculatorActionBar from './CalculatorActionBar';

interface AfiCalculatorProps {
  onSaveRecord: (record: Omit<HistoryRecord, 'id' | 'date'>) => void;
}

export default function AfiCalculator({ onSaveRecord }: AfiCalculatorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const q1InputRef = useRef<HTMLInputElement>(null);
  const mbvInputRef = useRef<HTMLInputElement>(null);

  useShortcut('Enter', () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const focusInput = (isMbv: boolean = onlyMbv) => {
    setTimeout(() => {
      if (isMbv && mbvInputRef.current) {
        mbvInputRef.current.focus();
        mbvInputRef.current.select?.();
      } else if (!isMbv && q1InputRef.current) {
        q1InputRef.current.focus();
        q1InputRef.current.select?.();
      }
    }, 50);
  };

  // Input Quadrants (in cm)
  const [q1, setQ1] = useState<number | "">(0);
  const [q2, setQ2] = useState<number | "">(0);
  const [q3, setQ3] = useState<number | "">(0);
  const [q4, setQ4] = useState<number | "">(0);
  
  // Single MBV (in cm)
  const [mbv, setMbv] = useState<number | "">(0);
  
  // Controls
  const [onlyMbv, setOnlyMbv] = useState<boolean>(false);
  const [patientName, setPatientName] = useState<string>('');
  const [shimmer, setShimmer] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mobileView, setMobileView] = useState<'inputs' | 'results'>('inputs');

  // Help modal state
  const [helpTopic, setHelpTopic] = useState<'ila' | 'mbv' | null>(null);

  // Results state
  const [result, setResult] = useState<{
    ilaValue: number;
    mbvValue: number;
    ilaClass: string;
    ilaColor: string;
    ilaBgColor: string;
    mbvClass: string;
    mbvColor: string;
    mbvBgColor: string;
    summary: string;
  } | null>(null);

  const handleReset = () => {
    setQ1(0);
    setQ2(0);
    setQ3(0);
    setQ4(0);
    setMbv(0);
    setOnlyMbv(false);
    setPatientName('');
    setShimmer(false);
    setSaved(false);
    setResult(null);
    setErrorMessage('');
    setMobileView('inputs');

    focusInput(false);
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
  }, []);

  // Auto-calculate MBV when quadrants change (it's the max quadrant)
  useEffect(() => {
    if (!onlyMbv) {
      const maxVal = Math.max(q1, q2, q3, q4);
      setMbv(maxVal);
    }
  }, [q1, q2, q3, q4, onlyMbv]);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    
    if (!onlyMbv) {
      if (q1 === undefined || q1 === '' || q2 === undefined || q2 === '' || q3 === undefined || q3 === '' || q4 === undefined || q4 === '') {
        setErrorMessage('Preencha os valores dos 4 quadrantes.');
        triggerHaptic([60, 40, 60]);
        return;
      }
    } else {
      if (mbv === undefined || mbv === '') {
        setErrorMessage('Preencha o valor do Maior Bolso Vertical (MBV).');
        triggerHaptic([60, 40, 60]);
        return;
      }
    }
    
    setShimmer(true); setTimeout(() => {

    const calculatedIla = q1 + q2 + q3 + q4;
    const calculatedMbv = mbv;

    // 1. ILA Classification
    let ilaClass = 'Normal (Líquido adequado)';
    let ilaColor = 'text-primary';
    let ilaBgColor = 'bg-primary/10 text-primary';
    
    if (calculatedIla < 5) {
      ilaClass = 'Oligodramnio Severo';
      ilaColor = 'text-error';
      ilaBgColor = 'bg-error/10 text-error';
    } else if (calculatedIla >= 5 && calculatedIla <= 8) {
      ilaClass = 'Oligodramnio Moderado / Limítrofe';
      ilaColor = 'text-warning';
      ilaBgColor = 'bg-warning/10 text-warning';
    } else if (calculatedIla > 24) {
      ilaClass = 'Polidramnio';
      ilaColor = 'text-tertiary';
      ilaBgColor = 'bg-tertiary/10 text-tertiary';
    }

    // 2. MBV Classification
    let mbvClass = 'Normal (Líquido adequado)';
    let mbvColor = 'text-primary';
    let mbvBgColor = 'bg-primary/10 text-primary';

    if (calculatedMbv < 2) {
      mbvClass = 'Oligodramnio';
      mbvColor = 'text-error';
      mbvBgColor = 'bg-error/10 text-error';
    } else if (calculatedMbv > 8) {
      mbvClass = 'Polidramnio';
      mbvColor = 'text-tertiary';
      mbvBgColor = 'bg-tertiary/10 text-tertiary';
    }

    const summary = onlyMbv 
      ? `MBV: ${calculatedMbv}cm (${mbvClass})`
      : `ILA: ${calculatedIla}cm (${ilaClass}) • MBV: ${calculatedMbv}cm`;

    setResult({
      ilaValue: calculatedIla,
      mbvValue: calculatedMbv,
      ilaClass,
      ilaColor,
      ilaBgColor,
      mbvClass,
      mbvColor,
      mbvBgColor,
      summary
    });
    setMobileView('results');
    triggerHaptic([25, 40, 25]);
    setSaved(false); setShimmer(false); }, 600);
  };

  const handleSave = () => {
    if (!result) return;
    triggerHaptic([50, 50]);
    const finalName = patientName.trim() || 'Paciente Sem Nome';

    onSaveRecord({
      patientName: finalName,
      type: 'ILA',
      summary: result.summary,
      details: {
        onlyMbv,
        q1: !onlyMbv ? q1 : undefined,
        q2: !onlyMbv ? q2 : undefined,
        q3: !onlyMbv ? q3 : undefined,
        q4: !onlyMbv ? q4 : undefined,
        ila: !onlyMbv ? result.ilaValue : undefined,
        mbv: result.mbvValue,
        ilaClassification: !onlyMbv ? result.ilaClass : undefined,
        mbvClassification: result.mbvClass
      }
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setPatientName('');
    }, 2000);
  };

  return (
    <div className="w-full max-w-6xl min-[1366px]:max-w-7xl mx-auto flex flex-col justify-start gap-3 min-[1024px]:gap-5 p-0 sm:p-2 min-[1366px]:p-4 h-auto min-w-0">
      <div className="px-1 w-full">
        <h1 className="text-xl md:text-2xl min-[1366px]:text-3xl font-bold text-on-surface leading-tight md:mb-1">
          Líquido Amniótico
        </h1>
        <p className="font-body-sm text-secondary hidden md:block text-xs min-[1366px]:text-sm">
          Avaliação por ILA (Índice de Líquido Amniótico) e MBV
        </p>
      </div>

      {/* Mobile / Narrow Tablet Segmented Control */}
      {result && (
        <div className="min-[1024px]:hidden flex p-1 bg-surface-variant/50 dark:bg-surface-variant dark:bg-surface-variant/10 rounded-2xl w-full border border-surface-variant mb-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setMobileView('inputs');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mobileView === 'inputs'
                ? 'bg-surface text-on-surface shadow-xs border border-surface-variant/30'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Editar Parâmetros
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setMobileView('results');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mobileView === 'results'
                ? 'bg-surface text-on-surface shadow-xs border border-surface-variant/30'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Ver Resultado
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 min-[1024px]:grid-cols-[minmax(320px,0.88fr)_minmax(0,1.12fr)] min-[1366px]:flex min-[1366px]:flex-row gap-4 min-[1024px]:gap-6 min-[1366px]:gap-12 items-start w-full min-w-0">
        {/* Left Col: Inputs Form */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full min-[1366px]:w-[45%] flex flex-col animate-card min-w-0 ${
            result && mobileView !== 'inputs' ? 'hidden min-[1024px]:flex' : 'flex'
          }`}
        >
          <form ref={formRef} onSubmit={handleCalculate} noValidate className="glass-panel p-3.5 sm:p-5 min-[1024px]:p-6 min-[1366px]:p-8 rounded-[1.25rem] md:rounded-[2rem] flex flex-col justify-start min-[1366px]:justify-between gap-3 sm:gap-4 shadow-xs h-auto min-[1366px]:h-full relative pb-16 min-[1024px]:pb-6 min-[1366px]:pb-8">
            {/* Evaluation Method Selector */}
            <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-2 w-full border border-surface-variant shadow-xs bg-white dark:bg-black mb-1">
              <button
                type="button"
                onClick={() => { triggerHaptic(15); setOnlyMbv(false); setResult(null); focusInput(false); }}
                className={`py-2 px-1 text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                  !onlyMbv
                    ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                4 Quadrantes (ILA)
              </button>
              <button
                type="button"
                onClick={() => { triggerHaptic(15); setOnlyMbv(true); setResult(null); focusInput(true); }}
                className={`py-2 px-1 text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                  onlyMbv
                    ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Apenas MBV
              </button>
            </div>

            {errorMessage && (
              <InfoBalloon variant="error" text={errorMessage} />
            )}

            <div className="flex flex-col gap-3 flex-initial md:flex-1 justify-start md:justify-center">
              {!onlyMbv ? (
                <div className="flex flex-col gap-3">
                  <InfoBalloon 
                    text="Insira o valor vertical de cada quadrante em centímetros (cm)"
                    onClick={() => setHelpTopic('ila')}
                  />

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="flex flex-col gap-1" title="Medida vertical do bolsão no Q1">
                      <label className="text-xs font-semibold text-on-surface pl-0.5" htmlFor="q1-input">
                        Quadrante 1 (cm)
                      </label>
                      <input 
                        ref={q1InputRef}
                        id="q1-input"
                        type="number"
                        min="0"
                        max="15"
                        step="0.1"
                        required
                        enterKeyHint="next"
                        value={q1 || ''}
                        onChange={(e) => setQ1(clampValue(e.target.value, 20, true) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>
                    <div className="flex flex-col gap-1" title="Medida vertical do bolsão no Q2">
                      <label className="text-xs font-semibold text-on-surface pl-0.5" htmlFor="q2-input">
                        Quadrante 2 (cm)
                      </label>
                      <input 
                        id="q2-input"
                        type="number"
                        min="0"
                        max="15"
                        step="0.1"
                        required
                        enterKeyHint="next"
                        value={q2 || ''}
                        onChange={(e) => setQ2(clampValue(e.target.value, 20, true) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>
                    <div className="flex flex-col gap-1" title="Medida vertical do bolsão no Q3">
                      <label className="text-xs font-semibold text-on-surface pl-0.5" htmlFor="q3-input">
                        Quadrante 3 (cm)
                      </label>
                      <input 
                        id="q3-input"
                        type="number"
                        min="0"
                        max="15"
                        step="0.1"
                        required
                        enterKeyHint="next"
                        value={q3 || ''}
                        onChange={(e) => setQ3(clampValue(e.target.value, 20, true) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>
                    <div className="flex flex-col gap-1" title="Medida vertical do bolsão no Q4">
                      <label className="text-xs font-semibold text-on-surface pl-0.5" htmlFor="q4-input">
                        Quadrante 4 (cm)
                      </label>
                      <input 
                        id="q4-input"
                        type="number"
                        min="0"
                        max="15"
                        step="0.1"
                        required
                        enterKeyHint="done"
                        value={q4 || ''}
                        onChange={(e) => setQ4(clampValue(e.target.value, 20, true) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <InfoBalloon 
                    text="Insira a medida do maior bolsão vertical em centímetros (cm)"
                    onClick={() => setHelpTopic('mbv')}
                  />
                  <div className="flex flex-col gap-1.5" title="Maior Bolsão Vertical (MBV)">
                    <label className="text-sm font-semibold text-on-surface pl-0.5" htmlFor="mbv-input">
                      Maior Bolso Vertical - MBV (cm)
                    </label>
                    <input 
                      ref={mbvInputRef}
                      id="mbv-input"
                      type="number"
                      min="0"
                      max="25"
                      step="0.1"
                      required
                      enterKeyHint="done"
                      value={mbv || ''}
                      onChange={(e) => setMbv(clampValue(e.target.value, 20, true) as any)}
                      onFocus={handleFocus}
                      className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                    />
                  </div>
                </div>
              )}
            </div>

            <CalculatorActionBar label="Analisar" />
          </form>
        </motion.div>

      {/* Right Col: Results View */}
      <div 
        className={`w-full min-[1366px]:w-[55%] flex flex-col animate-results min-[1024px]:sticky min-[1024px]:top-20 min-w-0 ${
          !result || mobileView !== 'results' ? 'hidden min-[1024px]:flex' : 'flex'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className={`glass-panel widget-gradient p-4 min-[1024px]:p-6 min-[1366px]:p-10 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center text-center w-full min-h-[300px] md:min-h-[360px] relative overflow-hidden ${shimmer ? 'shimmer-active' : ''}`}
        >
          <div className="relative z-10 w-full flex flex-col items-center min-w-0">
            {/* Main Amniotic Evaluation Section */}
            <p className="font-label-caps text-secondary mb-2 uppercase text-center text-balance text-xs">
              Avaliação do Líquido Amniótico
            </p>

            <div className={`grid gap-3 md:gap-4 w-full mt-2 md:mt-4 ${onlyMbv ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2'}`}>
              {!onlyMbv && (
                <div className="bg-surface-variant/50 dark:bg-surface-variant rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center  relative overflow-hidden">
                  <span className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest mb-1 z-10">Índice (ILA)</span>
                  <div className="flex items-baseline gap-1 z-10">
                    <span className="font-display-lg text-[28px] md:text-[48px] leading-none text-primary tracking-tight">
                      {shimmer ? <Skeleton className="w-12 md:w-16 h-8 md:h-10" type="dots" /> : result ? result.ilaValue.toFixed(1) : '--'}
                    </span>
                    <span className="font-title-md text-primary opacity-80 text-base md:text-lg">cm</span>
                  </div>
                  <div className={`mt-3 py-1 px-3 rounded-full text-[9px] md:text-[10px] font-bold text-center leading-tight z-10 ${result ? result.ilaBgColor : 'bg-surface-variant/50 text-secondary'}`}>
                    {shimmer ? <Skeleton className="w-12 h-3 rounded-full opacity-50 mx-auto" /> : result ? result.ilaClass : 'Aguardando'}
                  </div>
                </div>
              )}
              
              <div className="bg-surface-variant/50 dark:bg-surface-variant rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center  relative overflow-hidden">
                <span className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest mb-1 z-10">Maior Bolso (MBV)</span>
                <div className="flex items-baseline gap-1 z-10">
                  <span className="font-display-lg text-[28px] md:text-[48px] leading-none text-tertiary tracking-tight">
                    {shimmer ? <Skeleton className="w-12 md:w-16 h-8 md:h-10" type="dots" /> : result ? result.mbvValue.toFixed(1) : '--'}
                  </span>
                  <span className="font-title-md text-tertiary opacity-80 text-base md:text-lg">cm</span>
                </div>
                <div className={`mt-3 py-1 px-3 rounded-full text-[9px] md:text-[10px] font-bold text-center leading-tight z-10 ${result ? result.mbvBgColor : 'bg-surface-variant/50 text-secondary'}`}>
                  {shimmer ? <Skeleton className="w-12 h-3 rounded-full opacity-50 mx-auto" /> : result ? result.mbvClass : 'Aguardando'}
                </div>
              </div>
            </div>

            {/* Detailed visual ranges, only visible when computed */}
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col gap-4 mt-8 pt-6 border-t border-surface-variant text-left"
              >
                {/* ILA Range Visual Guide */}
                {!onlyMbv && (
                  <div className="bg-surface-variant/50 dark:bg-surface-variant p-3 md:p-4 rounded-xl flex flex-col gap-2 border border-surface-variant/50">
                    <div className="flex justify-between items-center text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">
                      <span>Posicionamento ILA ({result.ilaValue.toFixed(1)} cm)</span>
                    </div>
                    <div className="relative w-full h-4 bg-surface-variant rounded-full mt-1 overflow-hidden flex">
                      <div className="h-full bg-error/80" style={{ width: '20.8%' }} title="Oligodramnio severo < 5cm" />
                      <div className="h-full bg-warning/70" style={{ width: '12.5%' }} title="Oligodramnio moderado 5-8cm" />
                      <div className="h-full bg-primary/80" style={{ width: '66.7%' }} title="Normal 8-24cm" />
                      {/* Visual Marker */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-primary rounded-full shadow-md z-10 transition-all duration-300"
                        style={{ left: `${Math.min(96, (result.ilaValue / 26) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-secondary uppercase font-bold px-1 mt-0.5">
                      <span>Oligo (&lt;5)</span>
                      <span>Limítrofe (5-8)</span>
                      <span>Adequado (8-24)</span>
                      <span>Poli (&gt;24)</span>
                    </div>
                  </div>
                )}

                {/* MBV Range Visual Guide */}
                <div className="bg-surface-variant/50 dark:bg-surface-variant p-3 md:p-4 rounded-xl flex flex-col gap-2 border border-surface-variant/50">
                  <div className="flex justify-between items-center text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">
                    <span>Posicionamento MBV ({result.mbvValue.toFixed(1)} cm)</span>
                  </div>
                  <div className="relative w-full h-4 bg-surface-variant rounded-full mt-1 overflow-hidden flex">
                    <div className="h-full bg-error/80" style={{ width: '20%' }} title="Oligodramnio < 2cm" />
                    <div className="h-full bg-primary/80" style={{ width: '60%' }} title="Normal 2-8cm" />
                    <div className="h-full bg-tertiary/80" style={{ width: '20%' }} title="Polidramnio > 8cm" />
                    {/* Visual Marker */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-primary rounded-full shadow-md z-10 transition-all duration-300"
                      style={{ left: `${Math.min(96, (result.mbvValue / 10) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-secondary uppercase font-bold px-1 mt-0.5">
                    <span>Oligo (&lt;2)</span>
                    <span>Normal (2-8)</span>
                    <span>Polidramnio (&gt;8)</span>
                  </div>
                </div>

                {/* Save record */}
                <div className="mt-4 pt-4 border-t border-surface-variant flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-secondary pl-1" htmlFor="pat-name-afi">
                    Salvar no Histórico Local
                  </label>
                  <div className="flex gap-2">
                    <input 
                      id="pat-name-afi"
                      type="text"
                      placeholder="Identificação da paciente..."
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      onFocus={handleFocus}
                      className="ios-input flex-grow h-12 px-3 rounded-xl text-base"
                    />
                    <button
                      type="button"
                      onClick={handleSave}
                      className={`px-4 rounded-xl inline-flex items-center justify-center gap-1.5 font-bold text-xs transition-all duration-150 cursor-pointer min-h-[48px] md:min-h-0 ${
                        saved
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-surface-variant text-on-surface hover:bg-surface-variant/80'
                      }`}
                    >
                      <Icon name={saved ? 'check_circle' : 'save'} className="icon-inline" />
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
          helpTopic === 'ila' ? 'Índice de Líquido Amniótico (ILA)' :
          helpTopic === 'mbv' ? 'Maior Bolso Vertical (MBV)' : ''
        }
      >
        {helpTopic === 'ila' && (
          <div className="space-y-3">
            <p>
              O <strong>Índice de Líquido Amniótico (ILA)</strong> é um método semiquantitativo de avaliação do volume de líquido amniótico.
            </p>
            <p>
              É obtido dividindo o útero em quatro quadrantes e medindo verticalmente o maior bolsão de líquido livre de cordão ou partes fetais em cada um deles. A soma das quatro medidas (em cm) resulta no ILA.
            </p>
            <p>
              Valores normais variam tipicamente entre 8 e 24 cm.
            </p>
          </div>
        )}
        {helpTopic === 'mbv' && (
          <div className="space-y-3">
            <p>
              O <strong>Maior Bolso Vertical (MBV)</strong>, ou bolsão único mais profundo, é uma avaliação do maior bolsão de líquido amniótico vertical livre de partes fetais e cordão umbilical.
            </p>
            <p>
              O American College of Obstetricians and Gynecologists (ACOG) recomenda o uso do MBV em gestações de alto risco e em gestações múltiplas, pois o uso do ILA frequentemente leva a um diagnóstico excessivo de oligodrâmnio.
            </p>
            <p>
              Valores normais de MBV variam entre 2 e 8 cm.
            </p>
          </div>
        )}
      </HelpModal>

      {/* Floating Action Button for Reset - Only on wide desktop (>= 1366px) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          triggerHaptic(50);
          handleReset();
        }}
        className="hidden min-[1366px]:flex fixed bottom-10 right-10 bg-surface text-on-surface shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:bg-surface-variant transition-colors p-4 rounded-full items-center justify-center border border-surface-variant/50 z-40 group"
        title="Zerar formulário"
      >
        <Icon name="refresh" className="text-[24px] group-hover:-rotate-180 transition-transform duration-500" />
      </motion.button>
    </div>
  );
}
