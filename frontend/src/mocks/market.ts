/**
 * 시장 요약 목 데이터. 한마디·이유는 지난 사실만 쓰고 예측·투자 권유 표현은 넣지 않아요.
 * 지수 값은 예시 값이에요(is_sample: true).
 */
import type { MarketSummary } from '../types';
import { lastClose } from './marketClock';
import { marketNews } from './news';

const pad = (n: number) => String(n).padStart(2, '0');

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
  const pick = (...ids: string[]) => ids.flatMap((id) => news.filter((n) => n.id === id));
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
        description: '빅테크 데이터센터 투자 소식에 메모리 반도체가 주목받았어요.',
        industries: [
          { industry_id: 'semiconductor', name: '반도체', change_rate: 2.1 },
          { industry_id: 'ai', name: 'AI', change_rate: 1.8 },
        ],
        news: pick('market-chip', 'market-chip-2'),
      },
      {
        title: '외국인이 대형주를 샀어요',
        description: '환율이 내려 외국인 매수가 늘었어요.',
        industries: [
          { industry_id: 'finance', name: '금융', change_rate: 0.8 },
          { industry_id: 'auto', name: '자동차', change_rate: 0.6 },
        ],
        news: pick('market-fx', 'market-foreign'),
      },
      {
        title: '2차전지는 약했어요',
        description: '배터리 원재료 값이 내려 주가도 내렸어요.',
        industries: [
          { industry_id: 'battery', name: '2차전지', change_rate: -1.3 },
          { industry_id: 'bio', name: '바이오', change_rate: -0.4 },
        ],
        news: pick('market-battery', 'market-bio'),
      },
    ],
  };
}
