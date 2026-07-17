import React, { useState, useEffect, useRef } from 'react';
import { clampValue } from '../utils/validation';
import { motion } from 'motion/react';
import { HistoryRecord } from '../types';
import { HADLOCK_TABLE, BARCELONA_TABLE, calculatePercentile } from '../data/percentiles';
import Skeleton from "./Skeleton";
import HelpModal from './HelpModal';
import Icon from './Icon';
import { InfoBalloon } from './InfoBalloon';
import { useShortcut } from '../hooks/useShortcut';

interface PercentileCalculatorProps {
  onSaveRecord: (record: Omit<HistoryRecord, 'id' | 'date'>) => void;
}

type InputMode = 'peso' | 'biometria';
type CurveType = 'hadlock' | 'barcelona';

export default function PercentileCalculator({ onSaveRecord }: PercentileCalculatorProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useShortcut('Enter', () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  });

  const [curve, setCurve] = useState<CurveType>('hadlock');
  const [inputMode, setInputMode] = useState<InputMode>('peso');
  
  // Gestational Age
  const [weeks, setWeeks] = useState<number | "">(28);
  const [days, setDays] = useState<number | "">(0);
  
  // Weights inputs
  const [weight, setWeight] = useState<number | "">(1200); // grams
  
  // Biometry inputs (in mm)
  const [bpd, setBpd] = useState<number | "">(71); // BPD / DBP
  const [hc, setHc] = useState<number | "">(262); // HC / CC
  const [ac, setAc] = useState<number | "">(240); // AC / CA
  const [fl, setFl] = useState<number | "">(54);  // FL / F

  const [patientName, setPatientName] = useState<string>('');
  const [shimmer, setShimmer] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mobileView, setMobileView] = useState<'inputs' | 'results'>('inputs');

  // Help modal state
  const [helpTopic, setHelpTopic] = useState<'weight' | 'biometry' | null>(null);

  // Result state
  const [result, setResult] = useState<{
    efw: number;
    percentile: number;
    classification: string;
    classColor: string;
    bgClassColor: string;
    p3: number;
    p10: number;
    p50: number;
    p90: number;
    p97: number;
    curveLabel: string;
    decimalWeeks: number;
  } | null>(null);

  const handleReset = () => {
    setCurve('hadlock');
    setInputMode('peso');
    setWeeks(28);
    setDays(0);
    setWeight(1200);
    setBpd(71);
    setHc(262);
    setAc(240);
    setFl(54);
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

  // Auto-calculate weight when biometries change
  useEffect(() => {
    if (inputMode === 'biometria') {
      calculateEfwFromBiometry();
    }
  }, [bpd, hc, ac, fl, inputMode]);

  const calculateEfwFromBiometry = () => {
    if (!bpd || !hc || !ac || !fl) return;

    // Convert mm to cm
    const bpdCm = bpd / 10;
    const hcCm = hc / 10;
    const acCm = ac / 10;
    const flCm = fl / 10;

    // Hadlock 4-parameter formula (Hadlock et al., 1985)
    // Log10(EFW) = 1.3596 - 0.00386 * (AC * FL) + 0.0064 * HC + 0.00061 * (BPD * AC) + 0.0424 * AC + 0.174 * FL
    const logEfw = 1.3596 
      - 0.00386 * acCm * flCm 
      + 0.0064 * hcCm 
      + 0.00061 * bpdCm * acCm 
      + 0.0424 * acCm 
      + 0.174 * flCm;
    
    const efwGrams = Math.pow(10, logEfw);
    setWeight(Math.round(efwGrams));
  };

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    
    const w = Number(weeks);
    const d = Number(days);
    
    if (weeks === '' || w < 20 || w > 42) {
      setErrorMessage('A IG (Semanas) deve estar entre 20 e 42.');
      return;
    }
    if (days === '' || d < 0 || d > 6) {
      setErrorMessage('A IG (Dias) deve estar entre 0 e 6.');
      return;
    }
    if (inputMode === 'peso') {
      const p = Number(weight);
      if (weight === '' || p < 100 || p > 6000) {
        setErrorMessage('O peso deve estar entre 100g e 6000g.');
        return;
      }
    } else {
      const b = Number(bpd), h = Number(hc), a = Number(ac), f = Number(fl);
      if (!b || b < 30 || b > 120) { setErrorMessage('DBP inválido (30-120mm)'); return; }
      if (!h || h < 100 || h > 400) { setErrorMessage('CC inválida (100-400mm)'); return; }
      if (!a || a < 100 || a > 400) { setErrorMessage('CA inválida (100-400mm)'); return; }
      if (!f || f < 20 || f > 100) { setErrorMessage('Fêmur inválido (20-100mm)'); return; }
    }
    
    setShimmer(true); setTimeout(() => {

    const decimalWeeks = weeks + days / 7;
    const table = curve === 'hadlock' ? HADLOCK_TABLE : BARCELONA_TABLE;
    
    const calcResult = calculatePercentile(table, decimalWeeks, weight);

    if (!calcResult) {
      setErrorMessage('Idade Gestacional fora do intervalo disponível (20 a 42 semanas).');
      setShimmer(false);
      return;
    }

    const { percentile, thresholds } = calcResult;

    let classification = 'Adequado para a Idade Gestacional (AIG)';
    let classColor = 'text-primary';
    let bgClassColor = 'bg-primary/10 text-primary';

    if (percentile < 3) {
      classification = 'Restrição de Crescimento Fetal Severa (RCF Severo / PIG)';
      classColor = 'text-error';
      bgClassColor = 'bg-error/10 text-error';
    } else if (percentile >= 3 && percentile < 10) {
      classification = 'Pequeno para a Idade Gestacional (PIG / RCF Moderado)';
      classColor = 'text-warning';
      bgClassColor = 'bg-warning/10 text-warning';
    } else if (percentile > 90 && percentile <= 97) {
      classification = 'Grande para a Idade Gestacional (GIG)';
      classColor = 'text-tertiary';
      bgClassColor = 'bg-tertiary/10 text-tertiary';
    } else if (percentile > 97) {
      classification = 'Macrossomia Fetal / GIG Severo';
      classColor = 'text-tertiary';
      bgClassColor = 'bg-tertiary/10 text-tertiary';
    }

    setResult({
      efw: weight,
      percentile,
      classification,
      classColor,
      bgClassColor,
      p3: Math.round(thresholds.p3),
      p10: Math.round(thresholds.p10),
      p50: Math.round(thresholds.p50),
      p90: Math.round(thresholds.p90),
      p97: Math.round(thresholds.p97),
      curveLabel: curve === 'hadlock' ? 'Hadlock (EUA)' : 'Barcelona (Europa)',
      decimalWeeks,
    });
    setMobileView('results');
    setSaved(false); setShimmer(false); }, 600);
  };

  const handleSave = () => {
    if (!result) return;
    const finalName = patientName.trim() || 'Paciente Sem Nome';

    onSaveRecord({
      patientName: finalName,
      type: 'Peso',
      summary: `Peso: ${result.efw}g (Percentil: p${result.percentile}) • Curva: ${curve === 'hadlock' ? 'Hadlock' : 'Barcelona'}`,
      details: {
        weeks,
        days,
        weight: result.efw,
        curve,
        percentile: result.percentile,
        classification: result.classification,
        biometries: inputMode === 'biometria' ? { bpd, hc, ac, fl } : undefined
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
          Percentil Fetal
        </h1>
        <p className="font-body-sm text-secondary hidden md:block">
          Avaliação de crescimento e cálculo de peso fetal estimado
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
        {/* Toggles for curve and input mode */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 w-full mb-2">
          {/* Curve Selector */}
          <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-1 sm:grid-cols-2 border border-surface-variant shadow-sm bg-white dark:bg-black">
            <button
              type="button"
              onClick={() => { setCurve('hadlock'); setResult(null); }}
              className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-surface ${
                curve === 'hadlock'
                  ? 'bg-surface text-on-surface shadow-sm border border-surface-variant'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Curva Hadlock
            </button>
            <button
              type="button"
              onClick={() => { setCurve('barcelona'); setResult(null); }}
              className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-surface ${
                curve === 'barcelona'
                  ? 'bg-surface text-on-surface shadow-sm border border-surface-variant'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Curva Barcelona
            </button>
          </div>

          {/* Input Mode Selector */}
          <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-1 sm:grid-cols-2 border border-surface-variant shadow-sm bg-white dark:bg-black">
            <button
              type="button"
              onClick={() => setInputMode('peso')}
              className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-surface ${
                inputMode === 'peso'
                  ? 'bg-surface text-on-surface shadow-sm border border-surface-variant'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Peso Direto
            </button>
            <button
              type="button"
              onClick={() => setInputMode('biometria')}
              className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 dark:focus-visible:ring-offset-surface ${
                inputMode === 'biometria'
                  ? 'bg-surface text-on-surface shadow-sm border border-surface-variant'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Por Biometria
            </button>
          </div>
        </div>

        {errorMessage && (
          <InfoBalloon variant="error" text={errorMessage} />
        )}
          {/* Gestational Age */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2" title="Idade Gestacional em semanas">
              <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="ga-weeks">
                IG (Semanas)
              </label>
              <input 
                id="ga-weeks"
                type="number"
                min="20"
                max="42"
                required
                value={weeks}
                onChange={(e) => setWeeks(clampValue(e.target.value, 42) as any)}
                className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
              />
            </div>
            <div className="flex flex-col gap-2" title="Idade Gestacional em dias">
              <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="ga-days">
                IG (Dias)
              </label>
              <input 
                id="ga-days"
                type="number"
                min="0"
                max="6"
                required
                value={days}
                onChange={(e) => setDays(clampValue(e.target.value, 6) as any)}
                className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
              />
            </div>
          </div>

          {inputMode === 'peso' ? (
            <div className="flex flex-col gap-2" title="Peso Fetal Estimado (em gramas)">
              <div className="flex flex-col gap-2 mb-1">
                <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="weight-input">
                  Peso Fetal Estimado (PFE / g)
                </label>
                <InfoBalloon 
                  text="Insira o peso fetal estimado (PFE) em gramas."
                  onClick={() => setHelpTopic('weight')}
                />
              </div>
              <input 
                id="weight-input"
                type="number"
                min="100"
                max="6000"
                required
                value={weight}
                onChange={(e) => setWeight(clampValue(e.target.value, 6000) as any)}
                className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <InfoBalloon 
                text="Calculando via Hadlock 4 Biometrias (DBP, CC, CA, FL)"
                onClick={() => setHelpTopic('biometry')}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2" title="Diâmetro Biparietal (DBP). Distância entre os ossos parietais do feto.">
                  <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="bpd-mm">
                    DBP (mm)
                  </label>
                  <input 
                    id="bpd-mm"
                    type="number"
                    min="30"
                    max="110"
                    required
                    value={bpd}
                    onChange={(e) => setBpd(clampValue(e.target.value, 120) as any)}
                    className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2" title="Circunferência Cefálica (CC). Medida do contorno da cabeça fetal.">
                  <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="hc-mm">
                    CC (mm)
                  </label>
                  <input 
                    id="hc-mm"
                    type="number"
                    min="100"
                    max="400"
                    required
                    value={hc}
                    onChange={(e) => setHc(clampValue(e.target.value, 400) as any)}
                    className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2" title="Circunferência Abdominal (CA). Importante indicador do estado nutricional fetal.">
                  <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="ac-mm">
                    CA (mm)
                  </label>
                  <input 
                    id="ac-mm"
                    type="number"
                    min="100"
                    max="450"
                    required
                    value={ac}
                    onChange={(e) => setAc(clampValue(e.target.value, 400) as any)}
                    className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-2" title="Comprimento do Fêmur (CF). Medida do osso da coxa fetal.">
                  <label className="font-body-sm text-secondary font-medium pl-1" htmlFor="fl-mm">
                    Fêmur (mm)
                  </label>
                  <input 
                    id="fl-mm"
                    type="number"
                    min="20"
                    max="95"
                    required
                    value={fl}
                    onChange={(e) => setFl(clampValue(e.target.value, 100) as any)}
                    className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-base text-on-surface"
                  />
                </div>
              </div>

              {/* Display calculated weight dynamically inside form */}
              <div className="bg-surface-variant/30 p-4 rounded-xl flex flex-row justify-between items-center text-xs mt-2 border border-surface-variant">
                <span className="font-bold text-secondary uppercase tracking-wider">Peso Estimado:</span>
                <span className="font-display font-extrabold text-lg text-primary">{weight} g</span>
              </div>
            </div>
          )}

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
            {/* Main Percentile Section */}
            <p className="font-label-caps text-secondary mb-2 uppercase text-center text-balance text-xs">
              Resultado do Percentil Fetal
            </p>
            <span className="text-[10px] md:text-[11px] font-semibold text-primary bg-primary/10 py-1 px-3 rounded-full mb-4 border border-primary/20">
              Curva: {result ? result.curveLabel : (curve === 'hadlock' ? 'Hadlock (EUA)' : 'Barcelona (Europa)')}
            </span>
            <div className="relative flex justify-center items-center mb-4 mt-2">
              <svg viewBox="0 0 200 200" className="w-[120px] h-[120px] md:w-[200px] md:h-[200px] -rotate-90">
                <circle 
                  cx="100" cy="100" r="85"
                  className="stroke-surface-variant fill-none opacity-50"
                  strokeWidth="8"
                />
                {!shimmer && result && (
                  <motion.circle 
                    cx="100" cy="100" r="85"
                    className="stroke-primary fill-none drop-shadow-sm"
                    strokeWidth="10"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 85) - ((result.percentile / 100) * (2 * Math.PI * 85)) }}
                    transition={{ duration: 1.5, ease: "easeOut", type: 'spring', bounce: 0.2 }}
                    style={{ strokeDasharray: 2 * Math.PI * 85 }}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                {shimmer ? (
                  <Skeleton className="w-24 h-[48px] md:h-[64px]" type="dots" />
                ) : result ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="font-title-md text-primary opacity-80 text-2xl md:text-3xl">p</span>
                      <span className="font-display-lg text-[36px] md:text-[64px] leading-none text-primary tracking-tight">
                        {result.percentile}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="font-title-md text-secondary opacity-50 text-2xl md:text-3xl">p</span>
                    <span className="font-display-lg text-[36px] md:text-[64px] leading-none text-secondary opacity-30 tracking-tight">--</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`mt-2 py-3 px-6 rounded-3xl font-sans text-xs font-semibold leading-relaxed text-center w-full max-w-[320px] min-h-[48px] flex items-center justify-center shadow-sm ${result && !shimmer ? result.bgClassColor : 'bg-surface-variant/30 text-secondary border border-surface-variant/50'}`}>
              {shimmer ? (
                <Skeleton className="w-full h-4 rounded-full opacity-50" />
              ) : result ? (
                result.classification
              ) : (
                'Informe os dados ao lado e clique em calcular'
              )}
            </div>

            {/* Detailed clinical indicators, only visible when computed */}
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col gap-4 mt-8 pt-6 border-t border-surface-variant text-left"
              >
                <div className="bg-surface-variant/30 p-4 rounded-xl flex flex-row justify-between items-center text-xs">
                  <span className="font-bold text-secondary uppercase tracking-wide">Peso Fetal Estimado:</span>
                  <span className="font-display font-bold text-lg text-on-surface">{result.efw} g</span>
                </div>

                {/* Curve reference markers */}
                <div className="bg-surface-variant/30 p-4 rounded-xl flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">
                    Valores de Referência ({weeks}s e {days}d)
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-secondary font-semibold uppercase">p3</span>
                      <span className="text-xs font-bold text-error mt-1">{result.p3}g</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-secondary font-semibold uppercase">p10</span>
                      <span className="text-xs font-bold text-warning mt-1">{result.p10}g</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-secondary font-semibold uppercase">p50</span>
                      <span className="text-xs font-bold text-primary mt-1">{result.p50}g</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-secondary font-semibold uppercase">p90</span>
                      <span className="text-xs font-bold text-tertiary mt-1">{result.p90}g</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-secondary font-semibold uppercase">p97</span>
                      <span className="text-xs font-bold text-tertiary mt-1">{result.p97}g</span>
                    </div>
                  </div>
                </div>

                {/* Horizontal sliding gauge/visual representation of weight */}
                <div className="flex flex-col gap-2 bg-surface-variant/30 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">
                    Distribuição de Frequência do Peso
                  </span>
                  <div className="relative w-full h-8 flex items-center bg-surface-variant rounded-xl mt-1 overflow-visible px-4">
                    {/* Percentile Threshold Lines */}
                    <div className="absolute left-[3%] w-0.5 h-4 bg-error/80" title="p3" />
                    <div className="absolute left-[10%] w-0.5 h-4 bg-warning/80" title="p10" />
                    <div className="absolute left-[50%] w-0.5 h-4 bg-primary/80" title="p50" />
                    <div className="absolute left-[90%] w-0.5 h-4 bg-tertiary/80" title="p90" />
                    <div className="absolute left-[97%] w-0.5 h-4 bg-tertiary/80" title="p97" />

                    {/* Marker for Current Fetus */}
                    <motion.div
                      initial={{ left: '0%' }}
                      animate={{ left: `${result.percentile}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 12 }}
                      className="absolute -translate-x-1/2 w-4 h-4 bg-primary border-2 border-white rounded-full shadow-md z-10 flex items-center justify-center"
                      title={`Feto está no Percentil: p${result.percentile}`}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] text-secondary uppercase font-bold px-1 mt-0.5">
                    <span>PIG</span>
                    <span>Adequado (AIG)</span>
                    <span>GIG</span>
                  </div>
                </div>

                {/* Save record */}
                <div className="mt-4 pt-4 border-t border-surface-variant flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-secondary pl-1" htmlFor="pat-name-perc">
                    Salvar no Histórico Local
                  </label>
                  <div className="flex gap-2">
                    <input 
                      id="pat-name-perc"
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
          helpTopic === 'weight' ? 'Peso Fetal Estimado (PFE)' :
          helpTopic === 'biometry' ? 'Cálculo de Peso por Biometria' : ''
        }
      >
        {helpTopic === 'weight' && (
          <div className="space-y-3">
            <p>
              O <strong>Peso Fetal Estimado (PFE)</strong> é avaliado através da ultrassonografia. A avaliação do percentil compara este peso com o esperado para a exata idade gestacional do feto.
            </p>
            <p>
              Percentis extremos (abaixo de p10 ou acima de p90) indicam risco aumentado para complicações perinatais (restrição de crescimento fetal ou macrossomia).
            </p>
          </div>
        )}
        {helpTopic === 'biometry' && (
          <div className="space-y-3">
            <p>
              O sistema calcula automaticamente o peso fetal estimado utilizando a fórmula de Hadlock (4 parâmetros) e, em seguida, classifica no percentil apropriado.
            </p>
            <p>
              A <strong>Circunferência Abdominal (CA)</strong> é o parâmetro isolado mais sensível para detectar alterações no crescimento fetal, pois reflete o tamanho do fígado (armazenamento de glicogênio) e o tecido adiposo subcutâneo do feto.
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
