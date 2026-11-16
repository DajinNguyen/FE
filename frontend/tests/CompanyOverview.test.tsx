import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RecentPerformance } from '../src/features/overview/RecentPerformance';
import { CompanyPage } from '../src/pages/CompanyPage';
import { performanceDetails } from './fixtures/performance';
import { renderWithProviders } from './testUtils';

const renderOverview = (stockCode: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: `/companies/${stockCode}` },
  );

describe('기업 개요', () => {
  it('소속 산업 칩은 산업 페이지로 가요', async () => {
    renderOverview('005930');
    const chip = await screen.findByRole('link', { name: '반도체 산업 보기' });
    expect(chip).toHaveAttribute('href', '/industries/semiconductor');
  });

  it('최근 사업 성과: 제목·핵심 숫자 2개·작년 대비·AI 요약·사업별 막대(큰 순서)·출처·자세히 보기', async () => {
    renderWithProviders(<RecentPerformance stockCode="005930" onGoToTab={() => {}} />);
    await screen.findByText('AI 한 줄 요약');
    const perf = screen.getByRole('region', { name: '최근 사업 성과' });
    expect(perf).toHaveTextContent('2025년 4분기 실적 · 2026년 1월 발표');
    expect(perf).toHaveTextContent('매출93.8조 원작년 같은 분기보다 ▲늘었어요+23.7%');
    expect(perf).toHaveTextContent('영업이익20.1조 원작년 같은 분기보다 ▲늘었어요+209.2%');
    expect(perf).toHaveTextContent(
      'AI 한 줄 요약 AI용 메모리(HBM) 판매가 늘면서 분기 기준 가장 많은 매출을 냈어요.',
    );

    // 사업별 매출: 매출 큰 순서, 금액은 소수 첫째 자리까지, 가장 큰 사업이 100%
    const rows = within(perf).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      'DS(반도체)44.0조 원',
      'MX·네트워크(스마트폰 등)29.3조 원',
      'SDC(디스플레이)9.5조 원',
      '하만(전장·오디오)4.6조 원',
    ]);
    expect(rows[0].querySelector('[data-bar]')).toHaveStyle({ width: '100%' });
    expect(rows[3].querySelector('[data-bar]')).toHaveStyle({ width: `${(4.6 / 44) * 100}%` });

    expect(
      within(perf).getByRole('link', { name: /삼성전자 2025년 4분기 연결 실적/ }),
    ).toHaveAttribute('target', '_blank');
    expect(perf).toHaveTextContent('1월 29일 공시');
    expect(within(perf).getByRole('button', { name: '자세히 보기' })).toBeInTheDocument();
  });

  it('개요와 재무 상세는 같은 데이터(같은 hook·같은 요청)를 써요', async () => {
    const user = userEvent.setup();
    renderOverview('005930');
    await screen.findByText('AI 한 줄 요약');
    await user.click(screen.getByRole('button', { name: '자세히 보기' }));
    await screen.findByText('실적 요약');

    const calls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(calls.filter((u) => u.endsWith('/api/companies/005930/performance'))).toHaveLength(1);
  });

  it('일부 자료만 있으면 있는 블록만, 전부 없으면 "아직 최근 실적 자료가 없어요"', async () => {
    performanceDetails['000660'] = {
      ...performanceDetails['005930'],
      summary: null,
      ai_summary: null,
      segments: [],
    };
    try {
      renderWithProviders(<RecentPerformance stockCode="000660" onGoToTab={() => {}} />);
      const source = await screen.findByText(/출처/);
      expect(screen.queryByText('AI 한 줄 요약')).not.toBeInTheDocument();
      expect(screen.queryByText('사업별 매출')).not.toBeInTheDocument();
      expect(source).toBeInTheDocument();
    } finally {
      delete performanceDetails['000660'];
    }
  });

  it('실적 자료가 없는 기업은 안내 문구를 보여줘요', async () => {
    // 테스트 데이터에는 000660 의 실적 자료가 없어요 (서버가 404 로 답해요)
    renderWithProviders(<RecentPerformance stockCode="000660" onGoToTab={() => {}} />);
    expect(await screen.findByText('아직 최근 실적 자료가 없어요')).toBeInTheDocument();
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
