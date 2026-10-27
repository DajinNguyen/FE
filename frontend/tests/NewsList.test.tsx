import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NewsList } from '../src/features/news/NewsList';
import { NewsTab } from '../src/features/news/NewsTab';
import type { NewsItem } from '../src/types';
import { renderWithProviders } from './testUtils';

const item: NewsItem = {
  id: 'n1',
  title: '반도체 수출 증가세 이어져',
  press: '예시 뉴스',
  published_at: new Date(Date.now() - 3 * 3_600_000).toISOString(),
  url: 'https://example.com/n1',
  summary_short: '이번 달 반도체 수출이 작년보다 늘었어요.',
  summary_long: null,
  company_stock_code: null,
  related_metric: null,
};

describe('뉴스 목록', () => {
  it('제목은 원문을 새 탭으로 열고, 언론사와 "N시간 전"을 보여줘요', () => {
    renderWithProviders(<NewsList items={[item]} />);
    const link = screen.getByRole('link', { name: /반도체 수출 증가세 이어져/ });
    expect(link).toHaveAttribute('href', 'https://example.com/n1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('3시간 전')).toBeInTheDocument();
  });

  it('뉴스가 없으면 안내를 보여줘요', () => {
    renderWithProviders(<NewsList items={[]} emptyText="아직 관련 뉴스가 없어요" />);
    expect(screen.getByText('아직 관련 뉴스가 없어요')).toBeInTheDocument();
  });

  it('기업 뉴스는 10개씩 보여주고 [더 보기]로 이어 붙여요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewsTab stockCode="000660" />);
    const list = await screen.findByRole('list', { name: '기업 뉴스' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(10);

    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: '기업 뉴스' })).getAllByRole('listitem'),
      ).toHaveLength(12),
    );
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });
});
