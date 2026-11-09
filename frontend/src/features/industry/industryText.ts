import { HOT_INDUSTRY_LIMIT } from '../../config/industryHeat';
import type { HeatLevel, IndustrySummary } from '../../types';

export const heatLevelLabel: Record<HeatLevel, string> = {
  high: '관심도 높음',
  mid: '관심도 보통',
  low: '관심도 낮음',
};

/** "+6.2%" / "-1.3%" / "0%" */
export const signedPercent = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '-' : ''}${Math.abs(value).toFixed(1)}%`;

export const changeDirection = (value: number) =>
  value > 0 ? 'rise' : value < 0 ? 'fall' : 'flat';

/** 화면 낭독용: "6.2% 상승" */
export const changeWords = (value: number) =>
  value === 0 ? '변화 없음' : `${Math.abs(value).toFixed(1)}% ${value > 0 ? '상승' : '하락'}`;

/** 서버가 몇 개를 보내든 점수 높은 순으로 상위 3개만 */
export const topIndustries = (industries: IndustrySummary[]) =>
  [...industries].sort((a, b) => b.heat_score - a.heat_score).slice(0, HOT_INDUSTRY_LIMIT);
