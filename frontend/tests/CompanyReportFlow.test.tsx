import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { CompanyPage } from '../src/pages/CompanyPage';
import { renderWithProviders } from './testUtils';

const renderCompanyPage = (stockCode: string, tab = 'analysis') =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: tab ? `/companies/${stockCode}?tab=${tab}` : `/companies/${stockCode}` },
  );

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('기업 화면 탭', () => {
  it('검색 후 들어오면 개요가 기본이고, 탭은 개요·AI 분석·재무 상세·뉴스 상세·커뮤니티예요', async () => {
    const user = userEvent.setup();
    renderCompanyPage('005930', '');

    expect(await screen.findByRole('tab', { name: '개요', selected: true })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      '개요',
      'AI 분석',
      '재무 상세',
      '뉴스 상세',
      '커뮤니티',
    ]);
    expect(await screen.findByRole('heading', { name: '무슨 사업을 하나요?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'AI 분석 보기' }));
    expect(screen.getByRole('tab', { name: 'AI 분석', selected: true })).toBeInTheDocument();
    expect(
      await screen.findByRole('region', { name: '지금 어떤 상황인가요?' }),
    ).toBeInTheDocument();
  });
});

describe('기업 화면: AI 분석', () => {
  it('AI 한 줄 결론과, 질문 3개로 묶은 핵심 포인트 5줄을 보여줘요', async () => {
    renderCompanyPage('005930');

    expect(await screen.findByRole('tab', { name: 'AI 분석', selected: true })).toBeInTheDocument();
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
    expect(within(now).queryByText('왜 그런가요?')).not.toBeInTheDocument();
    // 기업 헤더에는 한 줄 소개 문장을 쓰지 않아요.
    expect(screen.queryByText('스마트폰과 반도체를 만드는 회사예요')).not.toBeInTheDocument();
  });

  it('핵심 경쟁력은 "좋은 점", 위험 요인은 "지켜볼 점" 라벨이 붙고, 상세 시트에도 같은 라벨이 나와요', async () => {
    const user = userEvent.setup();
    renderCompanyPage('005930');

    const company = await screen.findByRole('region', { name: '어떤 회사인가요?' });
    const now = screen.getByRole('region', { name: '지금 어떤 상황인가요?' });
    const watch = screen.getByRole('region', { name: '무엇을 조심해야 하나요?' });

    const strength = within(company).getByRole('button', { name: /경쟁력이에요/ });
    expect(strength).toHaveTextContent('좋은 점');
    expect(strength.closest('li')).toHaveAttribute('data-tone', 'positive');
    const risk = within(watch).getByRole('button', { name: /흔들릴 수 있어요/ });
    expect(risk).toHaveTextContent('지켜볼 점');
    expect(risk.closest('li')).toHaveAttribute('data-tone', 'caution');
    // 나머지 포인트에는 라벨이 없어요.
    expect(within(now).queryByText(/좋은 점|지켜볼 점/)).not.toBeInTheDocument();

    await user.click(risk);
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('지켜볼 점')).toBeInTheDocument();
  });

  it('포인트를 누르면 상세 시트에 과거 → 현재 숫자, 이유·의미, 연도별 매출·영업이익 막대(값 표시), 근거 뉴스·공시가 나와요', async () => {
    const user = userEvent.setup();
    renderCompanyPage('005930');

    const now = await screen.findByRole('region', { name: '지금 어떤 상황인가요?' });
    await user.click(
      within(now).getByRole('button', { name: /3년 동안 매출과 이익이 함께 늘었어요/ }),
    );

    const sheet = screen.getByRole('dialog', { name: '3년 동안 매출과 이익이 함께 늘었어요' });
    expect(within(sheet).getByText('왜 그런가요?')).toBeInTheDocument();
    expect(within(sheet).getByText(/6\.57조 원/)).toBeInTheDocument();
    const yearly = within(sheet).getByRole('region', { name: '연도별 매출과 영업이익' });
    expect(within(yearly).getAllByRole('img')).toHaveLength(2);
    expect(
      within(yearly).getByRole('img', {
        name: /연도별 매출 2023년 258\.94조 원, 2024년 300\.9조 원, 2025년 333\.6조 원/,
      }),
    ).toBeInTheDocument();
    expect(within(sheet).getByRole('region', { name: '근거 뉴스' })).toHaveTextContent(
      '2025년 4분기',
    );
    expect(within(sheet).getByRole('region', { name: '근거 공시' })).toHaveTextContent(
      '2026.01.29',
    );
    expect(
      within(sheet).getByRole('button', { name: '재무제표 2025 사업보고서' }),
    ).toBeInTheDocument();

    await user.click(within(sheet).getByRole('button', { name: '시트 닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByText(/이 리포트는 재무 2025년 사업보고서 · 주가 10월 5일 · 뉴스 1월 29일 기준/),
    ).toBeInTheDocument();
  });

  it('핵심 분석 아래에 재무·뉴스와 겹치는 근거 자료 섹션이 없고, 근거 칩을 누르면 재무 상세·뉴스 상세 탭으로 가요', async () => {
    const user = userEvent.setup();
    renderCompanyPage('005930');

    const panel = await screen.findByRole('tabpanel', { name: 'AI 분석' });
    await within(panel).findByRole('region', { name: '지금 어떤 상황인가요?' });
    for (const name of ['근거 자료', '재무 핵심 수치', '관련 뉴스', '기업 비전']) {
      expect(within(panel).queryByRole('region', { name })).not.toBeInTheDocument();
    }
    expect(within(panel).getByText(/투자 추천이 아닌 교육용 정보예요/)).toBeInTheDocument();

    const now = within(panel).getByRole('region', { name: '지금 어떤 상황인가요?' });
    await user.click(
      within(now).getByRole('button', { name: /3년 동안 매출과 이익이 함께 늘었어요/ }),
    );
    await user.click(screen.getByRole('button', { name: '재무제표 2025 사업보고서' }));
    expect(screen.getByRole('tab', { name: '재무 상세', selected: true })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'AI 분석' }));
    const tech = await screen.findByRole('button', {
      name: /AI용 메모리\(HBM\)를 만드는 기술이 경쟁력이에요/,
    });
    await user.click(tech);
    await user.click(screen.getByRole('button', { name: /^뉴스/ }));
    expect(screen.getByRole('tab', { name: '뉴스 상세', selected: true })).toBeInTheDocument();
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
    renderCompanyPage('005930', '');

    await user.click(await screen.findByRole('tab', { name: '재무 상세' }));
    const panel = screen.getByRole('tabpanel', { name: '재무 상세' });
    expect(within(panel).getByText('자세한 데이터를 보는 화면이에요.')).toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: '개요로 돌아가기' }));
    expect(screen.getByRole('tab', { name: '개요', selected: true })).toBeInTheDocument();
  });
});
