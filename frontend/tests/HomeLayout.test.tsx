import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppLayout } from '../src/components/AppLayout';
import { HomePage } from '../src/pages/HomePage';
import { renderWithProviders } from './testUtils';

const before = (a: Element, b: Element) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('메인 구성', () => {
  it('시장 한마디 → 검색 → 산업 TOP 3 → 변동 이유 → 거래 많은 기업 → 용어 학습 순서예요', async () => {
    renderWithProviders(<HomePage />);
    const headline = await screen.findByRole('heading', { level: 1 });
    const search = screen.getByRole('region', { name: '기업 검색' });
    const hot = screen.getByRole('region', { name: '관심이 몰리는 산업 TOP 3' });
    const reasons = await screen.findByRole('region', { name: '오늘 시장, 왜 움직였나요?' });
    const trading = screen.getByRole('region', { name: /거래 많은 기업 TOP 3/ });
    const learn = screen.getByRole('region', { name: '용어 익히기' });
    const order = [headline, search, hot, reasons, trading, learn];
    order.slice(1).forEach((el, i) => expect(before(order[i], el)).toBe(true));
  });

  it('산업 TOP 3 카드에는 그래프 없이 순위·이름·숫자만 있고, 변동 이유마다 산업 아이콘이 있어요', async () => {
    renderWithProviders(<HomePage />);
    const list = await screen.findByRole('list', { name: '관심이 몰리는 산업 상위 3개' });
    expect(within(list).queryAllByRole('img')).toHaveLength(0);

    const reasons = await screen.findByRole('region', { name: '오늘 시장, 왜 움직였나요?' });
    const items = within(reasons)
      .getAllByRole('listitem')
      .filter((li) => li.querySelector('h3'));
    items.forEach((item) => expect(item.querySelector('svg')).not.toBeNull());
  });

  it('메인에서도 위쪽 메뉴(관심 기업 옆)에 검색창이 있어요', async () => {
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>,
    );
    await screen.findByRole('heading', { level: 1 });
    const header = screen.getByRole('banner');
    const nav = within(header).getByRole('navigation', { name: '주요 메뉴' });
    const search = within(header).getByRole('combobox', { name: '기업 검색' });
    expect(before(nav, search)).toBe(true);
  });
});
