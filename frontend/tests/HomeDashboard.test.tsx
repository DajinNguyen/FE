import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AdSlot } from '../src/components/AdSlot';
import { HomePage } from '../src/pages/HomePage';
import { TradingRankingPage } from '../src/pages/TradingRankingPage';
import { renderWithProviders } from './testUtils';

describe('메인 화면', () => {
  it('서비스 한 줄 설명, 검색창, 검색 예시, 3단계 설명을 보여줘요', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '궁금한 기업을 검색하면, AI가 재무제표·뉴스·사업 방향을 근거로 쉽게 설명해 드려요',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '기업 검색' })).toBeInTheDocument();
    for (const name of ['삼성전자', 'SK하이닉스', '현대차']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    const steps = screen.getByRole('list', { name: '다진이 하는 일' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(3);
  });

  it('거래가 많은 기업은 기준일과 함께 10개까지 순위 리스트로 보여주고, AI 결론이 없는 줄은 숨겨요', async () => {
    renderWithProviders(<HomePage />);

    const trading = await screen.findByRole('region', { name: '오늘 거래가 많은 기업' });
    expect(within(trading).getByText(/장 마감 기준 · 거래대금 순/)).toBeInTheDocument();
    const rows = within(trading).getAllByRole('listitem');
    expect(rows).toHaveLength(10);
    // 삼성전자만 리포트가 있어서 AI 결론이 보여요.
    expect(within(rows[0]).getByText('AI 결론')).toBeInTheDocument();
    expect(within(rows[1]).queryByText('AI 결론')).not.toBeInTheDocument();
    expect(within(trading).getByRole('link', { name: /전체 보기/ })).toHaveAttribute(
      'href',
      '/rankings/trading',
    );
  });

  it('업종 탭을 바꾸면 그 업종의 기업을 보여주고, 떠오르는 기업과 광고는 숨겨요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    const sectors = await screen.findByRole('region', { name: '업종별 기업' });
    const tabs = within(sectors)
      .getAllByRole('tab')
      .map((tab) => tab.textContent);
    expect(tabs).toEqual(['반도체', '자동차', '인터넷', '금융', '식품', '기타']);

    await user.click(within(sectors).getByRole('tab', { name: '식품' }));
    expect(within(sectors).getByText('오리온')).toBeInTheDocument();

    expect(screen.queryByRole('region', { name: '떠오르는 기업' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('광고')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /용어 게임/ })).toHaveAttribute(
      'href',
      '/terms?mode=game',
    );
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
