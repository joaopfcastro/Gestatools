export interface PercentileData {
  week: number;
  p3: number;
  p10: number;
  p50: number;
  p90: number;
  p97: number;
}

export const HADLOCK_TABLE: PercentileData[] = [
  { week: 20, p3: 275, p10: 300, p50: 330, p90: 380, p97: 415 },
  { week: 21, p3: 335, p10: 360, p50: 398, p90: 455, p97: 490 },
  { week: 22, p3: 400, p10: 430, p50: 478, p90: 545, p97: 590 },
  { week: 23, p3: 475, p10: 515, p50: 568, p90: 650, p97: 700 },
  { week: 24, p3: 560, p10: 605, p50: 670, p90: 765, p97: 825 },
  { week: 25, p3: 660, p10: 710, p50: 785, p90: 895, p97: 965 },
  { week: 26, p3: 765, p10: 825, p50: 913, p90: 1040, p97: 1125 },
  { week: 27, p3: 885, p10: 955, p50: 1055, p90: 1200, p97: 1300 },
  { week: 28, p3: 1015, p10: 1095, p50: 1210, p90: 1380, p97: 1490 },
  { week: 29, p3: 1155, p10: 1250, p50: 1379, p90: 1570, p97: 1700 },
  { week: 30, p3: 1305, p10: 1410, p50: 1560, p90: 1780, p97: 1920 },
  { week: 31, p3: 1465, p10: 1585, p50: 1753, p90: 2000, p97: 2160 },
  { week: 32, p3: 1635, p10: 1770, p50: 1955, p90: 2230, p97: 2410 },
  { week: 33, p3: 1810, p10: 1960, p50: 2164, p90: 2470, p97: 2665 },
  { week: 34, p3: 1990, p10: 2150, p50: 2377, p90: 2710, p97: 2930 },
  { week: 35, p3: 2170, p10: 2345, p50: 2591, p90: 2955, p97: 3190 },
  { week: 36, p3: 2345, p10: 2535, p50: 2800, p90: 3190, p97: 3450 },
  { week: 37, p3: 2515, p10: 2715, p50: 3000, p90: 3420, p97: 3700 },
  { week: 38, p3: 2670, p10: 2880, p50: 3184, p90: 3630, p97: 3925 },
  { week: 39, p3: 2805, p10: 3025, p50: 3345, p90: 3815, p97: 4125 },
  { week: 40, p3: 2915, p10: 3145, p50: 3479, p90: 3965, p97: 4290 },
  { week: 41, p3: 3000, p10: 3240, p50: 3581, p90: 4080, p97: 4415 },
  { week: 42, p3: 3055, p10: 3300, p50: 3647, p90: 4155, p97: 4495 },
];

export const BARCELONA_TABLE: PercentileData[] = [
  { week: 20, p3: 260, p10: 290, p50: 340, p90: 390, p97: 420 },
  { week: 21, p3: 310, p10: 350, p50: 400, p90: 460, p97: 500 },
  { week: 22, p3: 370, p10: 410, p50: 470, p90: 540, p97: 585 },
  { week: 23, p3: 440, p10: 490, p50: 560, p90: 640, p97: 690 },
  { week: 24, p3: 520, p10: 580, p50: 660, p90: 750, p97: 810 },
  { week: 25, p3: 610, p10: 680, p50: 770, p90: 875, p97: 945 },
  { week: 26, p3: 720, p10: 800, p50: 900, p90: 1020, p97: 1100 },
  { week: 27, p3: 840, p10: 930, p50: 1040, p90: 1180, p97: 1275 },
  { week: 28, p3: 980, p10: 1080, p50: 1200, p90: 1360, p97: 1470 },
  { week: 29, p3: 1130, p10: 1240, p50: 1380, p90: 1560, p97: 1685 },
  { week: 30, p3: 1290, p10: 1420, p50: 1580, p90: 1785, p97: 1930 },
  { week: 31, p3: 1470, p10: 1610, p50: 1790, p90: 2020, p97: 2185 },
  { week: 32, p3: 1650, p10: 1815, p50: 2020, p90: 2280, p97: 2465 },
  { week: 33, p3: 1850, p10: 2030, p50: 2260, p90: 2550, p97: 2755 },
  { week: 34, p3: 2050, p10: 2255, p50: 2510, p90: 2835, p97: 3060 },
  { week: 35, p3: 2260, p10: 2485, p50: 2765, p90: 3125, p97: 3375 },
  { week: 36, p3: 2470, p10: 2715, p50: 3020, p90: 3410, p97: 3685 },
  { week: 37, p3: 2670, p10: 2935, p50: 3265, p90: 3690, p97: 3985 },
  { week: 38, p3: 2860, p10: 3145, p50: 3495, p90: 3950, p97: 4265 },
  { week: 39, p3: 3030, p10: 3330, p50: 3700, p90: 4180, p97: 4515 },
  { week: 40, p3: 3170, p10: 3485, p50: 3875, p90: 4380, p97: 4730 },
  { week: 41, p3: 3280, p10: 3610, p50: 4010, p90: 4530, p97: 4890 },
  { week: 42, p3: 3350, p10: 3685, p50: 4100, p90: 4630, p97: 5000 },
];

export function getPercentileThresholds(
  table: PercentileData[],
  decimalWeeks: number
): PercentileData | null {
  if (decimalWeeks < 20 || decimalWeeks > 42) return null;

  const w1 = Math.floor(decimalWeeks);
  const w2 = Math.ceil(decimalWeeks);

  if (w1 === w2) {
    const exact = table.find((item) => item.week === w1);
    return exact || null;
  }

  const item1 = table.find((item) => item.week === w1);
  const item2 = table.find((item) => item.week === w2);

  if (!item1 || !item2) return null;

  const t = decimalWeeks - w1;

  return {
    week: decimalWeeks,
    p3: item1.p3 * (1 - t) + item2.p3 * t,
    p10: item1.p10 * (1 - t) + item2.p10 * t,
    p50: item1.p50 * (1 - t) + item2.p50 * t,
    p90: item1.p90 * (1 - t) + item2.p90 * t,
    p97: item1.p97 * (1 - t) + item2.p97 * t,
  };
}

export function calculatePercentile(
  table: PercentileData[],
  decimalWeeks: number,
  weight: number
): { percentile: number; thresholds: PercentileData } | null {
  const thresholds = getPercentileThresholds(table, decimalWeeks);
  if (!thresholds) return null;

  const { p3, p10, p50, p90, p97 } = thresholds;

  let percentile = 50;

  if (weight === p50) {
    percentile = 50;
  } else if (weight < p50) {
    if (weight >= p10) {
      percentile = 10 + ((weight - p10) / (p50 - p10)) * 40;
    } else if (weight >= p3) {
      percentile = 3 + ((weight - p3) / (p10 - p3)) * 7;
    } else {
      percentile = Math.max(1, (weight / p3) * 3);
    }
  } else {
    if (weight <= p90) {
      percentile = 50 + ((weight - p50) / (p90 - p50)) * 40;
    } else if (weight <= p97) {
      percentile = 90 + ((weight - p90) / (p97 - p90)) * 7;
    } else {
      percentile = Math.min(99, 97 + ((weight - p97) / p97) * 3);
    }
  }

  return {
    percentile: Math.round(percentile),
    thresholds,
  };
}
