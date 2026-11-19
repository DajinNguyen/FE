import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PriceChart } from '../src/components/PriceChart';
import { CompanyPage } from '../src/pages/CompanyPage';
import { renderWithProviders } from './testUtils';

const renderOverview = () =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: '/companies/005930' },
  );

const candleKeys = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-candle]')].map((el) => el.getAttribute('data-candle') ?? '');

describe('주가 흐름: 캔들 단위와 차트 크게 보기', () => {
  it('작은 그래프는 일·주·월·년 캔들로 바꿔요', async () => {
    const user = userEvent.setup();
    renderOverview();
    const units = await screen.findByRole('radiogroup', { name: '캔들 단위' });
    expect(
      within(units)
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['일', '주', '월', '년']);
    expect(await screen.findByText(/3달 전보다/)).toBeInTheDocument();

    await user.click(within(units).getByRole('radio', { name: '월' }));
    expect(await screen.findByText(/5년 전보다/)).toBeInTheDocument();
    // 월 캔들은 매달 하나 (5년 ≈ 61개)
    const chart = screen.getByRole('img', { name: /주가 흐름/ });
    const keys = candleKeys(chart);
    expect(keys.length).toBeGreaterThanOrEqual(60);
    expect(new Set(keys.map((k) => k.slice(0, 7))).size).toBe(keys.length);
  });

  it('크게 보기에서 1일~전체 기간을 고르고, Esc 로 닫으면 버튼으로 돌아가요', async () => {
    const user = userEvent.setup();
    renderOverview();
    const open = await screen.findByRole('button', { name: '차트 크게 보기' });
    await user.click(open);

    const dialog = screen.getByRole('dialog', { name: /차트 크게 보기/ });
    const ranges = within(dialog).getByRole('radiogroup', { name: '기간' });
    expect(
      within(ranges)
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['1일', '5일', '1달', '3달', '6달', '1년', '5년', '전체']);
    expect(within(ranges).getByRole('radio', { name: '1일' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    // 1일: 하루치 1분 캔들 (시각이 붙어요)
    const minuteChart = await within(dialog).findByRole('img', { name: /주가 흐름/ });
    const minuteKeys = candleKeys(minuteChart);
    expect(minuteKeys).toHaveLength(390);
    expect(minuteKeys[0]).toMatch(/ 09:00$/);
    expect(new Set(minuteKeys.map((k) => k.slice(0, 10))).size).toBe(1);

    // 5일: 다섯 거래일의 10분 캔들
    await user.click(within(ranges).getByRole('radio', { name: '5일' }));
    await within(dialog).findByText(/5일 동안/);
    const tenKeys = candleKeys(within(dialog).getByRole('img', { name: /주가 흐름/ }));
    expect(new Set(tenKeys.map((k) => k.slice(0, 10))).size).toBe(5);
    expect(tenKeys[1]).toMatch(/ 09:10$/);

    // 1년: 날짜만 있는 일 캔들
    await user.click(within(ranges).getByRole('radio', { name: '1년' }));
    await within(dialog).findByText(/1년 동안/);
    const dayKeys = candleKeys(within(dialog).getByRole('img', { name: /주가 흐름/ }));
    expect(dayKeys.length).toBeGreaterThan(200);
    expect(dayKeys.every((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))).toBe(true);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(open).toHaveFocus();
  });

  it('크게 보기의 1달·3달은 딱 그 기간을 1시간·반나절 캔들로 보여 주고, 끌거나 키로 지난 기간을 봐요', async () => {
    const user = userEvent.setup();
    renderOverview();
    await user.click(await screen.findByRole('button', { name: '차트 크게 보기' }));
    const dialog = screen.getByRole('dialog', { name: /차트 크게 보기/ });
    const ranges = within(dialog).getByRole('radiogroup', { name: '기간' });
    const days = (keys: string[]) => new Set(keys.map((k) => k.slice(0, 10)));
    const spanDays = (keys: string[]) =>
      (Date.parse(keys.at(-1)!.slice(0, 10)) - Date.parse(keys[0].slice(0, 10))) / 86_400_000;

    // 1달: 마지막 날부터 30일 안의 1시간 캔들 (하루 7칸)
    await user.click(within(ranges).getByRole('radio', { name: '1달' }));
    await within(dialog).findByText(/1달 동안/);
    const chart = within(dialog).getByRole('img', { name: /지난 기간이 보여요/ });
    const before = candleKeys(chart);
    expect(before.every((k) => / \d{2}:00$/.test(k))).toBe(true);
    expect(before).toHaveLength(days(before).size * 7);
    expect(spanDays(before)).toBeLessThan(30);
    expect(spanDays(before)).toBeGreaterThan(25);
    expect(chart).toHaveAttribute('data-offset', '0');

    // 왼쪽 끝 캔들에서 왼쪽 키를 더 누르면 한 칸 전 캔들이 나와요
    chart.focus();
    await user.keyboard('{Home}{ArrowLeft}{ArrowLeft}');
    expect(chart).toHaveAttribute('data-offset', '2');
    const after = candleKeys(chart);
    expect(after).toHaveLength(before.length);
    expect(after[0] < before[0]).toBe(true);
    expect(after.at(-1)).toBe(before.at(-3));

    // 3달: 반나절 캔들 (하루 09:00·12:00 두 칸), 딱 3달
    await user.click(within(ranges).getByRole('radio', { name: '3달' }));
    await within(dialog).findByText(/3달 동안/);
    const half = candleKeys(within(dialog).getByRole('img', { name: /주가 흐름/ }));
    expect(half.every((k) => / (09|12):00$/.test(k))).toBe(true);
    expect(half).toHaveLength(days(half).size * 2);
    expect(spanDays(half)).toBeGreaterThan(85);
    expect(spanDays(half)).toBeLessThan(91);
  });

  it('분 캔들은 정보 줄과 날짜 눈금에 시각을 보여 줘요', () => {
    const points = [0, 1, 2].map((m) => ({
      date: '2026-11-19',
      time: `09:0${m}`,
      open: 1000,
      high: 1100,
      low: 900,
      close: 1000 + m * 10,
    }));
    render(<PriceChart points={points} interval="1min" />);
    expect(screen.getByTestId('price-info')).toHaveTextContent('2026.11.19 09:02');
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByTestId('price-info')).not.toHaveTextContent('이동평균선');
  });
});
