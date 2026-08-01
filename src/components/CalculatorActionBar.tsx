import React from 'react';

interface CalculatorActionBarProps {
  label?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function CalculatorActionBar({
  label = 'Calcular',
  disabled = false,
  className = '',
  children,
}: CalculatorActionBarProps) {
  return (
    <div className={`calculator-action-bar ${className}`.trim()}>
      {children ? (
        children
      ) : (
        <button
          type="submit"
          disabled={disabled}
          className="calc-btn h-12 min-h-[48px] w-full bg-primary hover:bg-primary/90 text-white font-bold text-[17px] md:text-[18px] rounded-xl shadow-md shadow-primary/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {label}
        </button>
      )}
    </div>
  );
}
