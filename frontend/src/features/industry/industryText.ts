import type { HeatLevel } from '../../types';

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
