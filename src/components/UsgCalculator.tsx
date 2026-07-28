import React, { useState, useRef, useEffect } from 'react';
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
import { triggerHaptic } from '../utils/haptics';

interface UsgCalculatorProps {
  onSaveRecord: (record: Omit<HistoryRecord, 'id' | 'date'>) => void;
}

type UsgCalcMode = 'report' | 'biometry_1t' | 'biometry_23t';

export default function UsgCalculator({ onSaveRecord }: UsgCalculatorProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useShortcut('Enter', () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);
  };

  const [calcMode, setCalcMode] = useState<UsgCalcMode>('report');
  
  // Mode 1: Report inputs
  const [reportWeeks, setReportWeeks] = useState<number | "">(12);
  const [reportDays, setReportDays] = useState<number | "">(0);
  
  // Mode 2: Biometry 1T inputs
  const [ccn, setCcn] = useState<number | "">(0);
  
  // Mode 3: Biometry 2T/3T inputs
  const [bpd, setBpd] = useState<number | "">(0);
  const [hc, setHc] = useState<number | "">(0);
  const [ac, setAc] = useState<number | "">(0);
  const [fl, setFl] = useState<number | "">(0);

  // Common inputs
  const [examDate, setExamDate] = useState<string>('');
  const [refDate, setRefDate] = useState<string>(getTodayFormatted());
  const [patientName, setPatientName] = useState<string>('');
  const [mobileView, setMobileView] = useState<'inputs' | 'results'>('inputs');
  
  // UI States
  const [shimmer, setShimmer] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reactive Validation
  useEffect(() => {
    let err = null;
    if (examDate.length === 10) {
      err = validateDateStr(examDate, { noFuture: true });
    }
    if (!err && refDate.length === 10) {
      err = validateDateStr(refDate);
      if (!err && examDate.length === 10) {
        const examObj = parseDateString(examDate);
        const refObj = parseDateString(refDate);
        if (examObj && refObj && refObj < examObj) {
          err = 'A data de referência não pode ser anterior à data do exame.';
        }
      }
    }
    setErrorMessage(err || '');
  }, [examDate, refDate]);

  // Help modal state
  const [helpTopic, setHelpTopic] = useState<'ccn' | 'hadlock' | null>(null);

  // Results state
  const [result, setResult] = useState<{
    weeksAtExam: number;
    daysAtExam: number;
    currentWeeks: number;
    currentDays: number;
    estimatedDum: string;
    estimatedDpp: string;
    estimatedDumDate: Date;
    totalDays: number;
    methodDescription: string;
    parametersUsed?: string[];
  } | null>(null);

  const handleReset = () => {
    setCalcMode('report');
    setReportWeeks(12);
    setReportDays(0);
    setCcn(0);
    setBpd(0);
    setHc(0);
    setAc(0);
    setFl(0);
    setExamDate('');
    setRefDate(getTodayFormatted());
    setPatientName('');
    setShimmer(false);
    setSaved(false);
    setErrorMessage('');
    setResult(null);
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

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (errorMessage) {
      triggerHaptic([60, 40, 60]);
      return;
    }

    if (!examDate || examDate.length !== 10) {
      setErrorMessage('Por favor, informe a data do exame de ultrassom.');
      triggerHaptic([60, 40, 60]);
      return;
    }

    const examDateObj = parseDateString(examDate);
    if (!examDateObj) {
      setErrorMessage('A data do exame é inválida.');
      triggerHaptic([60, 40, 60]);
      return;
    }

    const refDateObj = parseDateString(refDate);
    if (!refDateObj) {
      setErrorMessage('A data de referência é inválida.');
      triggerHaptic([60, 40, 60]);
      return;
    }

    if (examDateObj > new Date()) {
      setErrorMessage('A data do exame não pode ser uma data futura.');
      triggerHaptic([60, 40, 60]);
      return;
    }

    if (refDateObj < examDateObj) {
      setErrorMessage('A data de referência não pode ser anterior à data do exame.');
      triggerHaptic([60, 40, 60]);
      return;
    }

    let gaAtExamDays = 0;
    let methodDescription = '';
    let parametersUsed: string[] = [];

    // 1. Calculate GA at exam based on the chosen mode
    if (calcMode === 'report') {
      const w = Number(reportWeeks);
      const d = Number(reportDays);
      if (reportWeeks === '' || w < 3 || w > 42) {
        setErrorMessage('A IG (Semanas) deve estar entre 3 e 42.');
        triggerHaptic([60, 40, 60]);
        return;
      }
      if (reportDays === '' || d < 0 || d > 6) {
        setErrorMessage('A IG (Dias) deve estar entre 0 e 6.');
        triggerHaptic([60, 40, 60]);
        return;
      }
      gaAtExamDays = w * 7 + d;
      methodDescription = `IG informada no laudo: ${w}s ${d}d`;
    } else if (calcMode === 'biometry_1t') {
      if (!ccn || ccn < 10 || ccn > 84) {
        setErrorMessage('CCN fora da faixa validada para esta fórmula (10–84 mm).');
        triggerHaptic([60, 40, 60]);
        return;
      }
      // Robinson & Fleming Formula (1975)
      // IG (dias) = 8.052 * sqrt(CCN) + 23.73
      gaAtExamDays = Math.round(8.052 * Math.sqrt(ccn) + 23.73);
      methodDescription = `Estimado por CCN (Fórmula Robinson & Fleming)`;
      parametersUsed.push(`CCN (${ccn} mm)`);
    } else if (calcMode === 'biometry_23t') {
      const activeAges: number[] = [];
      
      // Hadlock Formulas (Measurements in mm converted to cm)
      if (bpd > 0) {
        const bpdCm = bpd / 10;
        const bpdWeeks = 9.57 + 0.424 * bpdCm + 0.0022 * bpdCm * bpdCm;
        activeAges.push(bpdWeeks);
        parametersUsed.push(`DBP (${bpd} mm)`);
      }

      if (hc > 0) {
        const hcCm = hc / 10;
        const hcWeeks = 8.96 + 0.54 * hcCm + 0.0003 * hcCm * hcCm * hcCm;
        activeAges.push(hcWeeks);
        parametersUsed.push(`CC (${hc} mm)`);
      }

      if (ac > 0) {
        const acCm = ac / 10;
        const acWeeks = 8.14 + 0.753 * acCm - 0.0036 * acCm * acCm;
        activeAges.push(acWeeks);
        parametersUsed.push(`CA (${ac} mm)`);
      }

      if (fl > 0) {
        const flCm = fl / 10;
        const flWeeks = 10.35 + 2.46 * flCm + 0.17 * flCm * flCm;
        activeAges.push(flWeeks);
        parametersUsed.push(`Fêmur (${fl} mm)`);
      }

      if (activeAges.length === 0) {
        setErrorMessage('Informe ao menos uma medida biométrica (DBP, CC, CA ou Fêmur).');
        triggerHaptic([60, 40, 60]);
        return;
      }

      // Calculate average gestational age at exam in weeks
      const averageWeeksDecimal = activeAges.reduce((a, b) => a + b, 0) / activeAges.length;
      gaAtExamDays = Math.round(averageWeeksDecimal * 7);
      methodDescription = `Média de Hadlock (2º/3º Trimestre)`;
    }

    setShimmer(true); setTimeout(() => {

    // 2. Calculate day difference between reference date and exam date
    const diffTime = refDateObj.getTime() - examDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 3. Current Gestational Age
    const currentGaDays = gaAtExamDays + diffDays;
    const currentWeeks = Math.floor(currentGaDays / 7);
    const currentDays = currentGaDays % 7;

    // 4. Estimated DUM (Adjusted LMP) by USG: Exam Date - GA at exam in days
    const estimatedDumObj = new Date(examDateObj.getTime() - gaAtExamDays * 24 * 60 * 60 * 1000);
    // 5. Estimated DPP by USG: Estimated DUM + 280 days
    const estimatedDppObj = new Date(estimatedDumObj.getTime() + 280 * 24 * 60 * 60 * 1000);

    const formatDateStr = (d: Date) => {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    setResult({
      weeksAtExam: Math.floor(gaAtExamDays / 7),
      daysAtExam: gaAtExamDays % 7,
      currentWeeks,
      currentDays,
      estimatedDum: formatDateStr(estimatedDumObj),
      estimatedDpp: formatDateStr(estimatedDppObj),
      estimatedDumDate: estimatedDumObj,
      totalDays: currentGaDays,
      methodDescription,
      parametersUsed,
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
      type: 'USG',
      summary: `USG (${result.currentWeeks}s ${result.currentDays}d) • DUM Ajustada: ${result.estimatedDum} • DPP: ${result.estimatedDpp}`,
      details: {
        calcMode,
        reportWeeks: calcMode === 'report' ? reportWeeks : undefined,
        reportDays: calcMode === 'report' ? reportDays : undefined,
        ccn: calcMode === 'biometry_1t' ? ccn : undefined,
        bpd: calcMode === 'biometry_23t' && bpd > 0 ? bpd : undefined,
        hc: calcMode === 'biometry_23t' && hc > 0 ? hc : undefined,
        ac: calcMode === 'biometry_23t' && ac > 0 ? ac : undefined,
        fl: calcMode === 'biometry_23t' && fl > 0 ? fl : undefined,
        examDate,
        refDate,
        weeksAtExam: result.weeksAtExam,
        daysAtExam: result.daysAtExam,
        currentWeeks: result.currentWeeks,
        currentDays: result.currentDays,
        estimatedDum: result.estimatedDum,
        estimatedDpp: result.estimatedDpp,
      }
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setPatientName('');
    }, 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col justify-between gap-2 md:gap-6 p-0.5 sm:p-4 md:p-8 h-full">
      <div className="px-1 w-full">
        <h1 className="text-xl md:text-3xl font-bold text-on-surface leading-tight md:mb-1">
          Idade Gestacional USG
        </h1>
        <p className="font-body-sm text-secondary hidden md:block">
          Datação obstétrica profissional baseada em ultrassonografia
        </p>
      </div>

      {/* Mobile Segmented Control */}
      {result && (
        <div className="lg:hidden flex p-1 bg-surface-variant/50 dark:bg-surface-variant dark:bg-surface-variant/10 rounded-2xl w-full border border-surface-variant mb-1">
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

      <div className="flex flex-col lg:flex-row gap-3 lg:gap-12 items-stretch w-full flex-initial md:flex-1 md:min-h-0">
        {/* Left Col: Inputs Form */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full lg:w-[45%] flex flex-col flex-initial md:flex-1 animate-card ${
            result && mobileView !== 'inputs' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <form ref={formRef} onSubmit={handleCalculate} noValidate className="glass-panel p-3.5 sm:p-6 md:p-8 rounded-[1.25rem] md:rounded-[2rem] flex flex-col justify-start md:justify-between flex-initial md:flex-1 gap-3 sm:gap-4 md:gap-5 shadow-xs h-auto md:h-full relative pb-24 md:pb-8">
            {/* Calculation Mode Tabs */}
            <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-3 w-full border border-surface-variant shadow-xs bg-white dark:bg-black mb-1">
              <button
                type="button"
                onClick={() => { triggerHaptic(15); setCalcMode('report'); setResult(null); setErrorMessage(''); }}
                className={`py-2.5 md:py-2 px-1 sm:px-2 text-[11px] sm:text-xs md:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] md:min-h-0 flex items-center justify-center text-center text-nowrap ${
                  calcMode === 'report'
                    ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Laudo USG
              </button>
              <button
                type="button"
                onClick={() => { triggerHaptic(15); setCalcMode('biometry_1t'); setResult(null); setErrorMessage(''); }}
                className={`py-2.5 md:py-2 px-1 sm:px-2 text-[11px] sm:text-xs md:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] md:min-h-0 flex items-center justify-center text-center text-nowrap ${
                  calcMode === 'biometry_1t'
                    ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                CCN (Medida)
              </button>
              <button
                type="button"
                onClick={() => { triggerHaptic(15); setCalcMode('biometry_23t'); setResult(null); setErrorMessage(''); }}
                className={`py-2.5 md:py-2 px-1 sm:px-2 text-[11px] sm:text-xs md:text-sm font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] md:min-h-0 flex items-center justify-center text-center text-nowrap ${
                  calcMode === 'biometry_23t'
                    ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Hadlock
              </button>
            </div>

            {errorMessage && (
              <InfoBalloon variant="error" text={errorMessage} />
            )}

            <div className="flex flex-col gap-3 flex-initial md:flex-1 justify-start md:justify-center">
              {calcMode === 'report' && (
                <div className="flex flex-col gap-3">
                  <InfoBalloon 
                    text="Use a IG descrita no laudo do USG e a data do exame."
                  />
                  
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="flex flex-col gap-1.5" title="Idade gestacional estimada descrita no laudo do exame de ultrassom.">
                      <label className="text-sm font-semibold text-on-surface pl-0.5" htmlFor="report-weeks">
                        IG (Semanas)
                      </label>
                      <input 
                        id="report-weeks"
                        type="number"
                        min="3"
                        max="42"
                        required
                        enterKeyHint="next"
                        value={reportWeeks}
                        onChange={(e) => setReportWeeks(clampValue(e.target.value, 42) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5" title="Dias complementares à idade gestacional.">
                      <label className="text-sm font-semibold text-on-surface pl-0.5" htmlFor="report-days">
                        IG (Dias)
                      </label>
                      <input 
                        id="report-days"
                        type="number"
                        min="0"
                        max="6"
                        required
                        enterKeyHint="next"
                        value={reportDays}
                        onChange={(e) => setReportDays(clampValue(e.target.value, 6) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>
                  </div>
                </div>
              )}

              {calcMode === 'biometry_1t' && (
                <div className="flex flex-col gap-1.5" title="Comprimento Cabeça-Nádega. Melhor parâmetro para datar gestação no 1º trimestre (até 84mm).">
                  <div className="flex flex-col gap-1 mb-0.5">
                    <div className="flex justify-between items-center pl-0.5 pr-0.5">
                      <label className="text-sm font-semibold text-on-surface" htmlFor="ccn-input">
                        Comprimento Cabeça-Nádega (CCN)
                      </label>
                      <span className="text-xs font-semibold text-secondary">10 a 84 mm</span>
                    </div>
                    <InfoBalloon 
                      text="Insira o comprimento cabeça-nádega em milímetros (mm)."
                      onClick={() => setHelpTopic('ccn')}
                    />
                  </div>
                  <input 
                    id="ccn-input"
                    type="number"
                    min="1"
                    max="150"
                    step="0.1"
                    required
                    enterKeyHint="next"
                    placeholder="Ex: 45 mm"
                    value={ccn || ''}
                    onChange={(e) => setCcn(clampValue(e.target.value, 150, true) as any)}
                    onFocus={handleFocus}
                    className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                  />
                </div>
              )}

              {calcMode === 'biometry_23t' && (
                <div className="flex flex-col gap-2.5">
                  <InfoBalloon 
                    text="Insira medidas em milímetros (mm)."
                    onClick={() => setHelpTopic('hadlock')}
                  />

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="flex flex-col gap-1" title="Diâmetro Biparietal (DBP).">
                      <label className="text-xs font-semibold text-on-surface pl-0.5" htmlFor="bpd-input">
                        DBP (mm)
                      </label>
                      <input 
                        id="bpd-input"
                        type="number"
                        min="0"
                        max="120"
                        enterKeyHint="next"
                        placeholder="Ex: 54"
                        value={bpd || ''}
                        onChange={(e) => setBpd(clampValue(e.target.value, 120, true) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>

                    <div className="flex flex-col gap-1" title="Circunferência Cefálica (CC).">
                      <label className="text-xs font-semibold text-on-surface pl-0.5" htmlFor="hc-input">
                        CC (mm)
                      </label>
                      <input 
                        id="hc-input"
                        type="number"
                        min="0"
                        max="400"
                        enterKeyHint="next"
                        placeholder="Ex: 210"
                        value={hc || ''}
                        onChange={(e) => setHc(clampValue(e.target.value, 400, true) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>

                    <div className="flex flex-col gap-1" title="Circunferência Abdominal (CA).">
                      <label className="text-xs font-semibold text-on-surface pl-0.5" htmlFor="ac-input">
                        CA (mm)
                      </label>
                      <input 
                        id="ac-input"
                        type="number"
                        min="0"
                        max="400"
                        enterKeyHint="next"
                        placeholder="Ex: 195"
                        value={ac || ''}
                        onChange={(e) => setAc(clampValue(e.target.value, 400, true) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>

                    <div className="flex flex-col gap-1" title="Comprimento do Fêmur (CF).">
                      <label className="text-xs font-semibold text-on-surface pl-0.5" htmlFor="fl-input">
                        Fêmur (mm)
                      </label>
                      <input 
                        id="fl-input"
                        type="number"
                        min="0"
                        max="100"
                        enterKeyHint="next"
                        placeholder="Ex: 42"
                        value={fl || ''}
                        onChange={(e) => setFl(clampValue(e.target.value, 100, true) as any)}
                        onFocus={handleFocus}
                        className="ios-input w-full h-11 md:h-12 px-3 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-0.5" htmlFor="exam-date">
                Data de Realização do USG
              </label>
              <DateInput
                id="exam-date"
                required
                enterKeyHint="next"
                value={examDate}
                onChange={setExamDate}
                onFocus={handleFocus}
                className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface pl-0.5" htmlFor="ref-date">
                Data de Referência (Hoje)
              </label>
              <DateInput
                id="ref-date"
                required
                enterKeyHint="done"
                value={refDate}
                onChange={setRefDate}
                onFocus={handleFocus}
                className="ios-input w-full h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
              />
            </div>

            <div className="botao-calcular-container sticky bottom-0 md:static z-30 pt-3 pb-2 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 -mb-3.5 sm:-mb-6 mt-4 md:m-0 md:p-0 backdrop-blur-md bg-white/95 dark:bg-[#1C1C1E]/95 border-t border-black/5 dark:border-white/10 md:border-none md:bg-transparent md:backdrop-blur-none shadow-lg md:shadow-none transition-all rounded-b-[1.25rem] md:rounded-none">
              <button
                type="submit"
                id="botao-calcular"
                className="calc-btn h-12 md:h-12 min-h-[48px] w-full bg-primary hover:bg-primary/90 text-white font-bold text-[17px] md:text-[18px] rounded-xl shadow-md shadow-primary/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Icon name="calculate" className="text-[22px]" />
                Calcular
              </button>
            </div>
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
            className={`glass-panel widget-gradient p-3 md:p-10 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center text-center w-full min-h-[300px] md:min-h-[380px] relative overflow-hidden  ${shimmer ? 'shimmer-active' : ''}`}
          >
            <div className="relative z-10 w-full flex flex-col items-center">
              {/* Main IG Section */}
              <div className="relative flex justify-center items-center mb-2 md:mb-4 mt-1 md:mt-2">
                <svg viewBox="0 0 220 220" className="w-[120px] h-[120px] md:w-[220px] md:h-[220px] -rotate-90">
                  <circle 
                    cx="110" cy="110" r="95"
                    className="stroke-surface-variant fill-none dark:opacity-100 opacity-50"
                    strokeWidth="6"
                  />
                  {!shimmer && result && (
                    <motion.circle 
                      cx="110" cy="110" r="95"
                      className="stroke-primary fill-none drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(10,132,255,0.4)]"
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
                          {result.currentWeeks < 0 ? '--' : result.currentWeeks}
                        </span>
                        <span className="font-title-md text-primary opacity-80 text-lg md:text-xl">s</span>
                        <span className="font-display-lg text-[24px] md:text-[40px] leading-none text-tertiary tracking-tight ml-1">
                          {result.currentWeeks < 0 ? '--' : result.currentDays}
                        </span>
                        <span className="font-title-md text-tertiary opacity-80 text-lg md:text-xl">d</span>
                      </div>
                      <span className="text-[7px] md:text-[10px] font-bold text-secondary uppercase tracking-wider md:tracking-widest mt-1 md:mt-2 text-center max-w-[90px] md:max-w-none leading-tight">Idade Gestacional</span>
                    </>
                  ) : (
                    <span className="font-display-lg text-[32px] md:text-[56px] leading-none text-secondary opacity-50">--</span>
                  )}
                </div>
              </div>

              <div className="bg-surface-variant/50 dark:bg-surface-variant rounded-2xl md:rounded-3xl px-4 md:px-8 py-2 md:py-5 flex flex-col items-center border border-surface-variant/50 dark:border-transparent w-full max-w-[280px] md:max-w-[320px] shadow-sm mb-2 md:mb-4">
                <p className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
                  Data Provável do Parto
                </p>
                <span className="font-headline-lg text-xl md:text-[28px] font-semibold text-on-surface tracking-tight">
                  {shimmer ? (
                    <Skeleton className="w-32 md:w-40 h-[24px] md:h-[32px] rounded-lg mt-1" />
                  ) : result ? (
                    result.estimatedDpp
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
                className="w-full flex flex-col gap-4 mt-8 pt-6 border-t border-surface-variant text-left"
              >
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="flex flex-col gap-1 bg-surface-variant/50 dark:bg-surface-variant p-3 md:p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">DUM Ajustada</span>
                    <span className="text-sm font-semibold text-on-surface break-words leading-snug">{result.estimatedDum}</span>
                  </div>
                  <div className="flex flex-col gap-1 bg-surface-variant/50 dark:bg-surface-variant p-3 md:p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">IG no Exame</span>
                    <span className="text-xs font-semibold text-on-surface break-words leading-snug">{result.weeksAtExam}s {result.daysAtExam}d</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 bg-surface-variant/50 dark:bg-surface-variant p-3 md:p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">Método</span>
                  <span className="text-xs font-semibold text-on-surface break-words leading-snug">
                    {result.methodDescription}
                  </span>
                  {result.parametersUsed && result.parametersUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.parametersUsed.map((param, index) => (
                        <span key={`${param}-${index}`} className="text-[10px] bg-primary/10 text-primary font-bold py-1 px-2 rounded-lg">
                          {param}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <GestationalMilestones dumDate={result.estimatedDumDate} currentDays={result.totalDays} />

                {/* Save record */}
                <div className="mt-4 pt-4 border-t border-surface-variant flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-secondary pl-1" htmlFor="pat-name">
                    Salvar no Histórico Local
                  </label>
                  <div className="flex gap-2">
                    <input 
                      id="pat-name"
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
          helpTopic === 'ccn' ? 'Comprimento Cabeça-Nádega (CCN)' :
          helpTopic === 'hadlock' ? 'Biometria Fetal (Hadlock)' : ''
        }
      >
        {helpTopic === 'ccn' && (
          <div className="space-y-3">
            <p>
              O <strong>Comprimento Cabeça-Nádega (CCN)</strong> é a medida mais precisa para estabelecer a idade gestacional no primeiro trimestre.
            </p>
            <p>
              A medida deve ser obtida em um corte sagital médio verdadeiro do feto, em posição neutra. É validada e mais confiável entre 10 mm e 84 mm (aproximadamente 7 a 14 semanas).
            </p>
          </div>
        )}
        {helpTopic === 'hadlock' && (
          <div className="space-y-3">
            <p>
              Após o primeiro trimestre, a datação é feita através da biometria fetal múltipla, combinando medidas para maior precisão (fórmula de Hadlock).
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>DBP (Diâmetro Biparietal):</strong> Medida da cabeça fetal de um lado ao outro.</li>
              <li><strong>CC (Circunferência Cefálica):</strong> Medida do contorno da cabeça fetal.</li>
              <li><strong>CA (Circunferência Abdominal):</strong> Medida do abdome fetal, muito sensível ao crescimento e nutrição.</li>
              <li><strong>Fêmur:</strong> Medida do osso da coxa fetal, reflete o crescimento longitudinal.</li>
            </ul>
          </div>
        )}
      </HelpModal>

      {/* Floating Action Button for Reset */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          triggerHaptic(50);
          handleReset();
        }}
        className="hidden md:flex fixed bottom-24 md:bottom-10 right-6 md:right-10 bg-surface text-on-surface shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:bg-surface-variant transition-colors p-4 rounded-full items-center justify-center border border-surface-variant/50 z-40 group"
        title="Zerar formulário"
      >
        <Icon name="refresh" className="text-[24px] group-hover:-rotate-180 transition-transform duration-500" />
      </motion.button>
    </div>
  );
}
