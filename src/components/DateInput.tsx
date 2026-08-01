import React, { forwardRef } from 'react';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({ value, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 8) {
      raw = raw.slice(0, 8);
    }
    
    let formatted = raw;
    if (raw.length >= 5) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    } else if (raw.length >= 3) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    
    onChange(formatted);
  };

  return (
    <input 
      ref={ref}
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/AAAA"
      value={value}
      onChange={handleChange}
      {...props}
    />
  );
});

DateInput.displayName = 'DateInput';

export default DateInput;
