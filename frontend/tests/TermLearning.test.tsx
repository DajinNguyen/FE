import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TermGameBanner } from '../src/features/home/TermGameBanner';
import { TermCardsPage } from '../src/pages/TermCardsPage';
import { renderWithProviders } from './testUtils';

describe('용어 학습 순서', () => {
  it('낱말퀴즈 → 카드 학습 → 문제 순서이고, 처음 열면 낱말퀴즈예요', async () => {
    renderWithProviders(<TermCardsPage />, { route: '/terms' });
    const group = screen.getByRole('radiogroup', { name: '학습 방법' });
    expect(
      within(group)
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['낱말퀴즈', '카드 학습', '문제']);
    expect(within(group).getByRole('radio', { name: '낱말퀴즈' })).toBeChecked();
    expect(screen.getByText('열쇠를 보고 용어를 가로세로 칸에 채워요')).toBeInTheDocument();
  });

  it('메인 배너의 첫 링크는 낱말퀴즈로 가요', () => {
    renderWithProviders(<TermGameBanner />);
    const [first] = screen.getAllByRole('link');
    expect(first).toHaveTextContent('낱말퀴즈');
    expect(first).toHaveAttribute('href', '/terms');
  });
});
