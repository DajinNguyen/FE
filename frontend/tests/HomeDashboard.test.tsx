import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AdSlot } from '../src/components/AdSlot';
import { HomePage } from '../src/pages/HomePage';
import { TradingRankingPage } from '../src/pages/TradingRankingPage';
import { renderWithProviders } from './testUtils';

describe('메인 화면', () => {
  it('맨 위에 오늘의 시장 한마디가 페이지 제목으로 나오고, 검색창이 있고 검색 예시 칩은 없어요', async () => {
    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: '반도체 강세에 코스피가 1% 넘게 올랐어요',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '기업 검색' })).toBeInTheDocument();
    expect(screen.queryByText('이렇게 찾아보세요')).not.toBeInTheDocument();
  });

  it('기업 둘러보기는 업종별 기업이 먼저 나오고, 업종 탭으로 바꿔 볼 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    const browse = await screen.findByRole('region', { name: '기업 둘러보기' });
    const tabs = within(browse)
      .getAllByRole('tab')
      .map((tab) => tab.textContent);
    expect(tabs).toEqual(['반도체', '자동차', '인터넷', '금융', '식품', '기타']);

    await user.click(within(browse).getByRole('tab', { name: '식품' }));
    expect(within(browse).getByText('오리온')).toBeInTheDocument();
  });

  it('거래 많은 기업은 기준일과 함께 5개만 작게 보여주고, AI 결론이 없는 줄은 숨겨요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    const browse = await screen.findByRole('region', { name: '기업 둘러보기' });
    await user.click(within(browse).getByRole('radio', { name: '거래 많은 기업' }));
    expect(within(browse).getByText(/기준 · 거래대금 순/)).toBeInTheDocument();
    const rows = within(within(browse).getByRole('list', { name: '거래 많은 기업' })).getAllByRole(
      'listitem',
    );
    expect(rows).toHaveLength(5);
    // 삼성전자만 리포트가 있어서 AI 결론이 보여요.
    expect(within(rows[0]).getByText('AI 결론')).toBeInTheDocument();
    expect(within(rows[1]).queryByText('AI 결론')).not.toBeInTheDocument();
    expect(within(browse).getByRole('link', { name: /전체 보기/ })).toHaveAttribute(
      'href',
      '/rankings/trading',
    );
  });

  it('떠오르는 기업과 광고는 숨기고, 맨 아래에 용어 학습으로 가는 한 줄이 있어요', async () => {
    renderWithProviders(<HomePage />);
    const browse = await screen.findByRole('region', { name: '기업 둘러보기' });
    expect(within(browse).queryByRole('radio', { name: '떠오르는 기업' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('광고')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /용어 학습/ })).toHaveAttribute('href', '/terms');
  });

  it('전체 보기 화면은 순위 30개를 보여줘요', async () => {
    renderWithProviders(<TradingRankingPage />);
    const list = await screen.findByRole('list', { name: '거래대금 순위' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(30);
  });

  it('광고 자리는 VITE_SHOW_ADS 를 켜지 않으면 보이지 않아요', () => {
    renderWithProviders(<AdSlot placement="test" />);
    expect(screen.queryByLabelText('광고')).not.toBeInTheDocument();
  });
});
