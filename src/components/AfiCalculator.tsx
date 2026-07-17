import React, { useState, useEffect, useRef } from 'react';
import { clampValue } from '../utils/validation';
import { motion } from 'motion/react';
import { HistoryRecord } from '../types';
import Skeleton from "./Skeleton";
import HelpModal from './HelpModal';
import Icon from './Icon';
import { InfoBalloon } from './InfoBalloon';
import { useShortcut } from '../hooks/useShortcut';

interface AfiCalculatorProps {
  onSaveRecord: (record: Omit<HistoryRecord, 'id' | 'date'>) => void;
}

export default function AfiCalculator({ onSaveRecord }: AfiCalculatorProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useShortcut('Enter', () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  });

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
        return;
      }
    } else {
      if (mbv === undefined || mbv === '') {
        setErrorMessage('Preencha o valor do Maior Bolso Vertical (MBV).');
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
    setSaved(false); setShimmer(false); }, 600);
  };

  const handleSave = () => {
    if (!result) return;
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
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-3 md:gap-6 p-2 md:p-8">
      <div className="pl-1 w-full">
        <h1 className="text-xl md:text-3xl font-bold text-on-surface leading-tight md:mb-1">
          Líquido Amniótico
        </h1>
        <p className="font-body-sm text-secondary hidden md:block">
          Avaliação por ILA (Índice de Líquido Amniótico) e MBV
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
        <form ref={formRef} onSubmit={handleCalculate} noValidate className="glass-panel p-3 md:p-8 rounded-[1.5rem] md:rounded-[2rem] flex flex-col gap-3 md:gap-3.5 md:gap-5 w-full border border-surface-variant/50 shadow-sm">
        {/* Evaluation Method Selector */}
        <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-1 sm:grid-cols-2 w-full border border-surface-variant shadow-sm bg-white dark:bg-black mb-2">
          <button
            type="button"
            onClick={() => { setOnlyMbv(false); setResult(null); }}
            className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-surface ${
              !onlyMbv
                ? 'bg-surface text-on-surface shadow-sm border border-surface-variant'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Quatro Quadrantes (ILA)
          </button>
          <button
            type="button"
            onClick={() => { setOnlyMbv(true); setResult(null); }}
            className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-surface ${
              onlyMbv
                ? 'bg-surface text-on-surface shadow-sm border border-surface-variant'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Apenas MBV
          </button>
        </div>

        {errorMessage && (
          <InfoBalloon variant="error" text={errorMessage} />
        )}
          {!onlyMbv ? (
            <div className="flex flex-col gap-4">
              <InfoBalloon 
                text="Insira o valor vertical de cada quadrante em centímetros (cm)"
                onClick={() => setHelpTopic('ila')}
                className="mb-1"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2" title="Medida vertical do bolsão de líquido livre no quadrante superior direito">
                  <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="q1-input">
                    Quadrante 1 (cm)
                  </label>
                  <input 
                    id="q1-input"
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    required
                    value={q1 || ''}
                    onChange={(e) => setQ1(clampValue(e.target.value, 20, true) as any)}
                    className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2" title="Medida vertical do bolsão de líquido livre no quadrante superior esquerdo">
                  <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="q2-input">
                    Quadrante 2 (cm)
                  </label>
                  <input 
                    id="q2-input"
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    required
                    value={q2 || ''}
                    onChange={(e) => setQ2(clampValue(e.target.value, 20, true) as any)}
                    className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2" title="Medida vertical do bolsão de líquido livre no quadrante inferior direito">
                  <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="q3-input">
                    Quadrante 3 (cm)
                  </label>
                  <input 
                    id="q3-input"
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    required
                    value={q3 || ''}
                    onChange={(e) => setQ3(clampValue(e.target.value, 20, true) as any)}
                    className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2" title="Medida vertical do bolsão de líquido livre no quadrante inferior esquerdo">
                  <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="q4-input">
                    Quadrante 4 (cm)
                  </label>
                  <input 
                    id="q4-input"
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    required
                    value={q4 || ''}
                    onChange={(e) => setQ4(clampValue(e.target.value, 20, true) as any)}
                    className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <InfoBalloon 
                text="Insira a medida do maior bolsão vertical em centímetros (cm)"
                onClick={() => setHelpTopic('mbv')}
                className="mb-1"
              />
              <div className="flex flex-col gap-2" title="Bolsão único mais profundo livre de partes fetais e cordão umbilical. Normal entre 2 e 8 cm">
                <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="mbv-input">
                  Maior Bolso Vertical - MBV (cm)
                </label>
                <input 
                  id="mbv-input"
                  type="number"
                  min="0"
                  max="25"
                  step="0.1"
                  required
                  value={mbv || ''}
                  onChange={(e) => setMbv(clampValue(e.target.value, 20, true) as any)}
                  className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="calc-btn mt-2 md:mt-4 h-11 md:h-12 w-full bg-primary text-white font-title-md text-[17px] font-semibold rounded-xl"
          >
            Analisar
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
            {/* Main Amniotic Evaluation Section */}
            <p className="font-label-caps text-secondary mb-2 uppercase text-center text-balance text-xs">
              Avaliação do Líquido Amniótico
            </p>

            <div className={`grid gap-3 md:gap-4 w-full mt-2 md:mt-4 ${onlyMbv ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2'}`}>
              {!onlyMbv && (
                <div className="bg-surface-variant/30 rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center border border-surface-variant/50 shadow-sm relative overflow-hidden">
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
              
              <div className="bg-surface-variant/30 rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center border border-surface-variant/50 shadow-sm relative overflow-hidden">
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
                  <div className="bg-surface-variant/30 p-4 rounded-xl flex flex-col gap-2 border border-surface-variant/50">
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
                <div className="bg-surface-variant/30 p-4 rounded-xl flex flex-col gap-2 border border-surface-variant/50">
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
                      className="ios-input flex-grow h-12 px-3 rounded-xl text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSave}
                      className={`px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all duration-150 cursor-pointer ${
                        saved
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-surface-variant text-on-surface hover:bg-surface-variant/80'
                      }`}
                    >
                      <Icon name={saved ? 'check_circle' : 'save'} className="text-[18px]" />
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

      {/* Floating Action Button for Reset */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleReset}
        className="hidden md:flex fixed bottom-24 md:bottom-10 right-6 md:right-10 bg-surface text-on-surface shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:bg-surface-variant transition-colors p-4 rounded-full flex items-center justify-center border border-surface-variant/50 z-40 group"
        title="Zerar formulário"
      >
        <Icon name="refresh" className="text-[24px] group-hover:-rotate-180 transition-transform duration-500" />
      </motion.button>
    </div>
  );
}
