import React, { useState, useRef, useEffect } from 'react';
import { parseDateString, getTodayFormatted, validateDateStr } from '../utils/validation';
import { motion } from 'motion/react';
import { HistoryRecord } from '../types';
import Skeleton from "./Skeleton";
import HelpModal from './HelpModal';
import Icon from './Icon';
import { InfoBalloon } from './InfoBalloon';
import { useShortcut } from '../hooks/useShortcut';
import DateInput from './DateInput';
import GestationalMilestones from './GestationalMilestones';
import { triggerHaptic, hapticSuccess, hapticError, hapticSelection, hapticMedium } from '../utils/haptics';
import CalculatorActionBar from './CalculatorActionBar';
import { ClinicalNumericInput } from './ClinicalNumericInput';
import { parseNumericDraft, validateNumericRange } from '../utils/numericInput';
import { CLINICAL_INPUT_LIMITS } from '../config/clinicalInputLimits';
import { useFieldNavigation } from '../hooks/useFieldNavigation';

interface UsgCalculatorProps {
  onSaveRecord: (record: Omit<HistoryRecord, 'id' | 'date'>) => void;
}

type UsgCalcMode = 'report' | 'biometry_1t' | 'biometry_23t';

export default function UsgCalculator({ onSaveRecord }: UsgCalculatorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const reportWeeksInputRef = useRef<HTMLInputElement>(null);
  const reportDaysInputRef = useRef<HTMLInputElement>(null);
  const ccnInputRef = useRef<HTMLInputElement>(null);
  const bpdInputRef = useRef<HTMLInputElement>(null);
  const hcInputRef = useRef<HTMLInputElement>(null);
  const acInputRef = useRef<HTMLInputElement>(null);
  const flInputRef = useRef<HTMLInputElement>(null);
  const examDateRef = useRef<HTMLInputElement>(null);
  const refDateRef = useRef<HTMLInputElement>(null);

  useShortcut('Enter', () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  });

  const { focusNext, focusFirstInvalid } = useFieldNavigation([
    reportWeeksInputRef,
    reportDaysInputRef,
    ccnInputRef,
    bpdInputRef,
    hcInputRef,
    acInputRef,
    flInputRef,
    examDateRef,
    refDateRef,
  ]);

  const [calcMode, setCalcMode] = useState<UsgCalcMode>('report');

  const focusCurrentInput = (targetMode: UsgCalcMode = calcMode) => {
    setTimeout(() => {
      if (targetMode === 'report' && reportWeeksInputRef.current) {
        reportWeeksInputRef.current.focus();
        reportWeeksInputRef.current.select?.();
      } else if (targetMode === 'biometry_1t' && ccnInputRef.current) {
        ccnInputRef.current.focus();
        ccnInputRef.current.select?.();
      } else if (targetMode === 'biometry_23t' && bpdInputRef.current) {
        bpdInputRef.current.focus();
        bpdInputRef.current.select?.();
      }
    }, 50);
  };

  // Mode 1: Report inputs (string drafts)
  const [reportWeeksInput, setReportWeeksInput] = useState<string>('');
  const [reportDaysInput, setReportDaysInput] = useState<string>('0');

  // Mode 2: Biometry 1T input
  const [ccnInput, setCcnInput] = useState<string>('');

  // Mode 3: Biometry 2T/3T inputs
  const [bpdInput, setBpdInput] = useState<string>('');
  const [hcInput, setHcInput] = useState<string>('');
  const [acInput, setAcInput] = useState<string>('');
  const [flInput, setFlInput] = useState<string>('');

  // Common inputs
  const [examDate, setExamDate] = useState<string>('');
  const [refDate, setRefDate] = useState<string>(getTodayFormatted());
  const [patientName, setPatientName] = useState<string>('');
  const [mobileView, setMobileView] = useState<'inputs' | 'results'>('inputs');

  // UI States
  const [shimmer, setShimmer] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  // Auto-advance for Mode 1
  const handleReportWeeksChange = (val: string) => {
    setReportWeeksInput(val);
    setFieldErrors((prev) => ({ ...prev, reportWeeks: undefined }));
    if (val.length === 2) {
      const num = parseNumericDraft(val);
      if (num !== null && num >= 3 && num <= 42) {
        reportDaysInputRef.current?.focus();
        reportDaysInputRef.current?.select?.();
      }
    }
  };

  const handleReportDaysChange = (val: string) => {
    setReportDaysInput(val);
    setFieldErrors((prev) => ({ ...prev, reportDays: undefined }));
    if (val.length === 1) {
      const num = parseNumericDraft(val);
      if (num !== null && num >= 0 && num <= 6) {
        examDateRef.current?.focus();
      }
    }
  };

  // Reactive Validation for dates
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
    setReportWeeksInput('');
    setReportDaysInput('0');
    setCcnInput('');
    setBpdInput('');
    setHcInput('');
    setAcInput('');
    setFlInput('');
    setExamDate('');
    setRefDate(getTodayFormatted());
    setPatientName('');
    setShimmer(false);
    setSaved(false);
    setErrorMessage('');
    setFieldErrors({});
    setResult(null);
    setMobileView('inputs');
    focusCurrentInput('report');
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

    // Validate numeric fields based on active calcMode
    if (calcMode === 'report') {
      const errW = validateNumericRange(reportWeeksInput, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.usgReportWeeks.min,
        max: CLINICAL_INPUT_LIMITS.usgReportWeeks.max,
        label: 'IG (Semanas)',
        unit: 'semanas',
      });
      if (errW) {
        newFieldErrors['reportWeeks'] = errW;
        invalidRefs.push(reportWeeksInputRef.current);
      }

      const errD = validateNumericRange(reportDaysInput, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.gestationalDays.min,
        max: CLINICAL_INPUT_LIMITS.gestationalDays.max,
        label: 'IG (Dias)',
        unit: 'dias',
      });
      if (errD) {
        newFieldErrors['reportDays'] = errD;
        invalidRefs.push(reportDaysInputRef.current);
      }
    } else if (calcMode === 'biometry_1t') {
      const errCcn = validateNumericRange(ccnInput, {
        required: true,
        min: CLINICAL_INPUT_LIMITS.ccn.min,
        max: CLINICAL_INPUT_LIMITS.ccn.max,
        label: 'CCN',
        unit: 'mm',
      });
      if (errCcn) {
        newFieldErrors['ccn'] = errCcn;
        invalidRefs.push(ccnInputRef.current);
      }
    } else if (calcMode === 'biometry_23t') {
      const bpdVal = parseNumericDraft(bpdInput);
      const hcVal = parseNumericDraft(hcInput);
      const acVal = parseNumericDraft(acInput);
      const flVal = parseNumericDraft(flInput);

      if (bpdInput) {
        const err = validateNumericRange(bpdInput, {
          min: CLINICAL_INPUT_LIMITS.percentileBpd.min,
          max: CLINICAL_INPUT_LIMITS.percentileBpd.max,
          label: 'DBP',
          unit: 'mm',
        });
        if (err) {
          newFieldErrors['bpd'] = err;
          invalidRefs.push(bpdInputRef.current);
        }
      }
      if (hcInput) {
        const err = validateNumericRange(hcInput, {
          min: CLINICAL_INPUT_LIMITS.percentileHc.min,
          max: CLINICAL_INPUT_LIMITS.percentileHc.max,
          label: 'CC',
          unit: 'mm',
        });
        if (err) {
          newFieldErrors['hc'] = err;
          invalidRefs.push(hcInputRef.current);
        }
      }
      if (acInput) {
        const err = validateNumericRange(acInput, {
          min: CLINICAL_INPUT_LIMITS.percentileAc.min,
          max: CLINICAL_INPUT_LIMITS.percentileAc.max,
          label: 'CA',
          unit: 'mm',
        });
        if (err) {
          newFieldErrors['ac'] = err;
          invalidRefs.push(acInputRef.current);
        }
      }
      if (flInput) {
        const err = validateNumericRange(flInput, {
          min: CLINICAL_INPUT_LIMITS.percentileFl.min,
          max: CLINICAL_INPUT_LIMITS.percentileFl.max,
          label: 'Fêmur',
          unit: 'mm',
        });
        if (err) {
          newFieldErrors['fl'] = err;
          invalidRefs.push(flInputRef.current);
        }
      }

      if (!bpdVal && !hcVal && !acVal && !flVal) {
        newFieldErrors['bpd'] = 'Informe ao menos uma medida biométrica (DBP, CC, CA ou Fêmur).';
        invalidRefs.push(bpdInputRef.current);
      }
    }

    // Validate dates
    if (!examDate || examDate.length !== 10) {
      newFieldErrors['examDate'] = 'Por favor, informe a data do exame de ultrassom.';
      invalidRefs.push(examDateRef.current);
    } else {
      const dateErr = validateDateStr(examDate, { noFuture: true });
      if (dateErr) {
        newFieldErrors['examDate'] = dateErr;
        invalidRefs.push(examDateRef.current);
      }
    }

    if (!refDate || refDate.length !== 10) {
      newFieldErrors['refDate'] = 'Por favor, informe a data de referência.';
      invalidRefs.push(refDateRef.current);
    } else {
      const dateErr = validateDateStr(refDate);
      if (dateErr) {
        newFieldErrors['refDate'] = dateErr;
        invalidRefs.push(refDateRef.current);
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      hapticError();
      focusFirstInvalid(invalidRefs);
      return;
    }

    const examDateObj = parseDateString(examDate)!;
    const refDateObj = parseDateString(refDate)!;

    if (refDateObj < examDateObj) {
      setErrorMessage('A data de referência não pode ser anterior à data do exame.');
      hapticError();
      return;
    }

    let gaAtExamDays = 0;
    let methodDescription = '';
    const parametersUsed: string[] = [];

    // 1. Calculate GA at exam based on chosen mode
    if (calcMode === 'report') {
      const w = parseNumericDraft(reportWeeksInput) ?? 0;
      const d = parseNumericDraft(reportDaysInput) ?? 0;
      gaAtExamDays = w * 7 + d;
      methodDescription = `IG informada no laudo: ${w}s ${d}d`;
    } else if (calcMode === 'biometry_1t') {
      const ccnVal = parseNumericDraft(ccnInput) ?? 0;
      // Robinson & Fleming Formula (1975)
      // IG (dias) = 8.052 * sqrt(CCN) + 23.73
      gaAtExamDays = Math.round(8.052 * Math.sqrt(ccnVal) + 23.73);
      methodDescription = `Estimado por CCN (Fórmula Robinson & Fleming)`;
      parametersUsed.push(`CCN (${ccnVal} mm)`);
    } else if (calcMode === 'biometry_23t') {
      const activeAges: number[] = [];
      const bpdVal = parseNumericDraft(bpdInput);
      const hcVal = parseNumericDraft(hcInput);
      const acVal = parseNumericDraft(acInput);
      const flVal = parseNumericDraft(flInput);

      if (bpdVal && bpdVal > 0) {
        const bpdCm = bpdVal / 10;
        const bpdWeeks = 9.57 + 0.424 * bpdCm + 0.0022 * bpdCm * bpdCm;
        activeAges.push(bpdWeeks);
        parametersUsed.push(`DBP (${bpdVal} mm)`);
      }

      if (hcVal && hcVal > 0) {
        const hcCm = hcVal / 10;
        const hcWeeks = 8.96 + 0.54 * hcCm + 0.0003 * hcCm * hcCm * hcCm;
        activeAges.push(hcWeeks);
        parametersUsed.push(`CC (${hcVal} mm)`);
      }

      if (acVal && acVal > 0) {
        const acCm = acVal / 10;
        const acWeeks = 8.14 + 0.753 * acCm - 0.0036 * acCm * acCm;
        activeAges.push(acWeeks);
        parametersUsed.push(`CA (${acVal} mm)`);
      }

      if (flVal && flVal > 0) {
        const flCm = flVal / 10;
        const flWeeks = 10.35 + 2.46 * flCm + 0.17 * flCm * flCm;
        activeAges.push(flWeeks);
        parametersUsed.push(`Fêmur (${flVal} mm)`);
      }

      const averageWeeksDecimal = activeAges.reduce((a, b) => a + b, 0) / activeAges.length;
      gaAtExamDays = Math.round(averageWeeksDecimal * 7);
      methodDescription = `Média de Hadlock (2º/3º Trimestre)`;
    }

    setShimmer(true);
    setTimeout(() => {
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

      // Close keyboard before showing results
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
      type: 'USG',
      summary: `USG (${result.currentWeeks}s ${result.currentDays}d) • DUM Ajustada: ${result.estimatedDum} • DPP: ${result.estimatedDpp}`,
      details: {
        calcMode,
        reportWeeks: calcMode === 'report' ? parseNumericDraft(reportWeeksInput) ?? undefined : undefined,
        reportDays: calcMode === 'report' ? parseNumericDraft(reportDaysInput) ?? undefined : undefined,
        ccn: calcMode === 'biometry_1t' ? parseNumericDraft(ccnInput) ?? undefined : undefined,
        bpd: calcMode === 'biometry_23t' ? parseNumericDraft(bpdInput) ?? undefined : undefined,
        hc: calcMode === 'biometry_23t' ? parseNumericDraft(hcInput) ?? undefined : undefined,
        ac: calcMode === 'biometry_23t' ? parseNumericDraft(acInput) ?? undefined : undefined,
        fl: calcMode === 'biometry_23t' ? parseNumericDraft(flInput) ?? undefined : undefined,
        examDate,
        refDate,
        weeksAtExam: result.weeksAtExam,
        daysAtExam: result.daysAtExam,
        currentWeeks: result.currentWeeks,
        currentDays: result.currentDays,
        estimatedDum: result.estimatedDum,
        estimatedDpp: result.estimatedDpp,
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
          Idade Gestacional USG
        </h1>
        <p className="font-body-sm text-secondary hidden md:block text-xs min-[1366px]:text-sm">
          Datação obstétrica profissional baseada em ultrassonografia
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
            {/* Calculation Mode Tabs */}
            <div className="ios-toggle-bg p-1 rounded-2xl grid grid-cols-3 w-full border border-surface-variant shadow-xs bg-white dark:bg-black mb-1">
              <button
                type="button"
                onClick={() => {
                  hapticSelection();
                  setCalcMode('report');
                  setResult(null);
                  setErrorMessage('');
                  setFieldErrors({});
                  focusCurrentInput('report');
                }}
                className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                  calcMode === 'report'
                    ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Laudo USG
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticSelection();
                  setCalcMode('biometry_1t');
                  setResult(null);
                  setErrorMessage('');
                  setFieldErrors({});
                  focusCurrentInput('biometry_1t');
                }}
                className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                  calcMode === 'biometry_1t'
                    ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                CCN (Medida)
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticSelection();
                  setCalcMode('biometry_23t');
                  setResult(null);
                  setErrorMessage('');
                  setFieldErrors({});
                  focusCurrentInput('biometry_23t');
                }}
                className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center justify-center text-center leading-tight whitespace-normal break-words min-w-0 ${
                  calcMode === 'biometry_23t'
                    ? 'bg-surface text-on-surface shadow-xs border border-surface-variant'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Hadlock
              </button>
            </div>

            {errorMessage && <InfoBalloon variant="error" text={errorMessage} />}

            <div className="flex flex-col gap-3 flex-initial md:flex-1 justify-start md:justify-center">
              {calcMode === 'report' && (
                <div className="flex flex-col gap-3">
                  <InfoBalloon text="Use a IG descrita no laudo do USG e a data do exame." />

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <ClinicalNumericInput
                      ref={reportWeeksInputRef}
                      id="report-weeks"
                      label="IG (Semanas)"
                      value={reportWeeksInput}
                      onChange={handleReportWeeksChange}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.usgReportWeeks.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.usgReportWeeks.decimalPlaces}
                      unit="semanas"
                      placeholder="Ex.: 12"
                      enterKeyHint="next"
                      onNext={() => focusNext(0)}
                      error={fieldErrors.reportWeeks}
                      title="Idade gestacional estimada descrita no laudo do exame de ultrassom"
                    />

                    <ClinicalNumericInput
                      ref={reportDaysInputRef}
                      id="report-days"
                      label="IG (Dias)"
                      value={reportDaysInput}
                      onChange={handleReportDaysChange}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.gestationalDays.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.gestationalDays.decimalPlaces}
                      unit="dias"
                      placeholder="0"
                      selectAllOnFirstFocus
                      enterKeyHint="next"
                      onNext={() => focusNext(1)}
                      error={fieldErrors.reportDays}
                      title="Dias complementares à idade gestacional"
                    />
                  </div>
                </div>
              )}

              {calcMode === 'biometry_1t' && (
                <div className="flex flex-col gap-1.5" title="Comprimento Cabeça-Nádega">
                  <div className="flex flex-col gap-1 mb-0.5">
                    <InfoBalloon
                      text="Insira o comprimento cabeça-nádega em milímetros (mm)."
                      onClick={() => setHelpTopic('ccn')}
                    />
                  </div>
                  <ClinicalNumericInput
                    ref={ccnInputRef}
                    id="ccn-input"
                    label="Comprimento Cabeça-Nádega (CCN)"
                    value={ccnInput}
                    onChange={(val) => {
                      setCcnInput(val);
                      setFieldErrors((prev) => ({ ...prev, ccn: undefined }));
                    }}
                    maxIntegerDigits={CLINICAL_INPUT_LIMITS.ccn.maxIntegerDigits}
                    decimalPlaces={CLINICAL_INPUT_LIMITS.ccn.decimalPlaces}
                    unit="mm"
                    placeholder="Ex.: 45,2"
                    enterKeyHint="next"
                    onNext={() => examDateRef.current?.focus()}
                    error={fieldErrors.ccn}
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
                    <ClinicalNumericInput
                      ref={bpdInputRef}
                      id="bpd-input"
                      label="DBP"
                      value={bpdInput}
                      onChange={(val) => {
                        setBpdInput(val);
                        setFieldErrors((prev) => ({ ...prev, bpd: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.percentileBpd.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.percentileBpd.decimalPlaces}
                      unit="mm"
                      placeholder="Ex.: 54"
                      enterKeyHint="next"
                      onNext={() => focusNext(3)}
                      error={fieldErrors.bpd}
                      title="Diâmetro Biparietal (DBP)"
                    />

                    <ClinicalNumericInput
                      ref={hcInputRef}
                      id="hc-input"
                      label="CC"
                      value={hcInput}
                      onChange={(val) => {
                        setHcInput(val);
                        setFieldErrors((prev) => ({ ...prev, hc: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.percentileHc.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.percentileHc.decimalPlaces}
                      unit="mm"
                      placeholder="Ex.: 210"
                      enterKeyHint="next"
                      onNext={() => focusNext(4)}
                      error={fieldErrors.hc}
                      title="Circunferência Cefálica (CC)"
                    />

                    <ClinicalNumericInput
                      ref={acInputRef}
                      id="ac-input"
                      label="CA"
                      value={acInput}
                      onChange={(val) => {
                        setAcInput(val);
                        setFieldErrors((prev) => ({ ...prev, ac: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.percentileAc.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.percentileAc.decimalPlaces}
                      unit="mm"
                      placeholder="Ex.: 195"
                      enterKeyHint="next"
                      onNext={() => focusNext(5)}
                      error={fieldErrors.ac}
                      title="Circunferência Abdominal (CA)"
                    />

                    <ClinicalNumericInput
                      ref={flInputRef}
                      id="fl-input"
                      label="Fêmur"
                      value={flInput}
                      onChange={(val) => {
                        setFlInput(val);
                        setFieldErrors((prev) => ({ ...prev, fl: undefined }));
                      }}
                      maxIntegerDigits={CLINICAL_INPUT_LIMITS.percentileFl.maxIntegerDigits}
                      decimalPlaces={CLINICAL_INPUT_LIMITS.percentileFl.decimalPlaces}
                      unit="mm"
                      placeholder="Ex.: 42"
                      enterKeyHint="next"
                      onNext={() => examDateRef.current?.focus()}
                      error={fieldErrors.fl}
                      title="Comprimento do Fêmur"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 sm:gap-1.5">
              <label className="text-xs sm:text-sm font-semibold text-on-surface pl-0.5" htmlFor="exam-date">
                Data de Realização do USG
              </label>
              <DateInput
                ref={examDateRef}
                id="exam-date"
                required
                enterKeyHint="next"
                value={examDate}
                onChange={(val) => {
                  setExamDate(val);
                  setFieldErrors((prev) => ({ ...prev, examDate: undefined }));
                }}
                onAutoAdvance={() => refDateRef.current?.focus()}
                className="ios-input w-full h-11 sm:h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
              />
              {fieldErrors.examDate && (
                <span className="text-xs font-semibold text-error pl-1">{fieldErrors.examDate}</span>
              )}
            </div>

            <div className="flex flex-col gap-1 sm:gap-1.5">
              <label className="text-xs sm:text-sm font-semibold text-on-surface pl-0.5" htmlFor="ref-date">
                Data de Referência (Hoje)
              </label>
              <DateInput
                ref={refDateRef}
                id="ref-date"
                required
                enterKeyHint="done"
                value={refDate}
                onChange={(val) => {
                  setRefDate(val);
                  setFieldErrors((prev) => ({ ...prev, refDate: undefined }));
                }}
                className="ios-input w-full h-11 sm:h-12 md:h-12 px-3.5 md:px-4 rounded-xl text-[16px] font-medium text-on-surface"
              />
              {fieldErrors.refDate && (
                <span className="text-xs font-semibold text-error pl-1">{fieldErrors.refDate}</span>
              )}
            </div>

            <CalculatorActionBar label="Calcular" />
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
              {/* Main IG Section */}
              <div className="relative flex justify-center items-center mb-2 md:mb-4 mt-1 md:mt-2">
                <svg
                  viewBox="0 0 220 220"
                  className="w-[120px] h-[120px] md:w-[180px] md:h-[180px] min-[1366px]:w-[220px] min-[1366px]:h-[220px] -rotate-90"
                >
                  <circle
                    cx="110"
                    cy="110"
                    r="95"
                    className="stroke-surface-variant fill-none dark:opacity-100 opacity-50"
                    strokeWidth="6"
                  />
                  {!shimmer && result && (
                    <motion.circle
                      cx="110"
                      cy="110"
                      r="95"
                      className="stroke-primary fill-none drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(10,132,255,0.4)]"
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 2 * Math.PI * 95 }}
                      animate={{
                        strokeDashoffset:
                          2 * Math.PI * 95 -
                          (Math.min(result.totalDays, 280) / 280) * (2 * Math.PI * 95),
                      }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
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
                        <span className="font-title-md text-primary opacity-80 text-lg md:text-xl">
                          s
                        </span>
                        <span className="font-display-lg text-[24px] md:text-[40px] leading-none text-tertiary tracking-tight ml-1">
                          {result.currentWeeks < 0 ? '--' : result.currentDays}
                        </span>
                        <span className="font-title-md text-tertiary opacity-80 text-lg md:text-xl">
                          d
                        </span>
                      </div>
                      <span className="text-[7px] md:text-[10px] font-bold text-secondary uppercase tracking-wider md:tracking-widest mt-1 md:mt-2 text-center max-w-[90px] md:max-w-none leading-tight">
                        Idade Gestacional
                      </span>
                    </>
                  ) : (
                    <span className="font-display-lg text-[32px] md:text-[56px] leading-none text-secondary opacity-50">
                      --
                    </span>
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
                  className="w-full flex flex-col gap-4 mt-8 pt-6 border-t border-surface-variant text-left min-w-0"
                >
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="flex flex-col gap-1 bg-surface-variant/50 dark:bg-surface-variant p-3 md:p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                        DUM Ajustada
                      </span>
                      <span className="text-sm font-semibold text-on-surface break-words leading-snug">
                        {result.estimatedDum}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 bg-surface-variant/50 dark:bg-surface-variant p-3 md:p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                        IG no Exame
                      </span>
                      <span className="text-xs font-semibold text-on-surface break-words leading-snug">
                        {result.weeksAtExam}s {result.daysAtExam}d
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 bg-surface-variant/50 dark:bg-surface-variant p-3 md:p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">
                      Método
                    </span>
                    <span className="text-xs font-semibold text-on-surface break-words leading-snug">
                      {result.methodDescription}
                    </span>
                    {result.parametersUsed && result.parametersUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {result.parametersUsed.map((param, index) => (
                          <span
                            key={`${param}-${index}`}
                            className="text-[10px] bg-primary/10 text-primary font-bold py-1 px-2 rounded-lg"
                          >
                            {param}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <GestationalMilestones
                    dumDate={result.estimatedDumDate}
                    currentDays={result.totalDays}
                  />

                  {/* Save record */}
                  <div className="mt-4 pt-4 border-t border-surface-variant flex flex-col gap-2.5 text-left w-full min-w-0">
                    <label
                      className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-secondary pl-1"
                      htmlFor="pat-name-usg"
                    >
                      Salvar no Histórico Local
                    </label>
                    <div className="flex gap-2 w-full min-w-0">
                      <input
                        id="pat-name-usg"
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
          helpTopic === 'ccn'
            ? 'Comprimento Cabeça-Nádega (CCN)'
            : helpTopic === 'hadlock'
            ? 'Biometria Fetal (Hadlock)'
            : ''
        }
      >
        {helpTopic === 'ccn' && (
          <div className="space-y-3">
            <p>
              O <strong>Comprimento Cabeça-Nádega (CCN)</strong> é a medida mais precisa para
              estabelecer a idade gestacional no primeiro trimestre.
            </p>
            <p>
              A medida deve ser obtida em um corte sagital médio verdadeiro do feto, em posição
              neutra. É validada e mais confiável entre 10 mm e 84 mm (aproximadamente 7 a 14
              semanas).
            </p>
          </div>
        )}
        {helpTopic === 'hadlock' && (
          <div className="space-y-3">
            <p>
              Após o primeiro trimestre, a datação é feita através da biometria fetal múltipla,
              combinando medidas para maior precisão (fórmula de Hadlock).
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>DBP (Diâmetro Biparietal):</strong> Medida da cabeça fetal de um lado ao
                outro.
              </li>
              <li>
                <strong>CC (Circunferência Cefálica):</strong> Medida do contorno da cabeça fetal.
              </li>
              <li>
                <strong>CA (Circunferência Abdominal):</strong> Medida do abdome fetal, muito sensível
                ao crescimento e nutrição.
              </li>
              <li>
                <strong>Fêmur:</strong> Medida do osso da coxa fetal, reflete o crescimento
                longitudinal.
              </li>
            </ul>
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
