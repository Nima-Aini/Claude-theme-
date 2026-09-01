// Jalali (Shamsi) Date Conversion Utilities

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// Gregorian to Jalali conversion algorithm
export function gregorianToJalali(gYear: number, gMonth: number, gDay: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy = gYear - 1600;
  let gm = gMonth - 1;
  let gd = gDay - 1;

  let g_day_no = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);

  for (let i = 0; i < gm; ++i) g_day_no += g_d_m[i + 1] - g_d_m[i];
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) ++g_day_no;
  g_day_no += gd;

  let j_day_no = g_day_no - 79;
  let j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;

  let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;

  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }

  let jm: number;
  let jd: number;
  if (j_day_no < 186) {
    jm = 1 + Math.floor(j_day_no / 31);
    jd = 1 + (j_day_no % 31);
  } else {
    jm = 7 + Math.floor((j_day_no - 186) / 30);
    jd = 1 + ((j_day_no - 186) % 30);
  }

  return [jy, jm, jd];
}

// Jalali to Gregorian conversion algorithm
export function jalaliToGregorian(jYear: number, jMonth: number, jDay: number): [number, number, number] {
  let jy = jYear - 979;
  let jm = jMonth - 1;
  let jd = jDay - 1;

  let j_day_no = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
  for (let i = 0; i < jm; ++i) {
    if (i < 6) j_day_no += 31;
    else j_day_no += 30;
  }
  j_day_no += jd;

  let g_day_no = j_day_no + 79;
  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no %= 146097;

  let leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no %= 36524;
    if (g_day_no >= 365) g_day_no++;
    else leap = false;
  }

  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;

  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no %= 365;
  }

  const g_d_m = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 12 && g_day_no >= g_d_m[gm + 1]) {
    g_day_no -= g_d_m[gm + 1];
    gm++;
  }
  let gd = g_day_no + 1;

  return [gy, gm + 1, gd];
}

export function formatJalaliDate(dateInput: Date | string | number | null | undefined, includeTime = true): string {
  if (!dateInput) return "نامشخص";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "نامشخص";

  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const monthName = JALALI_MONTHS[jm - 1] || "";
  const dayStr = jd.toString().padStart(2, "0");
  const monthStr = jm.toString().padStart(2, "0");

  if (!includeTime) {
    return `${jy}/${monthStr}/${dayStr} (${jd} ${monthName})`;
  }

  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");

  return `${jy}/${monthStr}/${dayStr} - ${hours}:${minutes}`;
}

export function getJalaliDateObject(dateInput: Date | string | number) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return {
    year: jy,
    month: jm,
    day: jd,
    monthName: JALALI_MONTHS[jm - 1],
    dateString: `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`,
  };
}

export function createDateFromJalali(jy: number, jm: number, jd: number, hour = 0, minute = 0, second = 0): Date {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd, hour, minute, second);
}

export function getCurrentJalali(): { year: number; month: number; day: number } {
  const now = new Date();
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { year: jy, month: jm, day: jd };
}
