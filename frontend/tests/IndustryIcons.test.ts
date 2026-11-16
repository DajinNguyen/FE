import { Factory } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { industryColorStyle, industryIcon, INDUSTRY_ICONS } from '../src/config/industryIcons';

/** 백엔드 industries.json 의 icon_key 30개 (기존 10 + 기업 2,000곳 확장으로 추가된 20) */
const SERVER_ICON_KEYS = [
  'ai',
  'semiconductor',
  'shipbuilding',
  'defense',
  'battery',
  'bio',
  'internet',
  'auto',
  'finance',
  'game',
  'display',
  'electronics',
  'robot',
  'machinery',
  'energy',
  'chemical',
  'steel',
  'construction',
  'medical',
  'beauty',
  'food',
  'retail',
  'fashion',
  'software',
  'telecom',
  'entertainment',
  'travel',
  'transport',
  'education',
  'holding',
];

describe('산업 아이콘·색', () => {
  it('서버 산업 30개 모두 전용 아이콘이 있고 서로 겹치지 않아요 (기본 공장 아이콘 아님)', () => {
    for (const key of SERVER_ICON_KEYS) expect(industryIcon(key), key).not.toBe(Factory);
    const icons = SERVER_ICON_KEYS.map((k) => INDUSTRY_ICONS[k]);
    expect(new Set(icons).size).toBe(SERVER_ICON_KEYS.length);
  });

  it('30개 모두 산업별 색 토큰(--ind-{키}-bg·fg)을 써요', () => {
    for (const key of SERVER_ICON_KEYS) {
      expect(industryColorStyle(key)).toEqual({
        '--industry-bg': `var(--ind-${key}-bg)`,
        '--industry-fg': `var(--ind-${key}-fg)`,
      });
    }
  });

  it('모르는 산업은 공장 아이콘과 연한 브랜드 색이에요', () => {
    expect(industryIcon('unknown')).toBe(Factory);
    expect(industryColorStyle('unknown')).toEqual({
      '--industry-bg': 'var(--brand-weak)',
      '--industry-fg': 'var(--brand)',
    });
  });
});
