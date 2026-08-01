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
    <div
      className={`sticky bottom-0 min-[1024px]:static z-20 pt-3 pb-1 min-[1024px]:pt-0 min-[1024px]:pb-0 -mx-3.5 sm:-mx-5 min-[1024px]:mx-0 px-3.5 sm:px-5 min-[1024px]:px-0 -mb-3.5 sm:-mb-5 min-[1024px]:mb-0 mt-4 backdrop-blur-md bg-white/90 dark:bg-[#1C1C1E]/90 border-t border-black/5 dark:border-white/10 shadow-lg min-[1024px]:shadow-none transition-all rounded-b-[1.25rem] min-[1024px]:rounded-none min-[1024px]:border-none min-[1024px]:bg-transparent min-[1024px]:backdrop-blur-none ${className}`.trim()}
    >
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
