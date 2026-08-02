import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { HistoryRecord } from '../types';
import { HADLOCK_TABLE, BARCELONA_TABLE, calculatePercentile } from '../data/percentiles';
import Skeleton from "./Skeleton";
import HelpModal from './HelpModal';
import Icon from './Icon';
import { InfoBalloon } from './InfoBalloon';
import { useShortcut } from '../hooks/useShortcut';
import { triggerHaptic } from '../utils/haptics';
import CalculatorActionBar from './CalculatorActionBar';
import { ClinicalNumericInput } from './ClinicalNumericInput';
import { parseNumericDraft, validateNumericRange } from '../utils/numericInput';
import { CLINICAL_INPUT_LIMITS } from '../config/clinicalInputLimits';
import { useFieldNavigation } from '../hooks/useFieldNavigation';

interface PercentileCalculatorProps {
  onSaveRecord: (record: Omit<HistoryRecord, 'id' | 'date'>) => void;
}

type InputMode = 'peso' | 'biometria';
type CurveType = 'hadlock' | 'barcelona';

export default function PercentileCalculator({ onSaveRecord }: PercentileCalculatorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const weeksInputRef = useRef<HTMLInputElement>(null);
  const daysInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const bpdInputRef = useRef<HTMLInputElement>(null);
  const hcInputRef = useRef<HTMLInputElement>(null);
  const acInputRef = useRef<HTMLInputElement>(null);
  const flInputRef = useRef<HTMLInputElement>(null);

  useShortcut('Enter', () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  });

  const { focusNext, focusFirstInvalid } = useFieldNavigation([
    weeksInputRef,
    daysInputRef,
    weightInputRef,
    bpdInputRef,
    hcInputRef,
    acInputRef,
    flInputRef,
  ]);

  const [curve, setCurve] = useState<CurveType>('hadlock');
  const [inputMode, setInputMode] = useState<InputMode>('peso');

  // Gestational Age drafts
  const [weeksInput, setWeeksInput] = useState<string>('');
  const [daysInput, setDaysInput] = useState<string>('0');

  // Direct Weight Draft
  const [directWeightInput, setDirectWeightInput] = useState<string>('');

  // Biometry Drafts (in mm)
  const [bpdInput, setBpdInput] = useState<string>('');
  const [hcInput, setHcInput] = useState<string>('');
  const [acInput, setAcInput] = useState<string>('');
  const [flInput, setFlInput] = useState<string>('');

  // Calculated weight from biometry (kept separate from direct weight)
  const [calculatedEfw, setCalculatedEfw] = useState<number | null>(null);

  const [patientName, setPatientName] = useState<string>('');
  const [shimmer, setShimmer] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
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
    setWeeksInput('');
    setDaysInput('0');
    setDirectWeightInput('');
    setBpdInput('');
    setHcInput('');
    setAcInput('');
    setFlInput('');
    setCalculatedEfw(null);
    setPatientName('');
    setShimmer(false);
    setSaved(false);
    setResult(null);
    setErrorMessage('');
    setFieldErrors({});
    setMobileView('inputs');

    setTimeout(() => {
      if (weeksInputRef.current) {
        weeksInputRef.current.focus();
        weeksInputRef.current.select?.();
      }
    }, 50);
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

  // Calculate biometry-derived EFW
  useEffect(() => {
    if (inputMode === 'biometria') {
      const b = parseNumericDraft(bpdInput);
      const h = parseNumericDraft(hcInput);
      const a = parseNumericDraft(acInput);
      const f = parseNumericDraft(flInput);

      if (b && h && a && f) {
        const bpdCm = b / 10;
        const hcCm = h / 10;
        const acCm = a / 10;
        const flCm = f / 10;

        const logEfw =
          1.3596 -
          0.00386 * acCm * flCm +
          0.0064 * hcCm +
          0.00061 * bpdCm * acCm +
          0.0424 * acCm +
          0.174 * flCm;

        const efwGrams = Math.pow(10, logEfw);
        setCalculatedEfw(Math.round(efwGrams));
      } else {
        setCalculatedEfw(null);
      }
    }
  }, [bpdInput, hcInput, acInput, flInput, inputMode]);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    const newFieldErrors: Record<string, string | undefined> = {};
    const invalidRefs: (HTMLInputElement | null)[] = [];

    const errWeeks = validateNumericRange(weeksInput, {
      required: true,
      min: CLINICAL_INPUT_LIMITS.percentileWeeks.min,
      max: CLINICAL_INPUT_LIMITS.percentileWeeks.max,
      label: 'IG (Semanas)',
      unit: 'semanas',
    });
    if (errWeeks) {
      newFieldErrors['weeks'] = errWeeks;
      invalidRefs.push(weeksInputRef.current);
    }

    const errDays = validateNumericRange(daysInput, {
      required: true,
      min: CLINICAL_INPUT_LIMITS.gestationalDays.min,
      max: CLINICAL_INPUT_LIMITS.gestationalDays.max,
      label: 'IG (Dias)',
      unit: 'dias',
    });
    if (errDays) {
      newFieldErrors['days'] = errDays;
      invalidRefs.push(daysInputRef.current);
    }

    if (inputMode === 'peso') {
      const errWeight = validateNumericRange(directWeightInput, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.fetalWeight.min,
        max: CLINICAL_INPUT_LIMITS.fetalWeight.max,
        label: 'Peso Fetal Estimado',
        unit: 'g',
      });
      if (errWeight) {
        newFieldErrors['weight'] = errWeight;
        invalidRefs.push(weightInputRef.current);
      }
    } else {
      const errBpd = validateNumericRange(bpdInput, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.percentileBpd.min,
        max: CLINICAL_INPUT_LIMITS.percentileBpd.max,
        label: 'DBP',
        unit: 'mm',
      });
      if (errBpd) {
        newFieldErrors['bpd'] = errBpd;
        invalidRefs.push(bpdInputRef.current);
      }

      const errHc = validateNumericRange(hcInput, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.percentileHc.min,
        max: CLINICAL_INPUT_LIMITS.percentileHc.max,
        label: 'CC',
        unit: 'mm',
      });
      if (errHc) {
        newFieldErrors['hc'] = errHc;
        invalidRefs.push(hcInputRef.current);
      }

      const errAc = validateNumericRange(acInput, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.percentileAc.min,
        max: CLINICAL_INPUT_LIMITS.percentileAc.max,
        label: 'CA',
        unit: 'mm',
      });
      if (errAc) {
        newFieldErrors['ac'] = errAc;
        invalidRefs.push(acInputRef.current);
      }

      const errFl = validateNumericRange(flInput, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.percentileFl.min,
        max: CLINICAL_INPUT_LIMITS.percentileFl.max,
        label: 'Fêmur',
        unit: 'mm',
      });
      if (errFl) {
        newFieldErrors['fl'] = errFl;
        invalidRefs.push(flInputRef.current);
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      triggerHaptic([60, 40, 60]);
      focusFirstInvalid(invalidRefs);
      return;
    }

    const w = parseNumericDraft(weeksInput) ?? 0;
    const d = parseNumericDraft(daysInput) ?? 0;
    const weightToUse =
      inputMode === 'peso' ? parseNumericDraft(directWeightInput) : calculatedEfw;

    if (!weightToUse) {
      setErrorMessage('Não foi possível calcular o peso fetal pelas biometrias informadas.');
      triggerHaptic([60, 40, 60]);
      return;
    }

    setShimmer(true);
    setTimeout(() => {
      const decimalWeeks = w + d / 7;
      const table = curve === 'hadlock' ? HADLOCK_TABLE : BARCELONA_TABLE;

      const calcResult = calculatePercentile(table, decimalWeeks, weightToUse);

      if (!calcResult) {
        setErrorMessage('Idade Gestacional fora do intervalo disponível (20 a 42 semanas).');
        triggerHaptic([60, 40, 60]);
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
        efw: weightToUse,
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

      // Close virtual keyboard before displaying result
      (document.activeElement as HTMLElement | null)?.blur();

      setMobileView('results');
      triggerHaptic([25, 40, 25]);
      setSaved(false);
      setShimmer(false);
    }, 600);
  };

  const handleSave = () => {
    if (!result) return;
    triggerHaptic([50, 50]);
    const finalName = patientName.trim() || 'Paciente Sem Nome';

    onSaveRecord({
      patientName: finalName,
      type: 'Peso',
      summary: `Peso: ${result.efw}g (Percentil: p${result.percentile}) • Curva: ${
        curve === 'hadlock' ? 'Hadlock' : 'Barcelona'
      }`,
      details: {
        weeks: parseNumericDraft(weeksInput) ?? undefined,
        days: parseNumericDraft(daysInput) ?? undefined,
        weight: result.efw,
        curve,
        percentile: result.percentile,
        classification: result.classification,
        biometries:
          inputMode === 'biometria'
            ? {
                bpd: parseNumericDraft(bpdInput) ?? undefined,
                hc: parseNumericDraft(hcInput) ?? undefined,
                ac: parseNumericDraft(acInput) ?? undefined,
                fl: parseNumericDraft(flInput) ?? undefined,
              }
            : undefined,
      },
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
          Percentil Fetal
        </h1>
        <p className="font-body-sm text-secondary hidden md:block text-xs min-[1366px]:text-sm">
          Avaliação de crescimento e cálculo de peso fetal estimado
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
          <form
            ref={formRef}
            onSubmit={handleCalculate}
            noValidate
            className="glass-panel calculator-form-panel rounded-[1.25rem] md:rounded-[2rem] flex flex-col justify-start min-[1366px]:justify-between gap-3 sm:gap-4 shadow-xs h-auto min-[1366px]:h-full relative"
          >
            {/* Toggles for curve and input mode */}
            <div className="flex flex-col min-[1366px]:grid min-[1366px]:grid-cols-2 gap-2 w-full mb-1">
              {/* Curve Selector */}
              <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-2 border border-surface-variant shadow-xs bg-white dark:bg-black w-full">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setCurve('hadlock');
                    setResult(null);
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                    curve === 'hadlock'
                      ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Hadlock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setCurve('barcelona');
                    setResult(null);
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                    curve === 'barcelona'
                      ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Barcelona
                </button>
              </div>

              {/* Input Mode Selector */}
              <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-2 border border-surface-variant shadow-xs bg-white dark:bg-black w-full">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setInputMode('peso');
                    setResult(null);
                    setFieldErrors({});
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                    inputMode === 'peso'
                      ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Peso Direto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setInputMode('biometria');
                    setResult(null);
                    setFieldErrors({});
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                    inputMode === 'biometria'
                      ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Biometria
                </button>
              </div>
            </div>

            {errorMessage && <InfoBalloon variant="error" text={errorMessage} />}

            <div className="flex flex-col gap-3 flex-initial md:flex-1 justify-start md:justify-center">
              {/* Gestational Age */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <ClinicalNumericInput
                  ref={weeksInputRef}
                  id="ga-weeks"
                  label="IG (Semanas)"
                  value={weeksInput}
                  onChange={(val) => {
                    setWeeksInput(val);
                    setFieldErrors((prev) => ({ ...prev, weeks: undefined }));
                  }}
                  maxIntegerDigits={CLINICAL_INPUT_LIMITS.percentileWeeks.maxIntegerDigits}
                  decimalPlaces={CLINICAL_INPUT_LIMITS.percentileWeeks.decimalPlaces}
                  unit="semanas"
                  placeholder="Ex.: 28"
                  enterKeyHint="next"
                  onNext={() => focusNext(0)}
                  error={fieldErrors.weeks}
                  title="Idade Gestacional em semanas"
                />

                <ClinicalNumericInput
                  ref={daysInputRef}
                  id="ga-days"
                  label="IG (Dias)"
                  value={daysInput}
                  onChange={(val) => {
                    setDaysInput(val);
                    setFieldErrors((prev) => ({ ...prev, days: undefined }));
                  }}
                  maxIntegerDigits={CLINICAL_INPUT_LIMITS.gestationalDays.maxIntegerDigits}
                  decimalPlaces={CLINICAL_INPUT_LIMITS.gestationalDays.decimalPlaces}
                  unit="dias"
                  placeholder="0"
                  selectAllOnFirstFocus
                  enterKeyHint="next"
                  onNext={() => focusNext(1)}
                  error={fieldErrors.days}
                  title="Idade Gestacional em dias"
                />
              </div>

              {inputMode === 'peso' ? (
                <div className="flex flex-col gap-1.5" title="Peso Fetal Estimado (em gramas)">
                  <div className="flex flex-col gap-1 mb-0.5">
                    <InfoBalloon
                      text="Insira o peso fetal estimado (PFE) em gramas."
                      onClick={() => setHelpTopic('weight')}
                    />
                  </div>
                  <ClinicalNumericInput
                    ref={weightInputRef}
                    id="weight-input"
                    label="Peso Fetal Estimado (PFE)"
                    value={directWeightInput}
                    onChange={(val) => {
                      setDirectWeightInput(val);
                      setFieldErrors((prev) => ({ ...prev, weight: undefined }));
                    }}
                    maxIntegerDigits={CLINICAL_INPUT_LIMITS.fetalWeight.maxIntegerDigits}
                    decimalPlaces={CLINICAL_INPUT_LIMITS.fetalWeight.decimalPlaces}
                    unit="g"
                    placeholder="Ex.: 1200"
                    enterKeyHint="done"
                    onDone={() => handleCalculate()}
                    error={fieldErrors.weight}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <InfoBalloon
                    text="Hadlock 4 Biometrias (DBP, CC, CA, FL)"
                    onClick={() => setHelpTopic('biometry')}
                  />

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <ClinicalNumericInput
                      ref={bpdInputRef}
                      id="bpd-mm"
                      label="DBP"
                      value={bpdInput}
                      onChange={(val) => {
                        setBpdInput(val);
                        setFieldErrors((prev) => ({ ...prev, bpd: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.percentileBpd.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.percentileBpd.decimalPlaces}
                      unit="mm"
                      placeholder="Ex.: 71"
                      enterKeyHint="next"
                      onNext={() => focusNext(3)}
                      error={fieldErrors.bpd}
                      title="Diâmetro Biparietal (DBP)"
                    />

                    <ClinicalNumericInput
                      ref={hcInputRef}
                      id="hc-mm"
                      label="CC"
                      value={hcInput}
                      onChange={(val) => {
                        setHcInput(val);
                        setFieldErrors((prev) => ({ ...prev, hc: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.percentileHc.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.percentileHc.decimalPlaces}
                      unit="mm"
                      placeholder="Ex.: 262"
                      enterKeyHint="next"
                      onNext={() => focusNext(4)}
                      error={fieldErrors.hc}
                      title="Circunferência Cefálica (CC)"
                    />

                    <ClinicalNumericInput
                      ref={acInputRef}
                      id="ac-mm"
                      label="CA"
                      value={acInput}
                      onChange={(val) => {
                        setAcInput(val);
                        setFieldErrors((prev) => ({ ...prev, ac: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.percentileAc.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.percentileAc.decimalPlaces}
                      unit="mm"
                      placeholder="Ex.: 240"
                      enterKeyHint="next"
                      onNext={() => focusNext(5)}
                      error={fieldErrors.ac}
                      title="Circunferência Abdominal (CA)"
                    />

                    <ClinicalNumericInput
                      ref={flInputRef}
                      id="fl-mm"
                      label="Fêmur"
                      value={flInput}
                      onChange={(val) => {
                        setFlInput(val);
                        setFieldErrors((prev) => ({ ...prev, fl: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.percentileFl.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.percentileFl.decimalPlaces}
                      unit="mm"
                      placeholder="Ex.: 54"
                      enterKeyHint="done"
                      onDone={() => handleCalculate()}
                      error={fieldErrors.fl}
                      title="Comprimento do Fêmur"
                    />
                  </div>

                  {/* Display calculated weight dynamically inside form */}
                  <div className="bg-surface-variant/50 dark:bg-surface-variant p-2.5 md:p-3 rounded-xl flex flex-row justify-between items-center text-xs border border-surface-variant">
                    <span className="font-bold text-secondary uppercase tracking-wider">
                      Peso Estimado:
                    </span>
                    <span className="font-display font-extrabold text-base text-primary">
                      {calculatedEfw ? `${calculatedEfw} g` : '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <CalculatorActionBar label="Calcular" />
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
            className={`glass-panel widget-gradient p-4 min-[1024px]:p-6 min-[1366px]:p-8 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center text-center w-full min-h-[300px] md:min-h-[360px] relative overflow-hidden ${
              shimmer ? 'shimmer-active' : ''
            }`}
          >
            <div className="relative z-10 w-full flex flex-col items-center min-w-0">
              <span className="px-3 py-1 bg-surface-variant/80 dark:bg-surface-variant text-secondary rounded-full font-label-caps text-[10px] md:text-xs mb-3 tracking-wider uppercase font-bold border border-surface-variant/50">
                Curva: {result ? result.curveLabel : '--'}
              </span>

              {/* Percentile Big Result */}
              <div className="my-2 flex flex-col items-center">
                <span className="font-label-caps text-secondary text-xs uppercase tracking-widest mb-1">
                  Percentil Fetal
                </span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display-lg text-[40px] md:text-[64px] leading-none text-primary tracking-tight">
                    {shimmer ? (
                      <Skeleton className="w-20 md:w-32 h-10 md:h-16" type="dots" />
                    ) : result ? (
                      `p${result.percentile}`
                    ) : (
                      'p--'
                    )}
                  </span>
                </div>
              </div>

              {/* Classification Badge */}
              <div
                className={`mt-2 py-1.5 px-4 rounded-full font-title-sm text-xs md:text-sm font-bold text-center leading-snug ${
                  result ? result.bgClassColor : 'bg-surface-variant/50 text-secondary'
                }`}
              >
                {shimmer ? (
                  <Skeleton className="w-40 h-5 rounded-full opacity-50 mx-auto" />
                ) : result ? (
                  result.classification
                ) : (
                  'Aguardando Cálculo'
                )}
              </div>

              {/* Details grid & threshold benchmarks */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex flex-col gap-4 mt-6 pt-5 border-t border-surface-variant text-left"
                >
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-surface-variant/40 dark:bg-surface-variant/40 p-2.5 rounded-xl border border-surface-variant/40 flex flex-col">
                      <span className="text-secondary font-bold text-[10px] uppercase">
                        Peso Estimado
                      </span>
                      <span className="font-bold text-on-surface text-sm">{result.efw} g</span>
                    </div>
                    <div className="bg-surface-variant/40 dark:bg-surface-variant/40 p-2.5 rounded-xl border border-surface-variant/40 flex flex-col">
                      <span className="text-secondary font-bold text-[10px] uppercase">
                        Idade Gestacional
                      </span>
                      <span className="font-bold text-on-surface text-sm">
                        {Math.floor(result.decimalWeeks)}s{' '}
                        {Math.round((result.decimalWeeks % 1) * 7)}d
                      </span>
                    </div>
                  </div>

                  {/* Threshold Percentiles Breakdown */}
                  <div className="bg-surface-variant/30 dark:bg-surface-variant/30 p-3 rounded-xl border border-surface-variant/40 flex flex-col gap-2">
                    <span className="text-secondary font-bold text-[10px] uppercase tracking-wider">
                      Valores de Referência da Curva ({result.curveLabel})
                    </span>
                    <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                      <div className="flex flex-col bg-surface-variant/50 p-1.5 rounded-lg">
                        <span className="font-bold text-error">p3</span>
                        <span className="font-medium text-on-surface mt-0.5">{result.p3}g</span>
                      </div>
                      <div className="flex flex-col bg-surface-variant/50 p-1.5 rounded-lg">
                        <span className="font-bold text-warning">p10</span>
                        <span className="font-medium text-on-surface mt-0.5">{result.p10}g</span>
                      </div>
                      <div className="flex flex-col bg-primary/10 p-1.5 rounded-lg border border-primary/20">
                        <span className="font-bold text-primary">p50</span>
                        <span className="font-bold text-primary mt-0.5">{result.p50}g</span>
                      </div>
                      <div className="flex flex-col bg-surface-variant/50 p-1.5 rounded-lg">
                        <span className="font-bold text-tertiary">p90</span>
                        <span className="font-medium text-on-surface mt-0.5">{result.p90}g</span>
                      </div>
                      <div className="flex flex-col bg-surface-variant/50 p-1.5 rounded-lg">
                        <span className="font-bold text-tertiary">p97</span>
                        <span className="font-medium text-on-surface mt-0.5">{result.p97}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Save record */}
                  <div className="pt-2 border-t border-surface-variant flex flex-col gap-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider text-secondary pl-1"
                      htmlFor="pat-name-percentile"
                    >
                      Salvar no Histórico Local
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="pat-name-percentile"
                        type="text"
                        placeholder="Identificação da paciente..."
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
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
          helpTopic === 'weight'
            ? 'Peso Fetal Estimado'
            : helpTopic === 'biometry'
            ? 'Cálculo por Biometria (Hadlock)'
            : ''
        }
      >
        {helpTopic === 'weight' && (
          <div className="space-y-3">
            <p>
              O <strong>Percentil Fetal</strong> avalia se o crescimento do feto está adequado
              para a idade gestacional.
            </p>
            <p>
              Insira o peso obtido na ultrassonografia (em gramas) e a idade gestacional exata.
            </p>
            <p>
              Fetos com percentil abaixo de p10 necessitam de investigação complementar para
              RCF, enquanto percentil acima de p90 sugere fetal macrossômico/GIG.
            </p>
          </div>
        )}
        {helpTopic === 'biometry' && (
          <div className="space-y-3">
            <p>
              A fórmula de <strong>Hadlock 4 parâmetros</strong> (DBP, CC, CA e Fêmur) calcula o
              Peso Fetal Estimado (PFE) em gramas com alta acurácia.
            </p>
            <p>
              Todas as medidas de biometria devem ser inseridas em <strong>milímetros (mm)</strong>.
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
        <Icon
          name="refresh"
          className="text-[24px] group-hover:-rotate-180 transition-transform duration-500"
        />
      </motion.button>
    </div>
  );
}
