import { describe, expect, it } from 'vitest';

/** 앱 코드 전체 (원문 문자열) */
const sources = import.meta.glob('../src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('앱 코드', () => {
  it('목 데이터·테스트 데이터를 불러오지 않고, 목 전용 설정(VITE_USE_MOCK)도 없어요', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(50);
    const offenders = Object.entries(sources)
      .filter(([, code]) => /mocks\/|fixtures\/|VITE_USE_MOCK|loadMockServer/.test(code))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
