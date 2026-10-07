import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomePage } from '../src/pages/HomePage';
import { renderWithProviders } from './testUtils';

describe('메인 대시보드', () => {
  it('서비스 소개, 검색창, 섹션 4개와 오늘의 용어를 보여줘요', async () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', { name: '궁금한 기업을 검색하면 AI가 쉽게 분석해 드려요' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '기업 검색' })).toBeInTheDocument();

    const trading = await screen.findByRole('region', { name: '오늘 거래가 많은 기업' });
    expect(within(trading).getAllByText(/거래대금/).length).toBeGreaterThan(0);
    expect(screen.getByRole('region', { name: '떠오르는 기업' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '관심도 높은 기업' })).toBeInTheDocument();

    const analyzed = screen.getByRole('region', { name: 'AI가 분석한 기업' });
    expect(
      within(analyzed).getByText('AI용 메모리가 잘 팔리면서 3년 만에 이익이 크게 늘어난 회사예요'),
    ).toBeInTheDocument();

    expect(screen.queryByText('많이 보는 회사')).not.toBeInTheDocument();
  });
});
