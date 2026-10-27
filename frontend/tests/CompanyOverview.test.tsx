import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
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
    renderOverview('000660');
    const perf = await screen.findByRole('region', { name: '최근 사업 성과' });
    expect(perf).toHaveTextContent('최근 실적 발표 자료를 아직 불러오지 못했어요.');
  });
});
