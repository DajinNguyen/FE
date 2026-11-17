import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CompanyPage } from '../src/pages/CompanyPage';
import type { CompareCompany } from '../src/types';
import { compareHighlights, compareSummary, compareValues } from '../src/utils/compareSummary';
import { renderWithProviders } from './testUtils';

const company = (name: string, patch: Partial<CompareCompany>): CompareCompany => ({
  stock_code: name,
  name,
  sector: '반도체',
  market_cap: null,
  is_financial: false,
  revenue: null,
  operating_income: null,
  operating_margin: null,
  revenue_growth: null,
  debt_ratio: null,
  unit: '조 원',
  ...patch,
});

const BANNED = /좋은 회사|더 좋|사세요|매수|매도|추천|오를|내릴/;

describe('한눈에 비교 규칙 문장 (compareSummary)', () => {
  it('차이가 큰 값의 10% 미만이면 비슷해요', () => {
    expect(compareValues(100, 91)).toBe('similar');
    expect(compareValues(100, 89)).toBe('left');
    expect(compareValues(10, 30)).toBe('right');
    expect(compareValues(null, 30)).toBeNull();
  });

  it('규모가 큰 쪽과 많이 남기는 쪽이 다르면 둘 다 한 줄에, 숫자는 화면 값 그대로', () => {
    const s = compareSummary(
      company('SK하이닉스', { revenue: 66.2, operating_margin: 35.5, revenue_growth: 102 }),
      company('삼성전자', { revenue: 300.9, operating_margin: 10.9, revenue_growth: 16.2 }),
    );
    expect(s.headline).toBe('삼성전자는 규모가 크고, SK하이닉스는 같은 매출에서 더 많이 남겨요');
    expect(s.points.map((p) => p.title)).toEqual([
      '규모 (매출)',
      '수익성 (영업이익률)',
      '성장 속도 (매출 증가율)',
    ]);
    expect(s.points[0].description).toBe(
      '삼성전자 매출이 더 커요. (SK하이닉스 66.2조 원, 삼성전자 300.9조 원)',
    );
    expect(s.points[1].description).toContain('SK하이닉스 35.5%, 삼성전자 10.9%');
    expect(s.points[2].description).toContain('SK하이닉스의 매출이 작년보다 더 빠르게 늘었어요');
  });

  it('비슷하면 "비슷해요", 받침에 맞게 은/는·이/가를 붙여요', () => {
    const s = compareSummary(
      company('NAVER', { revenue: 10.7, operating_margin: 18.5 }),
      company('카카오', { revenue: 10.0, operating_margin: -1.9 }),
    );
    expect(s.headline).toBe('두 회사 규모는 비슷하고, NAVER가 같은 매출에서 더 많이 남겨요');
    expect(s.points[0].description).toContain('두 회사 매출이 비슷해요');
    expect(s.points[1].description).toContain('카카오 −1.9%');
    expect(s.points).toHaveLength(2);
  });

  it('판단·추천 표현을 쓰지 않아요', () => {
    const cases: [Partial<CompareCompany>, Partial<CompareCompany>][] = [
      [
        { revenue: 1, operating_margin: 50, revenue_growth: 9 },
        { revenue: 9, operating_margin: 5, revenue_growth: 1 },
      ],
      [
        { revenue: 9, operating_margin: 50 },
        { revenue: 1, operating_margin: 5 },
      ],
      [
        { revenue: 5, operating_margin: 5 },
        { revenue: 5, operating_margin: 5 },
      ],
      [{}, {}],
    ];
    for (const [a, b] of cases) {
      const s = compareSummary(company('가', a), company('나', b));
      const text = [s.headline, ...s.points.map((p) => p.description)].join(' ');
      expect(text).not.toMatch(BANNED);
    }
  });
});

/** left = 지금 보는 기업(주소), right = 비교할 기업(with) */
const renderCompare = (left: string, right: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: `/companies/${left}?tab=compare&with=${right}` },
  );

describe('한눈에 비교 카드 데이터 (compareHighlights)', () => {
  it('두 값이 다 있는 지표만, 큰 쪽과 화면 값 그대로 돌려줘요', () => {
    const h = compareHighlights(
      company('삼성전자', { revenue: 300.9, operating_margin: 10.9, revenue_growth: null }),
      company('SK하이닉스', { revenue: 66.2, operating_margin: 35.5, revenue_growth: 102 }),
    );
    expect(h.map((x) => x.key)).toEqual(['revenue', 'operating_margin']);
    expect(h[0]).toMatchObject({
      winner: 'left',
      verdict: '삼성전자가 더 커요',
      leftValue: '300.9조 원',
      rightValue: '66.2조 원',
    });
    expect(h[1]).toMatchObject({
      winner: 'right',
      verdict: 'SK하이닉스는 더 많이 남겨요',
      leftValue: '10.9%',
      rightValue: '35.5%',
    });
  });

  it('비슷하면 winner 가 similar, 판단·추천 표현은 없어요', () => {
    const h = compareHighlights(
      company('가', { revenue: 10.7, operating_margin: 18.5, revenue_growth: 11 }),
      company('나', { revenue: 10.0, operating_margin: 5, revenue_growth: 10.5 }),
    );
    expect(h[0]).toMatchObject({ winner: 'similar', verdict: '비슷해요' });
    expect(h.map((x) => x.verdict).join(' ')).not.toMatch(BANNED);
  });
});

describe('한눈에 비교 화면', () => {
  it('AI 분석이 없으면 숫자 규칙 문장과 근거(기준·출처)를 보여주고, "왜 다른가요?"는 숨겨요', async () => {
    renderCompare('035420', '035720');
    const summary = await screen.findByRole('region', { name: '한눈에 비교' });
    expect(within(summary).getByText('숫자로 정리')).toBeInTheDocument();
    expect(summary).toHaveTextContent('NAVER는 규모가 크고 같은 매출에서 남기는 돈도 많아요');
    expect(within(summary).queryByText('왜 다른가요?')).not.toBeInTheDocument();
    expect(summary).toHaveTextContent('근거: 2025년 연간 · 연결 기준 재무 숫자 (NAVER, 카카오)');
    expect(summary).toHaveTextContent('출처: 금융감독원 DART 공시');
    expect(summary).toHaveTextContent('투자 추천이 아닌');
  });

  it('지표별 카드에서 큰 쪽 숫자에만 강조(data-win)를 줘요', async () => {
    renderCompare('035420', '035720');
    const summary = await screen.findByRole('region', { name: '한눈에 비교' });
    const card = (key: string) => summary.querySelector(`[data-metric="${key}"]`) as HTMLElement;

    const revenue = card('revenue');
    expect(within(revenue).getByText('NAVER가 더 커요')).toHaveAttribute('data-winner', 'left');
    expect(revenue.querySelector('[data-side="left"]')).toHaveAttribute('data-win', 'true');
    expect(revenue.querySelector('[data-side="left"]')).toHaveTextContent('10.7조 원');
    expect(revenue.querySelector('[data-side="right"]')).not.toHaveAttribute('data-win');
    expect(revenue.querySelector('[data-side="right"]')).toHaveTextContent('7.9조 원');
    expect(card('operating_margin')).toHaveTextContent('NAVER는 더 많이 남겨요');
    expect(card('revenue_growth')).toHaveTextContent('NAVER는 더 빠르게 늘었어요');
  });

  it('API 에 AI 분석이 있으면 그것을 보여주고 "왜 다른가요?"와 출처 링크가 나와요', async () => {
    renderCompare('005930', '000660');
    const summary = await screen.findByRole('region', { name: '한눈에 비교' });
    expect(within(summary).getByText('AI 분석')).toBeInTheDocument();
    expect(summary).toHaveTextContent(
      '삼성전자는 사업이 여러 갈래로 넓고, SK하이닉스는 메모리 반도체에 집중해요',
    );
    expect(within(summary).getByText('왜 다른가요?')).toBeInTheDocument();
    expect(within(summary).getByRole('link', { name: /삼성전자 2025 사업보고서/ })).toHaveAttribute(
      'href',
      'https://dart.fss.or.kr/',
    );
  });
});
