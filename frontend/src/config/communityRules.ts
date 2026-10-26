/**
 * 커뮤니티 규칙. 화면 검사와 목 서버가 같은 값을 써요. (실제 서버도 같은 규칙으로 한 번 더 검사해야 해요)
 */
export const COMMUNITY_LIMITS = {
  titleMax: 50,
  bodyMax: 2000,
  commentMax: 500,
  /** 같은 사람이 글을 연달아 쓸 수 있는 간격 (초) — 도배 방지 */
  postIntervalSeconds: 30,
  /** 신고가 이만큼 쌓이면 숨겨요. */
  hideAfterReports: 3,
} as const;

export const COMMUNITY_NOTICE = '종목 추천, 매수·매도 권유, 유료 리딩방 홍보는 금지돼요';

/**
 * 쓸 수 없는 표현. 띄어쓰기·대소문자를 무시하고 찾아요.
 * label 은 안내 문구에 보여줄 이름이에요. (욕설은 그대로 보여주지 않아요)
 */
const bannedRules: { pattern: RegExp; label: string }[] = [
  { pattern: /리딩방|리딩룸/, label: '"리딩방" 같은 유료 추천방 홍보' },
  {
    pattern: /오픈채팅|오픈톡|open\.kakao\.com|카톡방|텔레그램|t\.me\//,
    label: '오픈채팅·메신저 방 링크',
  },
  {
    pattern: /수익보장|원금보장|무료추천주|급등주추천|종목추천해드/,
    label: '수익 보장·종목 추천 표현',
  },
  { pattern: /씨발|시발|ㅅㅂ|병신|ㅂㅅ|개새|좆|존나|지랄/, label: '욕설' },
];

/** 금지 표현이 있으면 안내용 이름을, 없으면 null 을 돌려줘요. */
export function findBannedWord(text: string) {
  const normalized = text.replace(/\s+/g, '').toLowerCase();
  return bannedRules.find((rule) => rule.pattern.test(normalized))?.label ?? null;
}
