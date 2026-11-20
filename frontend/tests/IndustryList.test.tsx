import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { industryRecords, listOnlyIndustries } from './fixtures/industries';
import { renderWithProviders } from './testUtils';

describe('전체 산업 목록', () => {
  it('메인 TOP 3 옆 "전체 산업 보기"를 누르면 모든 산업을 기업 수와 함께 보여줘요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/' });

    await user.click(await screen.findByRole('link', { name: '전체 산업 보기' }));

    expect(await screen.findByRole('heading', { level: 1, name: '전체 산업' })).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: '전체 산업' });
    expect(within(list).getAllByRole('link')).toHaveLength(
      industryRecords.length + listOnlyIndustries.length,
    );
    const ai = industryRecords.find((r) => r.industry_id === 'ai')!;
    expect(
      within(list).getByRole('link', { name: `AI 산업, 기업 ${ai.companies.length}곳` }),
    ).toHaveAttribute('href', '/industries/ai');
    expect(
      screen.getByText(`산업 ${industryRecords.length + listOnlyIndustries.length}개`, {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it('산업을 누르면 그 산업 화면으로 가요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/industries' });

    const list = await screen.findByRole('list', { name: '전체 산업' });
    await user.click(within(list).getByRole('link', { name: /^반도체 산업/ }));

    expect(await screen.findByRole('heading', { level: 1, name: /반도체/ })).toBeInTheDocument();
  });

  it('관심도를 집계하지 않는 산업(TOP 3 에 안 나오는 산업)도 목록에 있고, 눌러서 볼 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/industries' });

    const list = await screen.findByRole('list', { name: '전체 산업' });
    await user.click(within(list).getByRole('link', { name: /^지주회사 산업/ }));

    expect(await screen.findByRole('heading', { level: 1, name: /지주회사/ })).toBeInTheDocument();
  });
});
