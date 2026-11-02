const pad = (n: number) => String(n).padStart(2, '0');
export const dateText = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** 가장 최근에 장이 끝난 시각. 오늘 장이 아직 안 끝났거나 휴장일이면 직전 거래일이에요. */
export function lastClose(now = new Date()) {
  const closedToday = !isWeekend(now) && now.getHours() * 60 + now.getMinutes() >= 15 * 60 + 30;
  const day = new Date(now);
  if (!closedToday) {
    do {
      day.setDate(day.getDate() - 1);
    } while (isWeekend(day));
  }
  return { date: day, asOf: `${dateText(day)}T15:30:00+09:00`, isPrevious: !closedToday };
}
