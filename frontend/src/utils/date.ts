/** 기기 시간 기준 날짜 "YYYY-MM-DD" */
export function localDate(date: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" 에서 days 만큼 앞뒤 날짜 */
export function shiftDate(day: string, days: number) {
  const [y, m, d] = day.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + days));
}
