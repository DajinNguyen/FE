import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from '../src/utils/format';

const now = new Date('2026-10-26T15:00:00+09:00');

describe('뉴스 시간 표시', () => {
  it('1시간 안은 "N분 전", 하루 안은 "N시간 전"', () => {
    expect(formatRelativeTime('2026-10-26T14:59:40+09:00', now)).toBe('방금 전');
    expect(formatRelativeTime('2026-10-26T14:45:00+09:00', now)).toBe('15분 전');
    expect(formatRelativeTime('2026-10-26T12:00:00+09:00', now)).toBe('3시간 전');
  });

  it('하루가 넘으면 날짜로, 다른 해는 연도까지 보여줘요', () => {
    expect(formatRelativeTime('2026-10-19T09:00:00+09:00', now)).toBe('10월 19일');
    expect(formatRelativeTime('2025-12-31T09:00:00+09:00', now)).toBe('2025년 12월 31일');
  });

  it('읽을 수 없는 값은 그대로 보여줘요', () => {
    expect(formatRelativeTime('2026년 1월', now)).toBe('2026년 1월');
  });
});
