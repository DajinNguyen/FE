import { describe, expect, it } from 'vitest';
import { getCompanyNews, getIndustryNews, getMarketNews } from '../src/api/news';
import { failRequests } from './fixtures/fetchStub';

describe('뉴스 API', () => {
  it('기업·산업·시장 뉴스를 실제 주소로 불러와 NewsItem 형식으로 받아요', async () => {
    const page = await getCompanyNews('005930');
    expect(page.items.length).toBeGreaterThan(0);
    const item = page.items[0];
    for (const key of ['id', 'title', 'press', 'published_at', 'url', 'summary_short']) {
      expect(item).toHaveProperty(key);
    }
    expect(fetch).toHaveBeenCalledWith(
      '/api/companies/005930/news?page=1&size=10',
      expect.anything(),
    );

    await getIndustryNews('semiconductor');
    expect(fetch).toHaveBeenCalledWith(
      '/api/industries/semiconductor/news?size=5',
      expect.anything(),
    );
    await getMarketNews('2026-10-30');
    expect(fetch).toHaveBeenCalledWith('/api/market/news?date=2026-10-30', expect.anything());
  });

  it('실패하면 서버가 준 원인 문장으로 에러를 던져요', async () => {
    failRequests((path) => path.endsWith('/news'));
    await expect(getCompanyNews('005930')).rejects.toThrow('서버가 잠시 응답하지 않아요.');
  });
});
