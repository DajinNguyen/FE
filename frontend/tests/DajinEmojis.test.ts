import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DAJIN_EMOJIS, emojiToken, splitBody } from '../src/config/dajinEmojis';

describe('다진 이모지 목록', () => {
  it('새 이모지 3개(기절·웃참·뜬다)가 있어요', () => {
    expect(DAJIN_EMOJIS.map((e) => e.name)).toEqual(
      expect.arrayContaining(['기절', '웃참', '뜬다']),
    );
    expect(DAJIN_EMOJIS).toHaveLength(13);
  });

  it('아이디는 겹치지 않고 표시(:dajin-아이디:) 규칙에 맞아요', () => {
    const ids = DAJIN_EMOJIS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it('모든 이미지 파일이 public/emoji/dajin 에 있어요', () => {
    for (const e of DAJIN_EMOJIS) {
      expect(e.src).toMatch(/^\/emoji\/dajin\/[a-z0-9-]+\.webp$/);
      expect(() => readFileSync(`public${e.src}`, 'utf8')).not.toThrow();
    }
  });

  it('댓글 본문의 표시를 새 이모지로 바꿔요', () => {
    expect(splitBody(`재밌다 ${emojiToken('hold-laugh')}`)).toEqual({
      text: '재밌다',
      emoji: DAJIN_EMOJIS.find((e) => e.id === 'hold-laugh'),
    });
  });
});
