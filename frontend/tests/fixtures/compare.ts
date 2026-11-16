/**
 * 비교하기 테스트 데이터 (2025년 연간 · 연결 기준, 단위 조 원·%). 앱 코드에서는 쓰지 않아요.
 * 없는 회사는 숫자가 모두 null 이에요.
 */
import type {
  CompareAnalysis,
  CompareCompany,
  CompanyCompare,
  CompanySummary,
} from '../../src/types';

type Numbers = Pick<
  CompareCompany,
  'revenue' | 'operating_income' | 'operating_margin' | 'revenue_growth' | 'debt_ratio'
> & { market_cap: number; is_financial?: boolean; basis?: string };

const numbers: Record<string, Numbers> = {
  '005930': {
    market_cap: 760,
    revenue: 300.9,
    operating_income: 32.7,
    operating_margin: 10.9,
    revenue_growth: 16.2,
    debt_ratio: 27.9,
  },
  '000660': {
    market_cap: 300,
    revenue: 66.2,
    operating_income: 23.5,
    operating_margin: 35.5,
    revenue_growth: 102.0,
    debt_ratio: 47.7,
  },
  '042700': {
    market_cap: 9.5,
    revenue: 0.56,
    operating_income: 0.25,
    operating_margin: 44.6,
    revenue_growth: 251.0,
    debt_ratio: 31.2,
  },
  '000990': {
    market_cap: 1.8,
    revenue: 1.13,
    operating_income: 0.18,
    operating_margin: 15.9,
    revenue_growth: -2.4,
    debt_ratio: 28.4,
  },
  '035420': {
    market_cap: 39,
    revenue: 10.7,
    operating_income: 1.98,
    operating_margin: 18.5,
    revenue_growth: 11.0,
    debt_ratio: 52.1,
  },
  '035720': {
    market_cap: 17,
    revenue: 7.9,
    operating_income: -0.15,
    operating_margin: -1.9,
    revenue_growth: -1.6,
    debt_ratio: 92.3,
  },
  '105560': {
    market_cap: 40,
    revenue: 16.3,
    operating_income: 7.1,
    operating_margin: 43.6,
    revenue_growth: 5.2,
    debt_ratio: null,
    is_financial: true,
  },
  // 기준이 다른 예 (별도 기준)
  '097950': {
    market_cap: 4.3,
    revenue: 29.4,
    operating_income: 1.5,
    operating_margin: 5.1,
    revenue_growth: -0.8,
    debt_ratio: 118.0,
    basis: '별도 기준',
  },
};

export function compareCompany(company: CompanySummary): CompareCompany {
  const n = numbers[company.stock_code];
  return {
    stock_code: company.stock_code,
    name: company.name,
    sector: company.sector,
    market_cap: n?.market_cap ?? null,
    is_financial: n?.is_financial ?? company.sector_group === 'finance',
    revenue: n?.revenue ?? null,
    operating_income: n?.operating_income ?? null,
    operating_margin: n?.operating_margin ?? null,
    revenue_growth: n?.revenue_growth ?? null,
    debt_ratio: n?.debt_ratio ?? null,
    unit: '조 원',
    base_period: '2025년 연간',
    basis: n?.basis ?? '연결 기준',
  };
}

/** 삼성전자 ↔ SK하이닉스 는 AI 분석이 있는 예 (나머지는 규칙 문장) */
const memoryAnalysis = (left: string, right: string): CompareAnalysis | null => {
  const pair = [left, right].sort().join(',');
  if (pair !== '000660,005930') return null;
  return {
    headline: '삼성전자는 사업이 여러 갈래로 넓고, SK하이닉스는 메모리 반도체에 집중해요',
    points: [
      { title: '규모', description: '삼성전자 매출이 더 커요. 스마트폰·가전까지 함께 팔아서예요.' },
      {
        title: '수익성',
        description: 'SK하이닉스가 같은 매출에서 더 많이 남겼어요. AI용 메모리 판매가 늘었어요.',
      },
    ],
    reason:
      '삼성전자는 반도체·스마트폰·가전을 함께 하고, SK하이닉스는 메모리 반도체 한 가지에 집중해요.',
    sources: [
      { title: '삼성전자 2025 사업보고서', url: 'https://dart.fss.or.kr/', date: '2026-03-12' },
      {
        title: 'SK하이닉스 2025 사업보고서',
        url: 'https://dart.fss.or.kr/?sk',
        date: '2026-03-14',
      },
    ],
  };
};

export function buildCompare(left: CompanySummary, right: CompanySummary): CompanyCompare {
  return {
    base_period: '2025년 연간',
    basis: '연결 기준',
    left: compareCompany(left),
    right: compareCompany(right),
    analysis: memoryAnalysis(left.stock_code, right.stock_code),
  };
}
