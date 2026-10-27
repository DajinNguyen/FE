import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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

  it('거래 많은 기업은 기준일과 함께 TOP 3만 작게 보여줘요 (순위·기업명·한 줄 소개·거래대금)', async () => {
    renderWithProviders(<HomePage />);

    const list = await screen.findByRole('list', { name: '거래 많은 기업' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('1삼성전자');
    expect(rows[0]).toHaveTextContent('거래대금');
    expect(within(rows[0]).queryByText('AI 결론')).not.toBeInTheDocument();
    expect(screen.getByText(/기준 · 거래대금 순/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /전체 보기/ })).toHaveAttribute(
      'href',
      '/rankings/trading',
    );
    expect(screen.getByRole('link', { name: /낱말퀴즈/ })).toHaveAttribute(
      'href',
      '/terms?mode=crossword',
    );
    expect(screen.queryByRole('list', { name: '다진이 하는 일' })).not.toBeInTheDocument();
  });

  it('업종별 기업 탭 대신 관심이 몰리는 산업 아이콘을 보여줘요', async () => {
    renderWithProviders(<HomePage />);
    expect(await screen.findByRole('list', { name: '관심이 몰리는 산업' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '업종별 기업' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '떠오르는 기업' })).not.toBeInTheDocument();
  });

  it('전체 보기 화면은 순위 30개를 보여줘요', async () => {
    renderWithProviders(<TradingRankingPage />);
    const list = await screen.findByRole('list', { name: '거래대금 순위' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(30);
  });
});
