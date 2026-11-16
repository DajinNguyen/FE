import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CompanyPage } from '../src/pages/CompanyPage';
import { renderWithProviders } from './testUtils';

function LocationProbe() {
  const { search } = useLocation();
  return <output aria-label="주소">{search}</output>;
}

const renderCompare = (query = '?tab=compare') =>
  renderWithProviders(
    <Routes>
      <Route
        path="/companies/:stockCode"
        element={
          <>
            <CompanyPage />
            <LocationProbe />
          </>
        }
      />
    </Routes>,
    { route: `/companies/005930${query}` },
  );

const panel = () => screen.getByRole('tabpanel', { name: '비교하기' });

describe('비교하기 탭', () => {
  it('맨 끝 탭이고, 오른쪽에 지금 보는 기업, 왼쪽에 검색과 같은 산업의 비슷한 회사가 있어요', async () => {
    renderCompare();
    expect(screen.getAllByRole('tab').at(-1)).toHaveTextContent('비교하기');

    const current = (await within(panel()).findByText('지금 보는 기업')).parentElement!;
    expect(await within(current).findByText('삼성전자')).toBeInTheDocument();
    expect(current).toHaveTextContent(/반도체·전자제품 · 시가총액 .+조 원/);

    const chips = await within(panel()).findByRole('list');
    const names = within(chips)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names.length).toBeGreaterThanOrEqual(3);
    expect(names.length).toBeLessThanOrEqual(4);
    expect(names).toContain('SK하이닉스');
    expect(names).not.toContain('삼성전자');
  });

  it('검색 결과에서 지금 보는 기업은 빼요', async () => {
    const user = userEvent.setup();
    renderCompare();
    const search = await within(panel()).findByRole('combobox', { name: '기업 검색' });
    await user.type(search, '삼성');
    const results = await within(panel()).findByRole('listbox', { name: '검색 결과' });
    const names = within(results)
      .getAllByRole('option')
      .map((o) => o.textContent ?? '');
    expect(names.some((n) => n.includes('삼성SDI'))).toBe(true);
    expect(names.some((n) => n.includes('005930'))).toBe(false);
  });

  it('고르면 주소에 with 로 남고, [기업 바꾸기]로 다시 고를 수 있어요', async () => {
    const user = userEvent.setup();
    renderCompare();
    await user.click(await within(panel()).findByRole('button', { name: 'SK하이닉스' }));

    expect(screen.getByRole('status', { name: '주소' }).textContent).toContain('with=000660');
    const left = (await within(panel()).findByText('비교할 기업')).parentElement!;
    expect(await within(left).findByText('SK하이닉스')).toBeInTheDocument();

    await user.click(within(left).getByRole('button', { name: '기업 바꾸기' }));
    expect(screen.getByRole('status', { name: '주소' }).textContent).not.toContain('with=');
    expect(within(panel()).getByRole('combobox', { name: '기업 검색' })).toBeInTheDocument();
  });

  it('주소(?tab=compare&with=)로 들어오면 고른 상태 그대로 열려요', async () => {
    renderCompare('?tab=compare&with=000660');
    expect(screen.getByRole('tab', { name: '비교하기', selected: true })).toBeInTheDocument();
    const left = (await within(panel()).findByText('비교할 기업')).parentElement!;
    await waitFor(() => expect(left).toHaveTextContent('SK하이닉스'));
  });
});
