/**
 * 시장 요약 목 데이터. 한마디·이유는 지난 사실만 쓰고 예측·투자 권유 표현은 넣지 않아요.
 * 지수 값은 예시 값이에요(is_sample: true).
 */
import type { MarketSummary } from '../types';
import { marketNews } from './news';

const pad = (n: number) => String(n).padStart(2, '0');
const dateText = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
  return { asOf: `${dateText(day)}T15:30:00+09:00`, isPrevious: !closedToday };
}

/** 09:00 ~ 15:30, 10분 간격의 예시 흐름. 마지막 값은 종가와 같아요. */
function intraday(open: number, close: number, seed: number) {
  const points: { time: string; value: number }[] = [];
  const steps = 39;
  for (let i = 0; i <= steps; i += 1) {
    const minutes = 9 * 60 + i * 10;
    const t = i / steps;
    const wave = Math.sin(i * 0.7 + seed) * (Math.abs(close - open) * 0.25 + 2);
    const value = i === steps ? close : open + (close - open) * t + wave;
    points.push({
      time: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
      value: Math.round(value * 100) / 100,
    });
  }
  return points;
}

export function marketSummary(): MarketSummary {
  const { asOf, isPrevious } = lastClose();
  const news = marketNews();
  const pick = (...ids: string[]) => news.filter((n) => ids.includes(n.id));
  return {
    as_of: asOf,
    is_previous_session: isPrevious,
    headline: '반도체 강세에 코스피가 1% 넘게 올랐어요',
    indices: [
      {
        code: 'KOSPI',
        value: 2684.32,
        change: 31.2,
        change_rate: 1.18,
        is_sample: true,
        intraday: intraday(2653.12, 2684.32, 1),
      },
      {
        code: 'KOSDAQ',
        value: 812.4,
        change: -2.1,
        change_rate: -0.26,
        is_sample: true,
        intraday: intraday(814.5, 812.4, 2),
      },
    ],
    reasons: [
      {
        title: 'AI 서버용 메모리 기대가 커졌어요',
        description:
          '미국 빅테크가 데이터센터 투자를 늘리겠다고 밝히면서, 메모리 반도체를 만드는 회사들에 관심이 몰렸어요.',
        sectors: [
          { name: '반도체', change_rate: 2.1 },
          { name: '전자부품', change_rate: 1.4 },
        ],
        news: pick('market-chip', 'market-chip-2'),
      },
      {
        title: '외국인 투자자가 대형주를 많이 샀어요',
        description:
          '원·달러 환율이 내려 외국인의 부담이 줄면서, 대형주를 산 금액이 판 금액보다 많았어요.',
        sectors: [
          { name: '금융', change_rate: 0.8 },
          { name: '자동차', change_rate: 0.6 },
        ],
        news: pick('market-fx', 'market-foreign'),
      },
      {
        title: '2차전지는 약했어요',
        description: '배터리 원재료 가격이 내려가면서 2차전지 관련 기업 주가는 내렸어요.',
        sectors: [
          { name: '2차전지', change_rate: -1.3 },
          { name: '바이오', change_rate: -0.4 },
        ],
        news: pick('market-battery', 'market-bio'),
      },
    ],
  };
}
