import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EvidenceSection } from '../src/features/evidence/EvidenceSection';
import { CompanyPage } from '../src/pages/CompanyPage';
import { renderWithProviders } from './testUtils';

const renderCompanyPage = (stockCode: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: `/companies/${stockCode}` },
  );

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('기업 화면: AI 핵심 분석 중심', () => {
  it('처음에는 개요 탭에서 AI 한 줄 결론과 핵심 포인트 5개를 보여줘요', async () => {
    renderCompanyPage('005930');

    expect(await screen.findByRole('tab', { name: '개요', selected: true })).toBeInTheDocument();
    expect(
      await screen.findByText('AI용 메모리가 잘 팔리면서 3년 만에 이익이 크게 늘어난 회사예요', {
        exact: false,
      }),
    ).toBeInTheDocument();

    const points = screen.getByRole('list', { name: '핵심 포인트' });
    const items = within(points).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(within(points).getByText('실적 특징')).toBeInTheDocument();
    expect(within(points).getByText('핵심 경쟁력')).toBeInTheDocument();
    // 과거 → 현재
    expect(within(items[0]).getByText('6.57조 원')).toBeInTheDocument();
    expect(within(items[0]).getByText('43.6조 원')).toBeInTheDocument();
    expect(screen.getByText('이 분석의 근거')).toBeInTheDocument();
  });

  it('포인트 카드를 누르면 이유·해석과 근거 칩이 펼쳐져요', async () => {
    const user = userEvent.setup();
    renderCompanyPage('005930');

    const points = await screen.findByRole('list', { name: '핵심 포인트' });
    const [first] = within(points).getAllByRole('button', { expanded: false });
    expect(within(points).getAllByText('왜 그런가요?')[0]).not.toBeVisible();

    await user.click(first);

    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(within(points).getAllByText('왜 그런가요?')[0]).toBeVisible();
    expect(within(points).getAllByRole('button', { name: '재무제표' })[0]).toBeVisible();
  });

  it('리포트가 없는 기업은 "아직 이 기업의 리포트가 없어요"를 보여주고, 실패하면 원인과 다시 시도를 보여줘요', async () => {
    const user = userEvent.setup();
    renderCompanyPage('000660');

    expect(await screen.findByText('아직 이 기업의 리포트가 없어요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'AI 리포트 만들기' }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('리포트를 만들지 못했어요')).toBeInTheDocument();
    expect(within(alert).getByText(/재무제표를 아직 불러오지 못했어요/)).toBeInTheDocument();
    expect(within(alert).getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('다시 만들기가 실패해도 기존 리포트는 그대로 두고 토스트로 알려요', async () => {
    window.history.replaceState(null, '', '/?mock_report=fail');
    const user = userEvent.setup();
    renderCompanyPage('005930');

    await user.click(await screen.findByRole('button', { name: '다시 만들기' }));

    expect(
      await screen.findByText('리포트를 다시 만들지 못했어요. 기존 리포트를 보여드릴게요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '핵심 포인트' })).toBeInTheDocument();
  });

  it('상세 탭에는 안내와 "개요로 돌아가기"가 있어요', async () => {
    const user = userEvent.setup();
    renderCompanyPage('005930');

    await user.click(await screen.findByRole('tab', { name: '재무 상세' }));
    const panel = screen.getByRole('tabpanel', { name: '재무 상세' });
    expect(within(panel).getByText('자세한 데이터를 보는 화면이에요.')).toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: '개요로 돌아가기' }));
    expect(screen.getByRole('tab', { name: '개요', selected: true })).toBeInTheDocument();
  });
});

describe('근거 자료', () => {
  it('일부 자료가 없으면 그 자리에만 "자료를 찾지 못했어요"를 보여줘요', () => {
    renderWithProviders(
      <EvidenceSection
        evidence={{
          financials: null,
          news: [],
          vision: {
            summary: '스마트폰과 반도체를 만드는 회사예요.',
            revenue_mix: [],
            source: '사업보고서',
          },
        }}
        onGoToTab={vi.fn()}
      />,
    );

    expect(screen.getAllByText('자료를 찾지 못했어요')).toHaveLength(2);
    expect(screen.getByText('스마트폰과 반도체를 만드는 회사예요.')).toBeInTheDocument();
  });
});
