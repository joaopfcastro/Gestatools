import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { sanitizeNumericDraft } from '../utils/numericInput';

export interface ClinicalNumericInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;

  maxIntegerDigits: number;
  decimalPlaces?: 0 | 1 | 2;

  unit?: string;
  placeholder?: string;
  required?: boolean;

  enterKeyHint?: 'next' | 'done';

  error?: string;
  hint?: string;

  selectAllOnFirstFocus?: boolean;

  onNext?: () => void;
  onDone?: () => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;

  title?: string;
  className?: string;
}

export const ClinicalNumericInput = forwardRef<HTMLInputElement, ClinicalNumericInputProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      maxIntegerDigits,
      decimalPlaces = 0 as 0 | 1 | 2,
      unit,
      placeholder,
      required,
      enterKeyHint = 'next',
      error,
      hint,
      selectAllOnFirstFocus = false,
      onNext,
      onDone,
      onBlur,
      onFocus,
      title,
      className = '',
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasBeenFocusedRef = useRef(false);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (selectAllOnFirstFocus && !hasBeenFocusedRef.current) {
        hasBeenFocusedRef.current = true;
        // Small timeout to allow keyboard/browser to settle selection
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.select();
          }
        }, 10);
      }
      if (onFocus) {
        onFocus(e);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const candidate = e.target.value;
      const sanitized = sanitizeNumericDraft(candidate, value, {
        maxIntegerDigits,
        decimalPlaces,
      });

      if (sanitized.accepted) {
        onChange(sanitized.value);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent scientific notation keys or sign keys explicitly
      if (['e', 'E', '+', '-'].includes(e.key)) {
        e.preventDefault();
        return;
      }

      if (e.key === 'Enter') {
        if (e.nativeEvent.isComposing) return;
        e.preventDefault();
        if (enterKeyHint === 'next' && onNext) {
          onNext();
        } else if (enterKeyHint === 'done' && onDone) {
          onDone();
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasteText = e.clipboardData.getData('text');
      const sanitized = sanitizeNumericDraft(pasteText, value, {
        maxIntegerDigits,
        decimalPlaces,
      });

      if (sanitized.accepted) {
        e.preventDefault();
        onChange(sanitized.value);
      } else {
        e.preventDefault(); // Rejects whole invalid paste
      }
    };

    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const ariaDescribedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={`flex flex-col gap-1 w-full ${className}`} title={title}>
        <div className="flex justify-between items-baseline pl-0.5">
          <label htmlFor={id} className="text-xs font-semibold text-on-surface">
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </label>
        </div>

        <div className="relative flex items-center w-full">
          <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode={decimalPlaces > 0 ? 'decimal' : 'numeric'}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            enterKeyHint={enterKeyHint}
            aria-invalid={Boolean(error)}
            aria-describedby={ariaDescribedBy}
            className={`ios-input w-full h-11 sm:h-12 md:h-12 px-3.5 md:px-4 ${
              unit ? 'pr-12' : ''
            } rounded-xl text-[16px] font-medium text-on-surface transition-all ${
              error
                ? 'border-error focus:border-error focus:ring-1 focus:ring-error'
                : ''
            }`}
          />
          {unit && (
            <span className="absolute right-3.5 text-xs font-bold text-secondary pointer-events-none select-none">
              {unit}
            </span>
          )}
        </div>

        {error ? (
          <p id={errorId} className="text-[11px] font-medium text-error pl-0.5 mt-0.5">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-[11px] text-secondary pl-0.5 mt-0.5">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

ClinicalNumericInput.displayName = 'ClinicalNumericInput';
