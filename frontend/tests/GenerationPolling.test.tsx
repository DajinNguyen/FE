import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PerformanceAnalysis } from '../src/features/financials/PerformanceAnalysis';
import { GENERATION_POLL_MS, pollWhileGenerating } from '../src/hooks/generationPolling';
import { performanceDetails } from './fixtures/performance';
import { renderWithProviders } from './testUtils';

const HYNIX = '000660';

afterEach(() => {
  delete performanceDetails[HYNIX];
});

describe('AI가 백그라운드에서 채우는 칸', () => {
  it('하나라도 만드는 중이면 다시 물어보고, 다 되면 멈춰요', () => {
    expect(pollWhileGenerating('ready', 'generating')).toBe(GENERATION_POLL_MS);
    expect(pollWhileGenerating('ready', 'failed', 'none')).toBe(false);
    expect(pollWhileGenerating(undefined)).toBe(false); // 예전 백엔드 응답에는 상태가 없어요
  });

  it('처음 연 회사는 "정리하고 있어요"를 보여주고, 다 만들어지면 그 화면에서 채워져요', async () => {
    const done = performanceDetails['005930'];
    performanceDetails[HYNIX] = {
      ...done,
      segments: [],
      reasons: [],
      ai_summary: null,
      segments_status: 'generating',
      reasons_status: 'generating',
    };
    renderWithProviders(<PerformanceAnalysis stockCode={HYNIX} />);

    expect(await screen.findAllByText('AI가 정리하고 있어요. 보통 1~2분 걸려요.')).toHaveLength(2);
    expect(screen.queryByText('자료가 없어요')).not.toBeInTheDocument();

    performanceDetails[HYNIX] = { ...done, segments_status: 'ready', reasons_status: 'ready' };
    expect(
      await screen.findByText('하만(전장·오디오)', {}, { timeout: GENERATION_POLL_MS + 2_000 }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/정리하고 있어요/)).not.toBeInTheDocument();
  }, 15_000);

  it('만들지 못했으면 "자료가 없어요"예요', async () => {
    performanceDetails[HYNIX] = {
      ...performanceDetails['005930'],
      segments: [],
      reasons: [],
      segments_status: 'failed',
      reasons_status: 'none',
    };
    renderWithProviders(<PerformanceAnalysis stockCode={HYNIX} />);
    expect(await screen.findAllByText('자료가 없어요')).toHaveLength(2);
  });
});
