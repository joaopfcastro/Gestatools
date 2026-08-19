import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { HistoryRecord } from '../types';
import Skeleton from "./Skeleton";
import HelpModal from './HelpModal';
import Icon from './Icon';
import { InfoBalloon } from './InfoBalloon';
import { useShortcut } from '../hooks/useShortcut';
import { triggerHaptic, hapticSuccess, hapticError, hapticSelection, hapticMedium } from '../utils/haptics';
import CalculatorActionBar from './CalculatorActionBar';
import { ClinicalNumericInput } from './ClinicalNumericInput';
import { parseNumericDraft, validateNumericRange } from '../utils/numericInput';
import { CLINICAL_INPUT_LIMITS } from '../config/clinicalInputLimits';
import { useFieldNavigation } from '../hooks/useFieldNavigation';

interface AfiCalculatorProps {
  onSaveRecord: (record: Omit<HistoryRecord, 'id' | 'date'>) => void;
}

export default function AfiCalculator({ onSaveRecord }: AfiCalculatorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const q1InputRef = useRef<HTMLInputElement>(null);
  const q2InputRef = useRef<HTMLInputElement>(null);
  const q3InputRef = useRef<HTMLInputElement>(null);
  const q4InputRef = useRef<HTMLInputElement>(null);
  const mbvInputRef = useRef<HTMLInputElement>(null);

  useShortcut('Enter', () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  });

  const { focusNext, focusFirstInvalid } = useFieldNavigation([
    q1InputRef,
    q2InputRef,
    q3InputRef,
    q4InputRef,
    mbvInputRef,
  ]);

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

  // String drafts
  const [q1Input, setQ1Input] = useState<string>('');
  const [q2Input, setQ2Input] = useState<string>('');
  const [q3Input, setQ3Input] = useState<string>('');
  const [q4Input, setQ4Input] = useState<string>('');
  const [manualMbvInput, setManualMbvInput] = useState<string>('');

  // Derived MBV for ILA mode (calculated on the fly without overwriting manualMbvInput)
  const q1Val = parseNumericDraft(q1Input);
  const q2Val = parseNumericDraft(q2Input);
  const q3Val = parseNumericDraft(q3Input);
  const q4Val = parseNumericDraft(q4Input);
  const derivedMbv =
    q1Val !== null || q2Val !== null || q3Val !== null || q4Val !== null
      ? Math.max(q1Val ?? 0, q2Val ?? 0, q3Val ?? 0, q4Val ?? 0)
      : 0;

  // Controls
  const [onlyMbv, setOnlyMbv] = useState<boolean>(false);
  const [patientName, setPatientName] = useState<string>('');
  const [shimmer, setShimmer] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
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
    setQ1Input('');
    setQ2Input('');
    setQ3Input('');
    setQ4Input('');
    setManualMbvInput('');
    setOnlyMbv(false);
    setPatientName('');
    setShimmer(false);
    setSaved(false);
    setResult(null);
    setErrorMessage('');
    setFieldErrors({});
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

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    const newFieldErrors: Record<string, string | undefined> = {};
    const invalidRefs: (HTMLInputElement | null)[] = [];

    if (!onlyMbv) {
      const errQ1 = validateNumericRange(q1Input, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.afiQuadrant.min,
        max: CLINICAL_INPUT_LIMITS.afiQuadrant.max,
        label: 'Quadrante 1',
        unit: 'cm',
      });
      if (errQ1) {
        newFieldErrors['q1'] = errQ1;
        invalidRefs.push(q1InputRef.current);
      }

      const errQ2 = validateNumericRange(q2Input, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.afiQuadrant.min,
        max: CLINICAL_INPUT_LIMITS.afiQuadrant.max,
        label: 'Quadrante 2',
        unit: 'cm',
      });
      if (errQ2) {
        newFieldErrors['q2'] = errQ2;
        invalidRefs.push(q2InputRef.current);
      }

      const errQ3 = validateNumericRange(q3Input, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.afiQuadrant.min,
        max: CLINICAL_INPUT_LIMITS.afiQuadrant.max,
        label: 'Quadrante 3',
        unit: 'cm',
      });
      if (errQ3) {
        newFieldErrors['q3'] = errQ3;
        invalidRefs.push(q3InputRef.current);
      }

      const errQ4 = validateNumericRange(q4Input, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.afiQuadrant.min,
        max: CLINICAL_INPUT_LIMITS.afiQuadrant.max,
        label: 'Quadrante 4',
        unit: 'cm',
      });
      if (errQ4) {
        newFieldErrors['q4'] = errQ4;
        invalidRefs.push(q4InputRef.current);
      }
    } else {
      const errMbv = validateNumericRange(manualMbvInput, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.mbv.min,
        max: CLINICAL_INPUT_LIMITS.mbv.max,
        label: 'Maior Bolso Vertical (MBV)',
        unit: 'cm',
      });
      if (errMbv) {
        newFieldErrors['mbv'] = errMbv;
        invalidRefs.push(mbvInputRef.current);
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      hapticError();
      focusFirstInvalid(invalidRefs);
      return;
    }

    setShimmer(true);
    setTimeout(() => {
      let calculatedIla = 0;
      let calculatedMbv = 0;

      if (!onlyMbv) {
        const v1 = parseNumericDraft(q1Input) ?? 0;
        const v2 = parseNumericDraft(q2Input) ?? 0;
        const v3 = parseNumericDraft(q3Input) ?? 0;
        const v4 = parseNumericDraft(q4Input) ?? 0;
        calculatedIla = v1 + v2 + v3 + v4;
        calculatedMbv = derivedMbv;
      } else {
        calculatedMbv = parseNumericDraft(manualMbvInput) ?? 0;
      }

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
        summary,
      });

      // Close keyboard before showing result
      (document.activeElement as HTMLElement | null)?.blur();

      setMobileView('results');
      hapticSuccess();
      setSaved(false);
      setShimmer(false);
    }, 600);
  };

  const handleSave = () => {
    if (!result) return;
    hapticSuccess();
    const finalName = patientName.trim() || 'Paciente Sem Nome';

    onSaveRecord({
      patientName: finalName,
      type: 'ILA',
      summary: result.summary,
      details: {
        onlyMbv,
        q1: !onlyMbv ? parseNumericDraft(q1Input) ?? undefined : undefined,
        q2: !onlyMbv ? parseNumericDraft(q2Input) ?? undefined : undefined,
        q3: !onlyMbv ? parseNumericDraft(q3Input) ?? undefined : undefined,
        q4: !onlyMbv ? parseNumericDraft(q4Input) ?? undefined : undefined,
        ila: !onlyMbv ? result.ilaValue : undefined,
        mbv: result.mbvValue,
        ilaClassification: !onlyMbv ? result.ilaClass : undefined,
        mbvClassification: result.mbvClass,
      },
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setPatientName('');
    }, 2000);
  };

  return (
    <div className="w-full max-w-6xl min-[1366px]:max-w-7xl mx-auto flex flex-col justify-start gap-3 min-[1024px]:gap-5 p-0 sm:p-2 min-[1366px]:p-4 h-auto min-w-0 md:h-full md:min-h-0">
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
        <div className="md:hidden flex p-1 bg-surface-variant/50 dark:bg-surface-variant dark:bg-surface-variant/10 rounded-2xl w-full border border-surface-variant mb-1">
          <button
            type="button"
            onClick={() => {
              hapticSelection();
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
              hapticSelection();
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

      <div className="grid grid-cols-1 md:grid-cols-[minmax(300px,0.88fr)_minmax(0,1.12fr)] min-[1366px]:flex min-[1366px]:flex-row gap-4 md:gap-6 min-[1366px]:gap-10 items-start w-full min-w-0 md:h-full md:min-h-0">
        {/* Left Col: Inputs Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full min-[1366px]:w-[45%] flex flex-col animate-card min-w-0 md:sticky md:top-0 ${
            result && mobileView !== 'inputs' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <form
            ref={formRef}
            onSubmit={handleCalculate}
            noValidate
            className="glass-panel calculator-form-panel rounded-[1.25rem] md:rounded-[2rem] flex flex-col justify-start min-[1366px]:justify-between gap-3 sm:gap-4 shadow-xs h-auto min-[1366px]:h-full relative"
          >
            {/* Evaluation Method Selector */}
            <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-2 w-full border border-surface-variant shadow-xs bg-white dark:bg-black mb-1">
              <button
                type="button"
                onClick={() => {
                  hapticSelection();
                  setOnlyMbv(false);
                  setResult(null);
                  setFieldErrors({});
                  focusInput(false);
                }}
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
                onClick={() => {
                  hapticSelection();
                  setOnlyMbv(true);
                  setResult(null);
                  setFieldErrors({});
                  focusInput(true);
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                  onlyMbv
                    ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Apenas MBV
              </button>
            </div>

            {errorMessage && <InfoBalloon variant="error" text={errorMessage} />}

            <div className="flex flex-col gap-3 flex-initial md:flex-1 justify-start md:justify-center">
              {!onlyMbv ? (
                <div className="flex flex-col gap-3">
                  <InfoBalloon
                    text="Insira o valor vertical de cada quadrante em centímetros (cm)"
                    onClick={() => setHelpTopic('ila')}
                  />

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <ClinicalNumericInput
                      ref={q1InputRef}
                      id="q1-input"
                      label="Quadrante 1"
                      value={q1Input}
                      onChange={(val) => {
                        setQ1Input(val);
                        setFieldErrors((prev) => ({ ...prev, q1: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.afiQuadrant.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.afiQuadrant.decimalPlaces}
                      unit="cm"
                      placeholder="Ex.: 3,5"
                      enterKeyHint="next"
                      onNext={() => focusNext(0)}
                      error={fieldErrors.q1}
                      title="Medida vertical do bolsão no Q1"
                    />

                    <ClinicalNumericInput
                      ref={q2InputRef}
                      id="q2-input"
                      label="Quadrante 2"
                      value={q2Input}
                      onChange={(val) => {
                        setQ2Input(val);
                        setFieldErrors((prev) => ({ ...prev, q2: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.afiQuadrant.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.afiQuadrant.decimalPlaces}
                      unit="cm"
                      placeholder="Ex.: 3,5"
                      enterKeyHint="next"
                      onNext={() => focusNext(1)}
                      error={fieldErrors.q2}
                      title="Medida vertical do bolsão no Q2"
                    />

                    <ClinicalNumericInput
                      ref={q3InputRef}
                      id="q3-input"
                      label="Quadrante 3"
                      value={q3Input}
                      onChange={(val) => {
                        setQ3Input(val);
                        setFieldErrors((prev) => ({ ...prev, q3: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.afiQuadrant.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.afiQuadrant.decimalPlaces}
                      unit="cm"
                      placeholder="Ex.: 3,5"
                      enterKeyHint="next"
                      onNext={() => focusNext(2)}
                      error={fieldErrors.q3}
                      title="Medida vertical do bolsão no Q3"
                    />

                    <ClinicalNumericInput
                      ref={q4InputRef}
                      id="q4-input"
                      label="Quadrante 4"
                      value={q4Input}
                      onChange={(val) => {
                        setQ4Input(val);
                        setFieldErrors((prev) => ({ ...prev, q4: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.afiQuadrant.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.afiQuadrant.decimalPlaces}
                      unit="cm"
                      placeholder="Ex.: 3,5"
                      enterKeyHint="done"
                      onDone={() => handleCalculate()}
                      error={fieldErrors.q4}
                      title="Medida vertical do bolsão no Q4"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <InfoBalloon
                    text="Insira a medida do maior bolsão vertical em centímetros (cm)"
                    onClick={() => setHelpTopic('mbv')}
                  />
                  <ClinicalNumericInput
                    ref={mbvInputRef}
                    id="mbv-input"
                    label="Maior Bolso Vertical - MBV"
                    value={manualMbvInput}
                    onChange={(val) => {
                      setManualMbvInput(val);
                      setFieldErrors((prev) => ({ ...prev, mbv: undefined }));
                    }}
                    maxIntegerDigits={CLINICAL_INPUT_LIMITS.mbv.maxIntegerDigits}
                    decimalPlaces={CLINICAL_INPUT_LIMITS.mbv.decimalPlaces}
                    unit="cm"
                    placeholder="Ex.: 4,5"
                    enterKeyHint="done"
                    onDone={() => handleCalculate()}
                    error={fieldErrors.mbv}
                    title="Maior Bolsão Vertical (MBV)"
                  />
                </div>
              )}
            </div>

            <CalculatorActionBar label="Analisar" />
          </form>
        </motion.div>

        {/* Right Col: Results View */}
        <div
          className={`w-full min-[1366px]:w-[55%] flex flex-col animate-results min-w-0 md:h-full md:min-h-0 ${
            !result || mobileView !== 'results' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className={`glass-panel widget-gradient p-4 md:p-6 min-[1366px]:p-8 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center ${
              result ? 'justify-start' : 'justify-center'
            } text-center w-full min-h-[300px] md:min-h-[360px] md:max-h-[calc(100dvh-9.5rem)] min-[1366px]:max-h-[calc(100dvh-10.5rem)] md:overflow-y-auto overscroll-contain touch-pan-y results-scroll-panel relative ${
              shimmer ? 'shimmer-active' : ''
            }`}
          >
            <div className="relative z-10 w-full flex flex-col items-center min-w-0">
              {/* Main Amniotic Evaluation Section */}
              <p className="font-label-caps text-secondary mb-2 uppercase text-center text-balance text-xs">
                Avaliação do Líquido Amniótico
              </p>

              <div
                className={`grid gap-3 md:gap-4 w-full mt-2 md:mt-4 ${
                  onlyMbv ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2'
                }`}
              >
                {!onlyMbv && (
                  <div className="bg-surface-variant/50 dark:bg-surface-variant rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <span className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest mb-1 z-10">
                      Índice (ILA)
                    </span>
                    <div className="flex items-baseline gap-1 z-10">
                      <span className="font-display-lg text-[28px] md:text-[48px] leading-none text-primary tracking-tight">
                        {shimmer ? (
                          <Skeleton className="w-12 md:w-16 h-8 md:h-10" type="dots" />
                        ) : result ? (
                          result.ilaValue.toFixed(1)
                        ) : (
                          '--'
                        )}
                      </span>
                      <span className="font-title-md text-primary opacity-80 text-base md:text-lg">
                        cm
                      </span>
                    </div>
                    <div
                      className={`mt-3 py-1 px-3 rounded-full text-[9px] md:text-[10px] font-bold text-center leading-tight z-10 ${
                        result
                          ? result.ilaBgColor
                          : 'bg-surface-variant/50 text-secondary'
                      }`}
                    >
                      {shimmer ? (
                        <Skeleton className="w-12 h-3 rounded-full opacity-50 mx-auto" />
                      ) : result ? (
                        result.ilaClass
                      ) : (
                        'Aguardando'
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-surface-variant/50 dark:bg-surface-variant rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center relative overflow-hidden">
                  <span className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest mb-1 z-10">
                    Maior Bolso (MBV)
                  </span>
                  <div className="flex items-baseline gap-1 z-10">
                    <span className="font-display-lg text-[28px] md:text-[48px] leading-none text-tertiary tracking-tight">
                      {shimmer ? (
                        <Skeleton className="w-12 md:w-16 h-8 md:h-10" type="dots" />
                      ) : result ? (
                        result.mbvValue.toFixed(1)
                      ) : (
                        '--'
                      )}
                    </span>
                    <span className="font-title-md text-tertiary opacity-80 text-base md:text-lg">
                      cm
                    </span>
                  </div>
                  <div
                    className={`mt-3 py-1 px-3 rounded-full text-[9px] md:text-[10px] font-bold text-center leading-tight z-10 ${
                      result
                        ? result.mbvBgColor
                        : 'bg-surface-variant/50 text-secondary'
                    }`}
                  >
                    {shimmer ? (
                      <Skeleton className="w-12 h-3 rounded-full opacity-50 mx-auto" />
                    ) : result ? (
                      result.mbvClass
                    ) : (
                      'Aguardando'
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed visual ranges, only visible when computed */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex flex-col gap-4 mt-8 pt-6 border-t border-surface-variant text-left min-w-0"
                >
                  {/* ILA Range Visual Guide */}
                  {!onlyMbv && (
                    <div className="bg-surface-variant/50 dark:bg-surface-variant p-3 md:p-4 rounded-xl flex flex-col gap-2 border border-surface-variant/50">
                      <div className="flex justify-between items-center text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">
                        <span>Posicionamento ILA ({result.ilaValue.toFixed(1)} cm)</span>
                      </div>
                      <div className="relative w-full h-4 bg-surface-variant rounded-full mt-1 overflow-hidden flex">
                        <div
                          className="h-full bg-error/80"
                          style={{ width: '20.8%' }}
                          title="Oligodramnio severo < 5cm"
                        />
                        <div
                          className="h-full bg-warning/70"
                          style={{ width: '12.5%' }}
                          title="Oligodramnio moderado 5-8cm"
                        />
                        <div
                          className="h-full bg-primary/80"
                          style={{ width: '66.7%' }}
                          title="Normal 8-24cm"
                        />
                        {/* Visual Marker */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-primary rounded-full shadow-md z-10 transition-all duration-300"
                          style={{
                            left: `${Math.min(96, (result.ilaValue / 26) * 100)}%`,
                          }}
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
                      <div
                        className="h-full bg-error/80"
                        style={{ width: '20%' }}
                        title="Oligodramnio < 2cm"
                      />
                      <div
                        className="h-full bg-primary/80"
                        style={{ width: '60%' }}
                        title="Normal 2-8cm"
                      />
                      <div
                        className="h-full bg-tertiary/80"
                        style={{ width: '20%' }}
                        title="Polidramnio > 8cm"
                      />
                      {/* Visual Marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-primary rounded-full shadow-md z-10 transition-all duration-300"
                        style={{
                          left: `${Math.min(96, (result.mbvValue / 10) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-secondary uppercase font-bold px-1 mt-0.5">
                      <span>Oligo (&lt;2)</span>
                      <span>Normal (2-8)</span>
                      <span>Polidramnio (&gt;8)</span>
                    </div>
                  </div>

                  {/* Save record */}
                  <div className="mt-4 pt-4 border-t border-surface-variant flex flex-col gap-2.5 text-left w-full min-w-0">
                    <label
                      className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-secondary pl-1"
                      htmlFor="pat-name-afi"
                    >
                      Salvar no Histórico Local
                    </label>
                    <div className="flex gap-2 w-full min-w-0">
                      <input
                        id="pat-name-afi"
                        type="text"
                        placeholder="Identificação da paciente..."
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="ios-input flex-1 min-w-0 h-11 md:h-12 px-3 rounded-xl text-sm md:text-base"
                      />
                      <button
                        type="button"
                        onClick={handleSave}
                        className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 rounded-xl inline-flex items-center justify-center gap-1.5 font-bold text-xs transition-all duration-150 cursor-pointer min-h-[44px] md:min-h-0 ${
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
          helpTopic === 'ila'
            ? 'Índice de Líquido Amniótico (ILA)'
            : helpTopic === 'mbv'
            ? 'Maior Bolso Vertical (MBV)'
            : ''
        }
      >
        {helpTopic === 'ila' && (
          <div className="space-y-3">
            <p>
              O <strong>Índice de Líquido Amniótico (ILA)</strong> é um método
              semiquantitativo de avaliação do volume de líquido amniótico.
            </p>
            <p>
              É obtido dividindo o útero em quatro quadrantes e medindo verticalmente
              o maior bolsão de líquido livre de cordão ou partes fetais em cada um
              deles. A soma das quatro medidas (em cm) resulta no ILA.
            </p>
            <p>Valores normais variam tipicamente entre 8 e 24 cm.</p>
          </div>
        )}
        {helpTopic === 'mbv' && (
          <div className="space-y-3">
            <p>
              O <strong>Maior Bolso Vertical (MBV)</strong>, ou bolsão único mais
              profundo, é uma avaliação do maior bolsão de líquido amniótico vertical
              livre de partes fetais e cordão umbilical.
            </p>
            <p>
              O American College of Obstetricians and Gynecologists (ACOG) recomenda o
              uso do MBV em gestações de alto risco e em gestações múltiplas, pois o
              uso do ILA frequentemente leva a um diagnóstico excessivo de
              oligodrâmnio.
            </p>
            <p>Valores normais de MBV variam entre 2 e 8 cm.</p>
          </div>
        )}
      </HelpModal>

      {/* Floating Action Button for Reset - Only on wide desktop (>= 1366px) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          hapticMedium();
          handleReset();
        }}
        className="hidden min-[1366px]:flex fixed bottom-10 right-10 bg-surface text-on-surface shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:bg-surface-variant transition-colors p-4 rounded-full items-center justify-center border border-surface-variant/50 z-40 group"
        title="Zerar formulário"
      >
        <Icon
          name="refresh"
          className="text-[24px] group-hover:-rotate-180 transition-transform duration-500"
        />
      </motion.button>
    </div>
  );
}
