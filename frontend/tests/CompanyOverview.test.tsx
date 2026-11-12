import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RecentPerformance } from '../src/features/overview/RecentPerformance';
import { CompanyPage } from '../src/pages/CompanyPage';
import { renderWithProviders } from './testUtils';

const renderOverview = (stockCode: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: `/companies/${stockCode}` },
  );

describe('기업 개요', () => {
  it('소속 산업 칩은 산업 페이지로 가고, 최근 사업 성과에 매출·영업이익·사업별 매출·출처가 있어요', async () => {
    renderOverview('005930');

    const chip = await screen.findByRole('link', { name: '반도체 산업 보기' });
    expect(chip).toHaveAttribute('href', '/industries/semiconductor');

    const perf = await screen.findByRole('region', { name: '최근 사업 성과' });
    expect(perf).toHaveTextContent('2025년 4분기 실적 · 2026년 1월 발표');
    expect(perf).toHaveTextContent('매출93.8조 원');
    expect(perf).toHaveTextContent('영업이익20.1조 원');
    expect(perf).toHaveTextContent('DS(반도체)44조 원');
    expect(
      within(perf).getByRole('link', { name: /삼성전자 2025년 4분기 실적 발표/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI 분석 보기' })).toBeInTheDocument();
  });

  it('실적 자료가 없는 기업은 안내 문구를 보여줘요', async () => {
    // 테스트 데이터에는 000660 의 재무 자료가 없어요 (서버가 404 로 답해요)
    renderWithProviders(<RecentPerformance stockCode="000660" onGoToTab={() => {}} />);
    expect(await screen.findByText('최근 실적 발표 자료가 아직 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('무슨 사업 → 최근 사업 성과 → 주가 흐름 → AI 분석 보기 순서로 놓여요 (모바일 순서와 같아요)', async () => {
    renderOverview('005930');
    const business = await screen.findByRole('region', { name: '무슨 사업을 하나요?' });
    const perf = await screen.findByRole('region', { name: '최근 사업 성과' });
    const price = screen.getByRole('region', { name: '주가 흐름' });
    const cta = screen.getByRole('button', { name: 'AI 분석 보기' });

    const before = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(before(business, perf)).toBe(true);
    expect(before(perf, price)).toBe(true);
    expect(before(price, cta)).toBe(true);
    expect(business).toHaveTextContent('시가총액');
  });
});
