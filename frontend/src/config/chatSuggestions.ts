import type { ChatContext } from '../types';

/**
 * 챗봇 추천 질문 (페이지 종류마다 3개). 투자 추천·예측을 묻는 질문은 넣지 않아요.
 * 기업 화면은 탭마다 달라요.
 */
const suggestions = {
  main: ['오늘 시장은 왜 움직였어요?', '코스피와 코스닥은 뭐가 달라요?', '거래대금이 뭐예요?'],
  'company:overview': [
    '이 회사는 뭘로 돈을 벌어요?',
    '최근 사업 성과를 쉽게 설명해 줘',
    '이 회사가 속한 산업은 어떤 곳이에요?',
  ],
  'company:financials': [
    '영업이익률이 뭐예요?',
    '매출과 영업이익은 뭐가 달라요?',
    '부채비율은 어떻게 읽어요?',
  ],
  'company:news': [
    '이 뉴스들을 쉽게 정리해 줘',
    '이 뉴스가 회사와 무슨 관계예요?',
    '공시가 뭐예요?',
  ],
  'company:community': [
    '커뮤니티 규칙을 알려 줘',
    '이 회사 사업을 한 줄로 설명해 줘',
    '시가총액이 뭐예요?',
  ],
  company: [
    '이 회사는 뭘로 돈을 벌어요?',
    '시가총액이 뭐예요?',
    '이 회사 숫자를 쉽게 읽는 법을 알려 줘',
  ],
  report: [
    'AI 리포트를 더 쉽게 설명해 줘',
    '핵심 포인트에 나온 용어를 알려 줘',
    '이 숫자는 어디서 나온 거예요?',
  ],
  compare: [
    '두 회사의 가장 큰 차이가 뭐예요?',
    '영업이익률이 다르면 무슨 뜻이에요?',
    '두 회사 사업은 어떻게 달라요?',
  ],
  industry: [
    '이 산업은 어떤 일을 해요?',
    '이 산업에 속한 회사들은 어떻게 달라요?',
    '이 산업 뉴스를 쉽게 정리해 줘',
  ],
  learn: [
    '이 용어를 예시로 설명해 줘',
    '헷갈리는 용어를 비교해 줘',
    '처음 배우면 좋은 용어를 알려 줘',
  ],
  other: ['다진은 어떻게 쓰면 돼요?', '재무제표가 뭐예요?', '용어를 쉽게 익히는 방법을 알려 줘'],
} as const;

export function chatSuggestions(context: ChatContext): readonly string[] {
  if (context.page === 'company') {
    const key = `company:${context.tab}` as keyof typeof suggestions;
    return suggestions[key] ?? suggestions.company;
  }
  return suggestions[context.page];
}
