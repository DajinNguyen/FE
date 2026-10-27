import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HotIndustries } from '../src/features/industry/HotIndustries';
import { renderWithProviders } from './testUtils';

describe('지금 관심이 몰리는 산업', () => {
  it('점수 순으로 상위 3개는 크게, 다음 3개는 중간, 나머지는 작게 보여주고 숫자와 aria-label 이 있어요', async () => {
    renderWithProviders(<HotIndustries />);
    const list = await screen.findByRole('list', { name: '관심이 몰리는 산업' });
    const links = within(list).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('data-level'))).toEqual([
      'high',
      'high',
      'high',
      'mid',
      'mid',
      'mid',
      'low',
      'low',
      'low',
      'low',
    ]);

    const ai = links[0];
    expect(ai).toHaveAttribute('aria-label', 'AI 산업, 최근 1주 6.2% 상승, 관심도 높음');
    expect(ai).toHaveAttribute('href', '/industries/ai');
    expect(ai).toHaveTextContent('최근 1주 +6.2%');
    // 모든 아이콘에 대표 숫자가 있어요.
    links.forEach((link) => expect(link).toHaveTextContent(/[+-]?\d+\.\d%/));
    expect(screen.getByText(/장 마감 기준|기준$/)).toBeInTheDocument();
  });

  it('기간을 최근 1개월로 바꾸면 숫자가 바뀌고, [기준 보기]에서 임시 기준을 볼 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HotIndustries />);
    await screen.findByRole('list', { name: '관심이 몰리는 산업' });

    await user.click(screen.getByRole('radio', { name: '최근 1개월' }));
    expect(await screen.findByText('+12.4%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '기준 보기' }));
    const sheet = screen.getByRole('dialog', { name: '관심이 몰리는 산업은 이렇게 골라요' });
    expect(sheet).toHaveTextContent('주가 상승률 40% + 거래대금 증가율 30% + 뉴스 언급 증가율 30%');
  });
});
