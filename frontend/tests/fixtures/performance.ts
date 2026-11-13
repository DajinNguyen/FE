/** 재무 상세 "최근 사업 성과 분석" 테스트 데이터 (테스트 전용, 실제 값과 다를 수 있어요) */
import type { PerformanceDetail } from '../../src/types';

const q = (quarter: string, revenue: number, operating_income: number) => ({
  quarter,
  revenue,
  operating_income,
  operating_margin: Math.round((operating_income / revenue) * 1000) / 10,
});

export const performanceDetails: Record<string, PerformanceDetail> = {
  '005930': {
    period_label: '2025년 4분기',
    announced_at: '2026-01-29',
    unit: '조 원',
    summary: { revenue: 93.8, operating_income: 20.1, operating_margin: 21.4 },
    yoy: { revenue_rate: 23.7, operating_income_rate: 209.2 },
    qoq: { revenue_rate: 8.9, operating_income_rate: 64.8 },
    quarterly: [
      q('24.1Q', 71.9, 6.6),
      q('24.2Q', 74.1, 10.4),
      q('24.3Q', 79.1, 9.2),
      q('24.4Q', 75.8, 6.5),
      q('25.1Q', 79.1, 6.7),
      q('25.2Q', 74.6, 4.7),
      q('25.3Q', 86.1, 12.2),
      q('25.4Q', 93.8, 20.1),
    ],
    segments: [
      {
        name: 'DS(반도체)',
        revenue: 44.0,
        operating_income: 16.4,
        yoy_rate: 45.2,
        comment: 'AI 서버용 메모리(HBM) 판매가 늘었어요.',
      },
      {
        name: 'MX·네트워크(스마트폰 등)',
        revenue: 29.3,
        operating_income: 1.9,
        yoy_rate: 2.1,
        comment: '새 스마트폰 판매는 작년과 비슷했어요.',
      },
      {
        name: 'SDC(디스플레이)',
        revenue: 9.5,
        operating_income: 1.5,
        yoy_rate: -6.4,
        comment: '스마트폰용 화면 주문이 조금 줄었어요.',
      },
      {
        name: '하만(전장·오디오)',
        revenue: 4.6,
        operating_income: null,
        yoy_rate: 9.5,
        comment: '자동차용 오디오·전장 주문이 늘었어요.',
      },
    ],
    reasons: [
      {
        title: 'AI용 메모리 판매가 크게 늘었어요',
        description:
          'AI 서버에 들어가는 고성능 메모리(HBM) 주문이 늘면서 반도체 매출과 이익이 함께 늘었어요.',
        evidence: [
          {
            type: 'disclosure',
            label: '2025년 4분기 실적 발표',
            date: '2026-01-29',
            url: 'https://dart.fss.or.kr/',
          },
          {
            type: 'news',
            label: 'HBM 공급 확대 보도',
            date: '2026-01-15',
            url: 'https://example.com/news/hbm',
          },
        ],
      },
      {
        title: '메모리 값이 올랐어요',
        description: '메모리 반도체 가격이 오르면서 같은 양을 팔아도 매출이 더 커졌어요.',
        evidence: [
          {
            type: 'news',
            label: 'D램 가격 상승 보도',
            date: '2026-01-08',
            url: 'https://example.com/news/dram',
          },
        ],
      },
      {
        title: '디스플레이는 조금 줄었어요',
        description: '스마트폰용 화면 주문이 줄어 디스플레이 매출은 작년보다 적었어요.',
        evidence: [
          {
            type: 'disclosure',
            label: '2025년 4분기 실적 발표',
            date: '2026-01-29',
            url: 'https://dart.fss.or.kr/',
          },
        ],
      },
    ],
    source: {
      title: '삼성전자 2025년 4분기 연결 실적',
      date: '2026-01-29',
      url: 'https://dart.fss.or.kr/',
    },
  },
};
