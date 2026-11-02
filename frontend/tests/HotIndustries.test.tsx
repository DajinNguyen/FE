import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HotIndustries } from '../src/features/industry/HotIndustries';
import { topIndustries } from '../src/features/industry/industryText';
import type { IndustrySummary } from '../src/types';
import { renderWithProviders } from './testUtils';

const industry = (id: string, score: number): IndustrySummary => ({
  industry_id: id,
  name: id,
  icon_key: id,
  heat_score: score,
  heat_level: 'low',
  headline_metric: { label: '최근 1주', value: 1, unit: '%' },
  as_of: '2026-10-30T15:30:00+09:00',
});

describe('관심이 몰리는 산업', () => {
  it('4개 이상 받아도 점수 높은 3개만 순서대로 골라요 (받은 순서와 상관없이)', () => {
    const picked = topIndustries([
      industry('a', 10),
      industry('b', 40),
      industry('c', 5),
      industry('d', 30),
      industry('e', 20),
    ]);
    expect(picked.map((i) => i.industry_id)).toEqual(['b', 'd', 'e']);
  });

  it('화면에는 상위 3개만 순위·산업명·대표 숫자·기준일과 함께 보여주고, 누르면 산업 페이지로 가요', async () => {
    renderWithProviders(<HotIndustries />);
    const list = await screen.findByRole('list', { name: '관심이 몰리는 산업 상위 3개' });
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute('data-rank'))).toEqual(['1', '2', '3']);

    const first = links[0];
    expect(first).toHaveAttribute('aria-label', '1위 AI 산업, 최근 1주 6.2% 상승');
    expect(first).toHaveAttribute('href', '/industries/ai');
    expect(first).toHaveTextContent('1위');
    expect(first).toHaveTextContent('최근 1주 +6.2%');
    links.forEach((link) => expect(link).toHaveTextContent(/기준$/));
  });

  it('기간을 최근 1개월로 바꾸면 숫자가 바뀌고, [기준 보기]에서 임시 기준을 볼 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HotIndustries />);
    await screen.findByRole('list', { name: '관심이 몰리는 산업 상위 3개' });

    await user.click(screen.getByRole('radio', { name: '최근 1개월' }));
    expect(await screen.findByText('+12.4%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '기준 보기' }));
    const sheet = screen.getByRole('dialog', { name: '관심이 몰리는 산업은 이렇게 골라요' });
    expect(sheet).toHaveTextContent(
      '주가 상승률 35% + 거래대금 증가율 30% + 뉴스 언급 증가율 25% + 커뮤니티 활발도 10%',
    );
    expect(sheet).toHaveTextContent('최근 1주 게시글·댓글 수');
  });
});
