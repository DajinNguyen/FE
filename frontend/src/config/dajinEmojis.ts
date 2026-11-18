/**
 * 다진 전용 이모지. 이미지는 public/emoji/dajin/ 에 넣고 여기에 등록해요.
 * 크기·형식은 docs/frontend-data-requirements.md 10-3장 참고 (240×240 WebP).
 * 서버에는 댓글 본문 끝에 ":dajin-아이디:" 로 붙여 보내요. (예: ":dajin-like:")
 * 화면에서는 이 표시 대신 이미지로만 보여줘요.
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
  { id: 'faint', name: '기절', src: '/emoji/dajin/faint.webp', alt: '뒤로 넘어가 기절한 다진' },
  {
    id: 'hold-laugh',
    name: '웃참',
    src: '/emoji/dajin/hold-laugh.webp',
    alt: '입을 막고 웃음을 참는 다진',
  },
  { id: 'run', name: '뜬다', src: '/emoji/dajin/run.webp', alt: '거울 뒤에서 뛰어나오는 다진' },
];

export const emojiToken = (id: string) => `:dajin-${id}:`;

/** 본문 안의 이모지 표시 */
export const EMOJI_TOKEN_PATTERN = /:dajin-([a-z0-9-]+):/g;

/**
 * 댓글 본문을 글과 이모지로 나눠요. 이모지는 댓글 하나에 하나만 보여줘요.
 * (예전 댓글에 여러 개가 있으면 첫 번째만) 모르는 이모지는 글자 그대로 둬요.
 */
export function splitBody(body: string): { text: string; emoji: DajinEmoji | null } {
  let emoji: DajinEmoji | null = null;
  const text = body.replace(EMOJI_TOKEN_PATTERN, (token, id: string) => {
    const found = DAJIN_EMOJIS.find((e) => e.id === id);
    if (!found) return token;
    emoji ??= found;
    return '';
  });
  return { text: text.trim(), emoji };
}
