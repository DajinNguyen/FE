/**
 * 다진 전용 이모지. 이미지는 public/emoji/dajin/ 에 넣고 여기에 등록해요.
 * 크기·형식은 docs/frontend-data-requirements.md 10-3장 참고 (240×240 WebP).
 * 댓글 본문에는 ":dajin-아이디:" 로 들어가요. (예: ":dajin-like:")
 */
export interface DajinEmoji {
  id: string;
  /** 이모지 이름 (패널에 보여요) */
  name: string;
  /** 이미지 경로 (예: /emoji/dajin/like.webp) */
  src: string;
  /** 대체 텍스트 */
  alt: string;
}

export const DAJIN_EMOJIS: DajinEmoji[] = [
  { id: 'laugh', name: '웃겨요', src: '/emoji/dajin/laugh.webp', alt: '크게 웃는 다진' },
  { id: 'cry', name: '슬퍼요', src: '/emoji/dajin/cry.webp', alt: '엉엉 우는 다진' },
  { id: 'grin', name: '씨익', src: '/emoji/dajin/grin.webp', alt: '씨익 웃는 다진' },
  { id: 'sob', name: '억울해요', src: '/emoji/dajin/sob.webp', alt: '억울해서 우는 다진' },
  { id: 'proud', name: '뿌듯해요', src: '/emoji/dajin/proud.webp', alt: '뿌듯하게 미소 짓는 다진' },
  {
    id: 'grumpy',
    name: '못마땅해요',
    src: '/emoji/dajin/grumpy.webp',
    alt: '못마땅한 표정의 다진',
  },
  { id: 'tired', name: '피곤해요', src: '/emoji/dajin/tired.webp', alt: '눈을 감고 지친 다진' },
  { id: 'please', name: '굽신굽신', src: '/emoji/dajin/please.webp', alt: '손을 비비며 웃는 다진' },
  {
    id: 'humming',
    name: '흥얼흥얼',
    src: '/emoji/dajin/humming.webp',
    alt: '운전하며 흥얼거리는 다진',
  },
  { id: 'serious', name: '정색', src: '/emoji/dajin/serious.webp', alt: '정색한 다진' },
];

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
