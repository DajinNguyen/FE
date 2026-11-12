import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PerformanceAnalysis } from '../src/features/financials/PerformanceAnalysis';
import { CompanyPage } from '../src/pages/CompanyPage';
import { renderWithProviders } from './testUtils';

const scrollIntoView = vi.fn();
Element.prototype.scrollIntoView = scrollIntoView;
afterEach(() => scrollIntoView.mockClear());

describe('최근 사업 성과 상세 분석', () => {
  it('개요의 [자세히 보기]를 누르면 재무 상세의 "최근 사업 성과 분석"으로 이동해요', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/companies/:stockCode" element={<CompanyPage />} />
      </Routes>,
      { route: '/companies/005930' },
    );
    await userEvent.click(await screen.findByRole('button', { name: '자세히 보기' }));

    expect(screen.getByRole('tab', { name: '재무 상세' })).toHaveAttribute('aria-selected', 'true');
    const section = screen.getByRole('region', { name: '최근 사업 성과 분석' });
    expect(section).toHaveAttribute('id', 'performance-analysis');
    expect(scrollIntoView.mock.contexts).toContain(section);
  });

  it('실적 요약·비교와 최근 8분기 매출·영업이익·영업이익률을 모두 보여줘요', async () => {
    renderWithProviders(<PerformanceAnalysis stockCode="005930" />);
    await screen.findByText('실적 요약');
    const section = screen.getByRole('region', { name: '최근 사업 성과 분석' });
    expect(section).toHaveTextContent('2025년 4분기 · 2026년 1월 29일 발표');
    expect(section).toHaveTextContent('영업이익률21.4%');
    expect(section).toHaveTextContent('작년 같은 분기보다 (24.4Q)');
    expect(section).toHaveTextContent('75.8조 원 → ▲늘었어요 +23.7%');

    const rows = within(screen.getByRole('table', { name: /분기별/ })).getAllByRole('row');
    expect(rows).toHaveLength(1 + 8);
    expect(rows[8]).toHaveTextContent('25.4Q93.8조 원20.1조 원21.4%');
    expect(rows[1]).toHaveTextContent('24.1Q71.9조 원6.6조 원9.2%');
  });

  it('사업별 영업이익이 없으면 매출만 보여주고, 이유에는 근거 칩(공시·뉴스, 날짜)이 붙어요', async () => {
    renderWithProviders(<PerformanceAnalysis stockCode="005930" />);
    const harman = (await screen.findByText('하만(전장·오디오)')).closest('li')!;
    expect(harman).toHaveTextContent('매출4.6조 원');
    expect(harman).not.toHaveTextContent('영업이익');

    const ds = screen.getByText('DS(반도체)').closest('li')!;
    expect(ds).toHaveTextContent('영업이익16.4조 원');

    const reasons = screen.getByText('AI용 메모리 판매가 크게 늘었어요').closest('li')!;
    const chips = within(reasons).getAllByRole('link');
    expect(chips[0]).toHaveTextContent('공시2025년 4분기 실적 발표 · 1월 29일');
    expect(chips[1]).toHaveTextContent('뉴스HBM 공급 확대 보도 · 1월 15일');
  });

  it('자료가 없는 기업은 "자료가 없어요"를 보여줘요', async () => {
    renderWithProviders(<PerformanceAnalysis stockCode="000660" />);
    expect(await screen.findByText('자료가 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
