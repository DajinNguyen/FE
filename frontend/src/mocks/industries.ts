/**
 * 산업 목 데이터. 숫자는 모두 예시 값이에요(is_sample: true).
 * 점수는 src/config/industryHeat.ts 의 임시 기준으로 계산해요. (실제로는 서버가 계산)
 */
import { HEAT_LEVEL_RANKS, HEAT_WEIGHTS } from '../config/industryHeat';
import type { HeatLevel, HeatPeriod, IndustrySummary } from '../types';
import { lastClose } from './marketClock';

type Factors = Record<keyof typeof HEAT_WEIGHTS, number>;

export interface IndustryRecord {
  industry_id: string;
  name: string;
  icon_key: string;
  /** 기간별 변화율 (%) */
  factors: Record<HeatPeriod, Factors>;
  /** 관련 기업 종목코드 */
  companies: string[];
}

const f = (price: number, trading: number, news: number): Factors => ({
  price_change_rate: price,
  trading_value_change_rate: trading,
  news_mention_change_rate: news,
});

export const industryRecords: IndustryRecord[] = [
  {
    industry_id: 'ai',
    name: 'AI',
    icon_key: 'ai',
    factors: { '1w': f(6.2, 48, 62), '1m': f(12.4, 60, 80) },
    companies: ['005930', '000660', '035420', '018260', '042700', '035720', '267260', '010120'],
  },
  {
    industry_id: 'semiconductor',
    name: '반도체',
    icon_key: 'semiconductor',
    factors: { '1w': f(4.8, 35, 40), '1m': f(10.1, 42, 55) },
    companies: [
      '005930',
      '000660',
      '042700',
      '000990',
      '403870',
      '058470',
      '039030',
      '240810',
      '036930',
      '095340',
      '357780',
      '005290',
      '009150',
      '011070',
    ],
  },
  {
    industry_id: 'shipbuilding',
    name: '조선',
    icon_key: 'shipbuilding',
    factors: { '1w': f(3.9, 28, 22), '1m': f(7.2, 30, 25) },
    companies: ['329180', '009540', '042660', '010140'],
  },
  {
    industry_id: 'defense',
    name: '방산',
    icon_key: 'defense',
    factors: { '1w': f(3.1, 30, 18), '1m': f(8.7, 35, 30) },
    companies: ['012450', '064350', '047810', '079550', '000880'],
  },
  {
    industry_id: 'battery',
    name: '2차전지',
    icon_key: 'battery',
    factors: { '1w': f(-1.3, 12, 15), '1m': f(-4.5, -8, 12) },
    companies: ['373220', '006400', '051910', '003670', '247540', '086520', '011790', '096770'],
  },
  {
    industry_id: 'bio',
    name: '바이오',
    icon_key: 'bio',
    factors: { '1w': f(1.2, 8, 10), '1m': f(3.0, 15, 18) },
    companies: [
      '207940',
      '068270',
      '196170',
      '000100',
      '128940',
      '326030',
      '302440',
      '006280',
      '185750',
      '028300',
      '141080',
      '145020',
    ],
  },
  {
    industry_id: 'internet',
    name: '인터넷·플랫폼',
    icon_key: 'internet',
    factors: { '1w': f(0.6, 5, 12), '1m': f(1.1, 6, 10) },
    companies: ['035420', '035720', '323410', '377300', '018260', '307950'],
  },
  {
    industry_id: 'auto',
    name: '자동차',
    icon_key: 'auto',
    factors: { '1w': f(0.9, 10, 6), '1m': f(1.8, 8, 4) },
    companies: [
      '005380',
      '000270',
      '012330',
      '086280',
      '161390',
      '204320',
      '018880',
      '011210',
      '073240',
    ],
  },
  {
    industry_id: 'finance',
    name: '금융',
    icon_key: 'finance',
    factors: { '1w': f(0.8, 4, 3), '1m': f(2.5, 10, 5) },
    companies: [
      '105560',
      '055550',
      '086790',
      '316140',
      '138040',
      '032830',
      '000810',
      '024110',
      '323410',
      '006800',
      '005830',
      '039490',
      '071050',
      '016360',
      '029780',
      '088350',
    ],
  },
  {
    industry_id: 'game',
    name: '게임',
    icon_key: 'game',
    factors: { '1w': f(-0.5, -3, 8), '1m': f(-2.2, -5, 6) },
    companies: ['259960', '036570', '251270', '263750', '293490', '112040'],
  },
];

const round1 = (value: number) => Math.round(value * 10) / 10;

export const heatScore = (factors: Factors) =>
  round1(
    (Object.keys(HEAT_WEIGHTS) as (keyof Factors)[]).reduce(
      (sum, key) => sum + factors[key] * HEAT_WEIGHTS[key],
      0,
    ),
  );

const levelOf = (rank: number): HeatLevel =>
  rank < HEAT_LEVEL_RANKS.high
    ? 'high'
    : rank < HEAT_LEVEL_RANKS.high + HEAT_LEVEL_RANKS.mid
      ? 'mid'
      : 'low';

/** 점수 높은 순 + 단계 */
export function hotIndustries(period: HeatPeriod): IndustrySummary[] {
  const { asOf } = lastClose();
  return industryRecords
    .map((record) => ({ record, score: heatScore(record.factors[period]) }))
    .sort((a, b) => b.score - a.score)
    .map(({ record, score }, rank) => ({
      industry_id: record.industry_id,
      name: record.name,
      icon_key: record.icon_key,
      heat_score: score,
      heat_level: levelOf(rank),
      headline_metric: {
        label: period === '1w' ? '최근 1주' : '최근 1개월',
        value: record.factors[period].price_change_rate,
        unit: '%',
      },
      as_of: asOf,
      is_sample: true,
    }));
}
