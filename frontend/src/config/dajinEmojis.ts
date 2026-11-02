/**
 * 다진 전용 이모지. 이미지는 public/emoji/dajin/ 에 넣고 여기에 등록해요.
 * ⚠️ 에셋 준비 전이라 비어 있어요. 필요한 목록·크기는 docs/frontend-data-requirements.md 9장 참고.
 * 댓글 본문에는 ":dajin-아이디:" 로 들어가요. (예: ":dajin-like:")
 */
export interface DajinEmoji {
  id: string;
  /** 이모지 이름 (패널에 보여요) */
  name: string;
  /** 이미지 경로 (예: /emoji/dajin/like.png) */
  src: string;
  /** 대체 텍스트 */
  alt: string;
}

export const DAJIN_EMOJIS: DajinEmoji[] = [];

export const emojiToken = (id: string) => `:dajin-${id}:`;

/** 본문 안의 이모지 표시 */
export const EMOJI_TOKEN_PATTERN = /:dajin-([a-z0-9-]+):/g;

/** 이모지만 있는 댓글이면 true (크게 보여줘요) */
export function isEmojiOnly(body: string) {
  const known = [...body.matchAll(EMOJI_TOKEN_PATTERN)].filter((m) =>
    DAJIN_EMOJIS.some((e) => e.id === m[1]),
  );
  return known.length > 0 && body.replace(EMOJI_TOKEN_PATTERN, '').trim() === '';
}
