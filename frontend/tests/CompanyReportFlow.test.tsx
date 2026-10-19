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
  it('처음에는 AI 한 줄 결론과, 질문 3개로 묶은 핵심 포인트 5줄을 보여줘요', async () => {
    renderCompanyPage('005930');

    expect(await screen.findByRole('tab', { name: '개요', selected: true })).toBeInTheDocument();
    expect(
      await screen.findByText('AI용 메모리가 잘 팔리면서 3년 만에 이익이 크게 늘어난 회사예요', {
        exact: false,
      }),
    ).toBeInTheDocument();

    const company = screen.getByRole('region', { name: '어떤 회사인가요?' });
    const now = screen.getByRole('region', { name: '지금 어떤 상황인가요?' });
    const watch = screen.getByRole('region', { name: '무엇을 조심해야 하나요?' });
    expect(within(company).getAllByRole('listitem')).toHaveLength(2);
    expect(within(now).getAllByRole('listitem')).toHaveLength(2);
    expect(within(watch).getAllByRole('listitem')).toHaveLength(1);

    // 한 줄에는 결론 문장과 핵심 숫자만, 이유는 접혀 있어요.
    const first = within(now).getByRole('button', { name: /3년 동안 매출과 이익이 함께 늘었어요/ });
    expect(first).toHaveTextContent('43.6조 원');
    expect(first).toHaveTextContent('6.6배');
    expect(within(now).getAllByText('왜 그런가요?')[0]).not.toBeVisible();
    expect(screen.getByText('이 분석의 근거')).toBeInTheDocument();
  });

  it('한 줄을 누르면 과거 → 현재 숫자, 이유·의미, 출처·날짜가 붙은 근거가 펼쳐져요', async () => {
    const user = userEvent.setup();
    renderCompanyPage('005930');

    const now = await screen.findByRole('region', { name: '지금 어떤 상황인가요?' });
    const first = within(now).getByRole('button', { name: /3년 동안 매출과 이익이 함께 늘었어요/ });
    await user.click(first);

    expect(first).toHaveAttribute('aria-expanded', 'true');
    const item = first.closest('li')!;
    expect(within(item).getByText('왜 그런가요?')).toBeVisible();
    expect(within(item).getByText(/6\.57조 원/)).toBeVisible();
    expect(within(item).getByRole('button', { name: '재무제표 2025 사업보고서' })).toBeVisible();
    expect(
      screen.getByText(/이 리포트는 재무 2025년 사업보고서 · 주가 10월 5일 · 뉴스 1월 29일 기준/),
    ).toBeInTheDocument();
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
    expect(screen.getByRole('region', { name: '지금 어떤 상황인가요?' })).toBeInTheDocument();
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
