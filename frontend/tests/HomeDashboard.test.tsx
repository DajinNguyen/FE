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
