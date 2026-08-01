import React from 'react';
import Icon from './Icon';

interface CalculatorActionBarProps {
  label?: string;
  iconName?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function CalculatorActionBar({
  label = 'Calcular',
  iconName = 'calculate',
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
          className="calc-btn h-12 min-h-[48px] w-full bg-primary hover:bg-primary/90 text-white font-bold text-[17px] md:text-[18px] rounded-xl shadow-md shadow-primary/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {iconName && <Icon name={iconName} className="text-[22px]" />}
          {label}
        </button>
      )}
    </div>
  );
}
