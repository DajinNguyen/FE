import type { CompareCompany } from '../types';

/**
 * 비교하기 "한눈에 비교" 규칙 문장. API 에 AI 분석이 없을 때 이 한 곳에서 만들어요.
 * - 숫자는 화면에 보이는 값 그대로 쓰고, 새로 계산한 숫자(몇 배 등)는 넣지 않아요.
 * - 두 값의 차이가 큰 값의 10% 미만이면 "비슷해요".
 * - "더 좋은 회사", "사세요" 같은 판단·추천 표현은 쓰지 않아요.
 */
export const SIMILAR_RATIO = 0.1;

export interface ComparePoint {
  title: string;
  description: string;
}

export interface CompareSummaryText {
  headline: string;
  points: ComparePoint[];
}

/** 받침이 있으면 true (한글이 아니면 영어 이름이라 보고 받침 없음으로) */
function hasFinalConsonant(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}
/** 은/는 */
export const topic = (name: string) => `${name}${hasFinalConsonant(name) ? '은' : '는'}`;
/** 이/가 */
export const subject = (name: string) => `${name}${hasFinalConsonant(name) ? '이' : '가'}`;

type Winner = 'left' | 'right' | 'similar' | null;

export interface CompareHighlight {
  key: 'revenue' | 'operating_margin' | 'revenue_growth';
  title: string;
  subtitle: string;
  winner: 'left' | 'right' | 'similar';
  /** 짧은 한 줄 결론 (예: "삼성전자가 더 커요") */
  verdict: string;
  leftValue: string;
  rightValue: string;
}

/** 어느 쪽이 큰지 (차이가 10% 미만이면 similar, 값이 없으면 null) */
export function compareValues(a: number | null, b: number | null): Winner {
  if (a === null || b === null) return null;
  const base = Math.max(Math.abs(a), Math.abs(b));
  if (base === 0 || Math.abs(a - b) / base < SIMILAR_RATIO) return 'similar';
  return a > b ? 'left' : 'right';
}

const money = (v: number, unit: string) =>
  `${v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${unit}`;
const percent = (v: number) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}%`;

export function compareSummary(left: CompareCompany, right: CompareCompany): CompareSummaryText {
  const nameOf = (w: 'left' | 'right') => (w === 'left' ? left.name : right.name);
  const points: ComparePoint[] = [];

  const size = compareValues(left.revenue, right.revenue);
  if (size) {
    const values = `${left.name} ${money(left.revenue!, left.unit)}, ${right.name} ${money(right.revenue!, right.unit)}`;
    points.push({
      title: '규모 (매출)',
      description:
        size === 'similar'
          ? `두 회사 매출이 비슷해요. (${values})`
          : `${nameOf(size)} 매출이 더 커요. (${values})`,
    });
  }

  const margin = compareValues(left.operating_margin, right.operating_margin);
  if (margin) {
    const values = `${left.name} ${percent(left.operating_margin!)}, ${right.name} ${percent(right.operating_margin!)}`;
    points.push({
      title: '수익성 (영업이익률)',
      description:
        margin === 'similar'
          ? `100원어치를 팔아 남기는 돈이 비슷해요. (${values})`
          : `${subject(nameOf(margin))} 같은 매출에서 더 많이 남겨요. (${values})`,
    });
  }

  const growth = compareValues(left.revenue_growth, right.revenue_growth);
  if (growth) {
    const values = `${left.name} ${percent(left.revenue_growth!)}, ${right.name} ${percent(right.revenue_growth!)}`;
    points.push({
      title: '성장 속도 (매출 증가율)',
      description:
        growth === 'similar'
          ? `매출이 늘어난 속도가 비슷해요. (${values})`
          : `${nameOf(growth)}의 매출이 작년보다 더 빠르게 늘었어요. (${values})`,
    });
  }

  return { headline: headline(size, margin, nameOf), points };
}

function headline(size: Winner, margin: Winner, nameOf: (w: 'left' | 'right') => string): string {
  const bigger = size === 'left' || size === 'right' ? nameOf(size) : null;
  const leaner = margin === 'left' || margin === 'right' ? nameOf(margin) : null;
  if (bigger && leaner && bigger !== leaner) {
    return `${topic(bigger)} 규모가 크고, ${topic(leaner)} 같은 매출에서 더 많이 남겨요`;
  }
  if (bigger && leaner) return `${topic(bigger)} 규모가 크고 같은 매출에서 남기는 돈도 많아요`;
  if (bigger) {
    return margin === 'similar'
      ? `${topic(bigger)} 규모가 크고, 남기는 비율은 두 회사가 비슷해요`
      : `${topic(bigger)} 매출 규모가 더 커요`;
  }
  if (leaner) {
    return size === 'similar'
      ? `두 회사 규모는 비슷하고, ${subject(leaner)} 같은 매출에서 더 많이 남겨요`
      : `${subject(leaner)} 같은 매출에서 더 많이 남겨요`;
  }
  if (size === 'similar' && margin === 'similar') return '두 회사는 규모와 남기는 비율이 비슷해요';
  return '두 회사의 숫자를 나란히 놓아 봤어요';
}

/**
 * "한눈에 비교" 카드용 지표별 결과. 두 값이 다 있는 지표만, 큰 쪽(winner)과 화면에 보이는 숫자 그대로 돌려줘요.
 * 판단·추천 표현 없이 "더 커요/더 많이 남겨요/더 빠르게 늘었어요"만 써요.
 */
export function compareHighlights(left: CompareCompany, right: CompareCompany): CompareHighlight[] {
  const nameOf = (w: 'left' | 'right') => (w === 'left' ? left.name : right.name);
  const rows: CompareHighlight[] = [];

  const add = (
    key: CompareHighlight['key'],
    title: string,
    subtitle: string,
    a: number | null,
    b: number | null,
    format: (v: number, c: CompareCompany) => string,
    sentence: (name: string) => string,
  ) => {
    const winner = compareValues(a, b);
    if (!winner || a === null || b === null) return;
    rows.push({
      key,
      title,
      subtitle,
      winner,
      verdict: winner === 'similar' ? '비슷해요' : sentence(nameOf(winner)),
      leftValue: format(a, left),
      rightValue: format(b, right),
    });
  };

  add(
    'revenue',
    '규모',
    '매출',
    left.revenue,
    right.revenue,
    (v, c) => money(v, c.unit),
    (n) => `${subject(n)} 더 커요`,
  );
  add(
    'operating_margin',
    '수익성',
    '영업이익률',
    left.operating_margin,
    right.operating_margin,
    percent,
    (n) => `${topic(n)} 더 많이 남겨요`,
  );
  add(
    'revenue_growth',
    '성장 속도',
    '매출 증가율',
    left.revenue_growth,
    right.revenue_growth,
    percent,
    (n) => `${topic(n)} 더 빠르게 늘었어요`,
  );
  return rows;
}
