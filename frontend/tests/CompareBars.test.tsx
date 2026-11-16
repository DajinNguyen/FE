import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CompanyPage } from '../src/pages/CompanyPage';
import { renderWithProviders } from './testUtils';

/** right = 지금 보는 기업(주소), left = 비교할 기업(with) */
const renderCompare = (right: string, left: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: `/companies/${right}?tab=compare&with=${left}` },
  );

const panel = () => screen.getByRole('tabpanel', { name: '비교하기' });
const row = (metric: string) => panel().querySelector(`[data-metric="${metric}"]`) as HTMLElement;
const bar = (metric: string, side: 'left' | 'right') =>
  row(metric).querySelector(`[data-bar="${side}"]`) as HTMLElement;
const label = (metric: string, side: 'left' | 'right') =>
  row(metric).querySelector(`[data-label="${side}"]`) as HTMLElement;
const ratio = (el: HTMLElement) => Number(el.style.getPropertyValue('--ratio'));

describe('비교하기 지표 막대', () => {
  it('두 회사 같은 기준을 보여주고, 지표 5개를 가운데 이름 + 양쪽 막대로 보여줘요', async () => {
    renderCompare('005930', '000660');
    expect(await within(panel()).findByText('2025년 연간 · 연결 기준')).toBeInTheDocument();
    const names = within(panel())
      .getAllByRole('term')
      .map((t) => t.textContent);
    expect(names).toEqual(['매출', '영업이익', '영업이익률', '매출 증가율', '부채비율']);
    expect(label('revenue', 'left')).toHaveTextContent('66.2조 원');
    expect(label('revenue', 'right')).toHaveTextContent('300.9조 원');
  });

  it('막대 길이는 지표마다 큰 값 기준 비율 그대로, 큰 쪽 숫자만 굵게 (색으로 승패 표시 안 함)', async () => {
    renderCompare('005930', '000660');
    await within(panel()).findByText('2025년 연간 · 연결 기준');
    expect(ratio(bar('revenue', 'right'))).toBe(1);
    expect(ratio(bar('revenue', 'left'))).toBeCloseTo(66.2 / 300.9, 5);
    expect(ratio(bar('operating_margin', 'left'))).toBe(1);
    expect(ratio(bar('operating_margin', 'right'))).toBeCloseTo(10.9 / 35.5, 5);

    expect(label('revenue', 'right')).toHaveAttribute('data-strong', 'true');
    expect(label('revenue', 'left')).not.toHaveAttribute('data-strong');
    expect(label('operating_margin', 'left')).toHaveAttribute('data-strong', 'true');
  });

  it('음수는 "적자"와 값을 보여줘요 (매출 감소는 적자가 아니에요)', async () => {
    renderCompare('035420', '035720');
    await within(panel()).findByText('2025년 연간 · 연결 기준');
    expect(label('operating_margin', 'left')).toHaveTextContent('적자 −1.9%');
    expect(label('revenue_growth', 'left')).toHaveTextContent('−1.6%');
    expect(label('revenue_growth', 'left')).not.toHaveTextContent('적자');
    expect(ratio(bar('operating_margin', 'left'))).toBeCloseTo(1.9 / 18.5, 5);
  });

  it('둘 중 하나라도 금융업이면 부채비율을 숨겨요', async () => {
    renderCompare('005930', '105560');
    await within(panel()).findByText('2025년 연간 · 연결 기준');
    expect(within(panel()).queryByText('부채비율')).not.toBeInTheDocument();
    expect(within(panel()).getAllByRole('term')).toHaveLength(4);
  });

  it('한 회사 자료가 없으면 지표마다 "자료 없음", 두 회사 모두 없으면 안내 문구', async () => {
    const first = renderCompare('005930', '005380');
    await within(panel()).findByText('2025년 연간 · 연결 기준');
    expect(within(row('revenue')).getByText('자료 없음')).toBeInTheDocument();
    first.unmount();

    renderCompare('005380', '000270');
    expect(
      await within(panel()).findByText('이 기업의 재무 자료가 아직 없어요'),
    ).toBeInTheDocument();
  });

  it('기준이 다르면 알려주고, [비교할 기업 페이지로] 링크가 있어요', async () => {
    renderCompare('005930', '097950');
    expect(await within(panel()).findByRole('note')).toHaveTextContent(
      '두 회사의 기준이 달라요 (CJ제일제당 2025년 연간 · 별도 기준, 삼성전자 2025년 연간 · 연결 기준)',
    );
    expect(within(panel()).getByRole('link', { name: /CJ제일제당 페이지로/ })).toHaveAttribute(
      'href',
      '/companies/097950',
    );
  });
});
