import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** 테스트 환경은 CSS 를 계산하지 않아서, 스타일 파일에서 헤더 계정 이름 색을 직접 확인해요. */
const css = readFileSync('src/features/auth/LoginButton.module.css', 'utf8');
const tokens = readFileSync('src/styles/tokens.css', 'utf8');

const hex = (name: string, block: string) =>
  block.match(new RegExp(`${name}: (#[0-9a-f]{6});`))?.[1];

function contrast(a: string, b: string) {
  const lum = (h: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('헤더 계정 이름 색', () => {
  it('본문 글자색을 물려받지 않고 헤더용 밝은 글자 토큰(--on-deep)을 써요', () => {
    const user = css.match(/\.user \{[^}]*\}/)?.[0] ?? '';
    expect(user).toContain('color: var(--on-deep);');
  });

  it('라이트·다크 모두 헤더 배경과 대비가 4.5:1 이상이에요', () => {
    const light = tokens.slice(0, tokens.indexOf('@media (prefers-color-scheme: dark)'));
    const dark = tokens.slice(tokens.indexOf(":root[data-theme='dark']"));
    for (const block of [light, dark]) {
      expect(contrast(hex('--on-deep', block)!, hex('--deep', block)!)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
