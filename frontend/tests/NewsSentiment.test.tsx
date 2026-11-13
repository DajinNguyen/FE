import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  NEWS_SENTIMENT_CLASS_KEY,
  NEWS_SENTIMENT_CRITERIA_TEXT,
  NEWS_SENTIMENT_LABELS,
} from '../src/config/newsSentiment';
import newsStyles from '../src/features/news/News.module.css';
import { NewsList } from '../src/features/news/NewsList';
import { NewsTab } from '../src/features/news/NewsTab';
import type { NewsItem, NewsSentiment } from '../src/types';
import { renderWithProviders } from './testUtils';

const baseItem: Omit<NewsItem, 'id' | 'sentiment' | 'sentiment_reason'> = {
  title: '예시 기사 제목',
  press: '예시 뉴스',
  published_at: new Date(Date.now() - 3 * 3_600_000).toISOString(),
  url: 'https://example.com/n',
  summary_short: '한 줄 요약이에요.',
  summary_long: null,
  company_stock_code: null,
  related_metric: null,
};

const sentiments: NewsSentiment[] = ['very_good', 'good', 'neutral', 'bad', 'very_bad'];

describe('뉴스 호재·악재 배지', () => {
  it.each(sentiments)('%s 는 올바른 라벨과 색으로 보여줘요', (sentiment) => {
    const item: NewsItem = {
      ...baseItem,
      id: `n-${sentiment}`,
      sentiment,
      sentiment_reason: '이 뉴스가 그렇게 판단된 이유예요.',
    };
    renderWithProviders(<NewsList items={[item]} label="뉴스" />);

    const badge = screen.getByText(NEWS_SENTIMENT_LABELS[sentiment]);
    expect(badge).toHaveClass(newsStyles[NEWS_SENTIMENT_CLASS_KEY[sentiment]]);
    expect(screen.getByText('이 뉴스가 그렇게 판단된 이유예요.')).toBeInTheDocument();
  });

  it('작은 목록(compact)에서는 이유 문장은 숨기고 동그라미·라벨만 보여줘요', () => {
    const item: NewsItem = {
      ...baseItem,
      id: 'n-compact',
      sentiment: 'good',
      sentiment_reason: '작은 목록에서는 숨겨질 이유',
    };
    renderWithProviders(<NewsList items={[item]} compact label="근거 뉴스" />);

    expect(screen.getByText('좋음')).toBeInTheDocument();
    expect(screen.queryByText('작은 목록에서는 숨겨질 이유')).not.toBeInTheDocument();
  });
});

describe('뉴스 기준 보기', () => {
  it('"기준 보기"를 누르면 5단계 기준과 참고용 안내 문구를 보여줘요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewsTab stockCode="000660" />);
    await screen.findByRole('list', { name: '기업 뉴스' });

    await user.click(screen.getByRole('button', { name: '기준 보기' }));
    const sheet = screen.getByRole('dialog', { name: '뉴스는 이런 기준으로 좋음/나쁨을 가려요' });
    expect(sheet).toHaveTextContent(NEWS_SENTIMENT_CRITERIA_TEXT.very_good);
    expect(sheet).toHaveTextContent(NEWS_SENTIMENT_CRITERIA_TEXT.very_bad);
    expect(sheet).toHaveTextContent('투자 추천이 아니에요');

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
