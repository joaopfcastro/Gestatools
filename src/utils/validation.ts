export const clampValue = (val: string, max: number, allowDecimal: boolean = false): number | string => {
  if (val === '') return '';
  const num = allowDecimal ? parseFloat(val) : parseInt(val, 10);
  if (isNaN(num) || num < 0) return '';
  if (num > max) return max;
  if (allowDecimal && val.endsWith('.')) return val;
  return num;
};

export const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.length !== 10) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
    return null;
  }
  
  const date = new Date(year, month - 1, day, 12, 0, 0);
  
  // Verify if it didn't roll over (e.g. Feb 30 -> Mar 2)
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
};

export const validateDateStr = (dateStr: string, options?: { noFuture?: boolean; minDate?: Date; minDateMessage?: string }): string | null => {
  if (!dateStr || dateStr.length !== 10) return null; // Apenas valida datas completas

  const date = parseDateString(dateStr);
  if (!date) {
    return 'A data informada é inválida.';
  }

  if (options?.noFuture) {
    const today = new Date();
    // Reset to end of day to allow today
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      return 'A data não pode ser uma data futura.';
    }
  }

  if (options?.minDate) {
    const min = new Date(options.minDate);
    min.setHours(0, 0, 0, 0);
    if (date < min) {
      return options.minDateMessage || 'A data não pode ser anterior à data base.';
    }
  }

  return null;
};

export const getTodayFormatted = (): string => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};
