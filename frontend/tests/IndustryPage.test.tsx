import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { IndustryPage } from '../src/pages/IndustryPage';
import { renderWithProviders } from './testUtils';

const renderIndustry = (id: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/industries/:industryId" element={<IndustryPage />} />
    </Routes>,
    { route: `/industries/${id}` },
  );

const capOf = (row: HTMLElement) =>
  Number(/약 ([\d.,]+)조 원/.exec(row.textContent ?? '')?.[1].replace(',', ''));

describe('산업 페이지', () => {
  it('관련 기업을 시가총액 큰 순으로 10개 보여주고 [더 보기]로 나머지를 보여줘요', async () => {
    const user = userEvent.setup();
    renderIndustry('semiconductor');

    expect(await screen.findByRole('heading', { level: 1, name: '반도체' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: '관련 기업' });
    let rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(10);
    const caps = rows.map(capOf);
    expect(caps).toEqual([...caps].sort((a, b) => b - a));
    expect(rows[0]).toHaveTextContent('삼성전자');
    expect(rows[0]).toHaveTextContent('약 760조 원');
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/companies/005930');

    await user.click(screen.getByRole('button', { name: '더 보기' }));
    rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(14);
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('왜 관심이 몰리는지, 점수 구성 표, 관련 뉴스 5개, 투자 추천이 아니라는 안내를 보여줘요', async () => {
    renderIndustry('ai');
    expect(
      await screen.findByRole('heading', { name: '왜 관심이 몰리고 있나요?' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: '근거 뉴스' })).getAllByRole('link'),
    ).toHaveLength(2);
    const table = screen.getByRole('table', { name: /관심도 점수 구성/ });
    expect(table).toHaveTextContent('주가 상승률+6.2%40%2.5');
    expect(await screen.findAllByRole('article')).toHaveLength(5);
    expect(screen.getByText(/관심이 몰린다는 것은 투자 추천이 아니에요/)).toBeInTheDocument();
  });

  it('없는 산업이면 안내를 보여줘요', async () => {
    renderIndustry('unknown');
    expect(await screen.findByText('산업 정보를 찾지 못했어요')).toBeInTheDocument();
  });
});
