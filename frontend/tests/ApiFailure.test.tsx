import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HomePage } from '../src/pages/HomePage';
import { failRequests } from './fixtures/fetchStub';
import { renderWithProviders } from './testUtils';

describe('API 실패', () => {
  it('한 영역이 실패하면 그 자리에 원인과 [다시 시도]가 나오고, 다른 영역과 검색창은 그대로예요', async () => {
    failRequests((path) => path === '/api/industries/hot');
    renderWithProviders(<HomePage />);

    const hot = screen.getByRole('region', { name: '관심이 몰리는 산업 TOP 3' });
    const alert = await within(hot).findByRole('alert');
    expect(alert).toHaveTextContent('산업 정보를 불러오지 못했어요');
    expect(alert).toHaveTextContent('서버가 잠시 응답하지 않아요.');
    expect(within(alert).getByRole('button', { name: '다시 시도' })).toBeInTheDocument();

    // 다른 영역은 정상
    expect(await screen.findByRole('list', { name: '거래 많은 기업' })).toBeInTheDocument();
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
  });

  it('[다시 시도]를 누르면 다시 불러와요', async () => {
    const user = userEvent.setup();
    failRequests((path) => path === '/api/industries/hot');
    renderWithProviders(<HomePage />);
    const hot = screen.getByRole('region', { name: '관심이 몰리는 산업 TOP 3' });
    const alert = await within(hot).findByRole('alert');

    failRequests(null);
    await user.click(within(alert).getByRole('button', { name: '다시 시도' }));
    expect(
      await screen.findByRole('list', { name: '관심이 몰리는 산업 상위 3개' }),
    ).toBeInTheDocument();
  });

  it('모든 API 가 실패해도 화면이 깨지지 않고, 영역마다 안내와 [다시 시도]가 나와요', async () => {
    failRequests(() => true);
    renderWithProviders(<HomePage />);
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    alerts.forEach((a) =>
      expect(within(a).getByRole('button', { name: '다시 시도' })).toBeInTheDocument(),
    );
  });
});
