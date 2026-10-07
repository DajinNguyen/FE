import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useParams } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CompanySearch } from '../src/components/CompanySearch';
import { renderWithProviders } from './testUtils';

function OpenedCompany() {
  const { stockCode } = useParams();
  return <p>열린 기업: {stockCode}</p>;
}

const renderSearch = () =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<CompanySearch variant="hero" />} />
      <Route path="/companies/:stockCode" element={<OpenedCompany />} />
    </Routes>,
  );

const input = () => screen.getByRole('combobox', { name: '기업 검색' });

describe('기업 검색', () => {
  it.each([
    ['한글 이름', '삼성전자'],
    ['영어 이름', 'samsung electronics'],
    ['종목코드', '005930'],
  ])('%s(%s)로 검색하면 삼성전자가 나와요', async (_label, keyword) => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(input(), keyword);

    const results = await screen.findByRole('listbox', { name: '검색 결과' });
    expect(within(results).getAllByRole('option')).toHaveLength(1);
    expect(within(results).getByRole('option', { name: /삼성전자/ })).toHaveTextContent(
      'Samsung Electronics · 005930',
    );
    expect(within(results).getByText('반도체·전자제품')).toBeInTheDocument();
    expect(within(results).getByText('코스피')).toBeInTheDocument();
  });

  it('검색어와 같은 부분을 강조해요', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(input(), '하이닉스');
    const results = await screen.findByRole('listbox', { name: '검색 결과' });
    const mark = results.querySelector('mark');
    expect(mark).toHaveTextContent('하이닉스');
  });

  it('결과는 최대 20개까지 보여줘요', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(input(), 'a');
    const results = await screen.findByRole('listbox', { name: '검색 결과' });
    const count = within(results).getAllByRole('option').length;
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(20);
  });

  it('없는 기업을 검색하면 안내 문구가 나와요', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(input(), '없는회사');
    expect(
      await screen.findByText(
        '‘없는회사’에 맞는 기업을 찾지 못했어요. 이름이나 종목코드를 다시 확인해 주세요',
      ),
    ).toBeInTheDocument();
  });

  it('위·아래 키로 고르고 엔터로 열어요 (삼성전자가 아닌 기업도 열려요)', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(input(), '카카오');
    await screen.findByRole('option', { name: /카카오/ });
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /카카오/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('열린 기업: 035720')).toBeInTheDocument();
  });

  it('열어 본 기업은 최근 검색에 남아요', async () => {
    const user = userEvent.setup();
    const { unmount } = renderSearch();

    await user.type(input(), '현대차');
    await user.click(await screen.findByRole('option', { name: /현대차/ }));
    await screen.findByText('열린 기업: 005380');
    unmount();

    renderSearch();
    await user.click(input());
    const recent = await screen.findByRole('listbox', { name: '최근 검색' });
    expect(within(recent).getByText('현대차')).toBeInTheDocument();
  });
});
