import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HomePage } from '../src/pages/HomePage';
import { renderWithProviders } from './testUtils';

describe('회사 검색', () => {
  it.each([
    ['한글 이름', '삼성'],
    ['영어 이름', 'samsung'],
    ['종목코드', '005930'],
  ])('%s(%s)로 검색하면 삼성전자가 나와요', async (_label, keyword) => {
    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    await user.type(screen.getByRole('searchbox', { name: '회사 검색' }), keyword);

    const results = await screen.findByRole('region', { name: '검색 결과' });
    expect(await within(results).findByText('삼성전자')).toBeInTheDocument();
    expect(within(results).queryByText('SK하이닉스')).not.toBeInTheDocument();
    expect(within(results).getByText(/Samsung Electronics · 005930/)).toBeInTheDocument();
  });

  it('없는 회사를 검색하면 안내 문구가 나와요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    await user.type(screen.getByRole('searchbox', { name: '회사 검색' }), '없는회사');
    expect(await screen.findByText('찾는 회사가 없어요')).toBeInTheDocument();
  });

  it('삼성전자 외의 회사를 누르면 준비 안내를 보여줘요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    await user.type(screen.getByRole('searchbox', { name: '회사 검색' }), '카카오');
    await user.click(await screen.findByRole('button', { name: /카카오/ }));
    expect(
      await screen.findByText('시연에서는 삼성전자 리포트만 준비되어 있어요'),
    ).toBeInTheDocument();
  });
});
