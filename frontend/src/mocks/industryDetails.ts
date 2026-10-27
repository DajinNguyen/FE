/**
 * 산업 페이지 목 데이터 (설명·이유·흐름·뉴스·시가총액). 숫자는 모두 예시 값이에요.
 * 이유 문장은 지난 사실만 쓰고 예측·투자 권유 표현은 넣지 않아요.
 */
import { ApiError } from '../api/errors';
import type { CompanySummary, IndustryDetail, NewsItem } from '../types';
import { industryRecords } from './industries';
import { dateText, lastClose } from './marketClock';

const text: Record<string, { description: string; why: string; topics: string[] }> = {
  ai: {
    description:
      '사람처럼 배우고 판단하는 컴퓨터 기술(AI)과, 그 기술에 필요한 반도체·서버·전력 설비를 만드는 산업이에요.',
    why: '미국 빅테크가 데이터센터 투자를 늘리겠다고 밝혔어요. AI 서버에 들어가는 메모리와 전력 설비를 만드는 회사들의 주문이 늘었다는 소식이 이어졌어요.',
    topics: [
      '데이터센터 투자 확대 발표',
      'AI 서버용 메모리 주문 늘어',
      '전력 설비 수주 이어져',
      'AI 서비스 이용자 증가',
      '정부 AI 지원 계획 공개',
    ],
  },
  semiconductor: {
    description:
      '컴퓨터·스마트폰의 두뇌와 기억 장치 역할을 하는 반도체를 설계하고, 만들고, 만드는 장비를 공급하는 산업이에요.',
    why: '이번 달 반도체 수출이 작년보다 늘었다는 통계가 나왔어요. AI용 고성능 메모리(HBM) 판매가 늘었다는 발표도 있었어요.',
    topics: [
      '반도체 수출 증가세 이어져',
      'HBM 판매 늘었다는 실적 발표',
      '반도체 장비 주문 늘어',
      '메모리 가격 올라',
      '새 공장 짓는 계획 발표',
    ],
  },
  shipbuilding: {
    description: '큰 배(LNG 운반선·컨테이너선)와 바다 위 설비를 만드는 산업이에요.',
    why: '친환경 연료를 쓰는 배 주문이 늘었다는 소식이 이어졌어요. 배 한 척을 짓는 가격도 오른 상태예요.',
    topics: [
      'LNG 운반선 수주 이어져',
      '선박 가격 지수 올라',
      '친환경 선박 주문 늘어',
      '해외 해군 함정 정비 계약',
      '조선소 인력 채용 확대',
    ],
  },
  defense: {
    description: '전차·자주포·전투기·미사일 같은 나라를 지키는 장비를 만드는 산업이에요.',
    why: '유럽과 중동 나라들과 방산 장비 수출 계약을 맺었다는 소식이 있었어요.',
    topics: [
      '유럽에 자주포 수출 계약',
      '중동과 방공 장비 계약',
      '방산 수출액 늘어',
      '새 훈련기 개발 계획',
      '국방 예산 발표',
    ],
  },
  battery: {
    description: '전기차·휴대폰에 들어가는 배터리(2차전지)와 그 재료를 만드는 산업이에요.',
    why: '배터리 원재료(리튬) 가격이 내려가면서 관련 기업 주가는 내렸어요. 다만 새 배터리 기술 발표로 뉴스 언급은 늘었어요.',
    topics: [
      '리튬 가격 내려',
      '전기차 판매 증가세 둔화',
      '새 배터리 기술 발표',
      '해외 배터리 공장 가동',
      '배터리 재활용 사업 시작',
    ],
  },
  bio: {
    description: '바이오 의약품과 신약을 개발하고, 다른 회사 약을 대신 만들어 주는 산업이에요.',
    why: '새 약의 임상 결과 발표를 앞두고 관심이 이어졌어요. 해외 제약사와 기술 계약을 맺었다는 소식도 있었어요.',
    topics: [
      '신약 임상 결과 발표 예정',
      '해외 제약사와 기술 계약',
      '바이오시밀러 허가 받아',
      '위탁생산 공장 증설',
      '의약품 수출 늘어',
    ],
  },
  internet: {
    description: '검색·메신저·쇼핑·결제 같은 인터넷 서비스를 운영하는 산업이에요.',
    why: '여러 회사가 AI 기능을 넣은 새 서비스를 내놓았다는 소식이 이어졌어요.',
    topics: [
      '검색에 AI 기능 추가',
      '간편결제 이용액 늘어',
      '웹툰 해외 이용자 증가',
      '광고 매출 발표',
      '클라우드 사업 확대',
    ],
  },
  auto: {
    description: '자동차와 자동차 부품, 타이어를 만들고 실어 나르는 산업이에요.',
    why: '해외 판매량이 작년보다 늘었다는 발표가 있었어요. 환율 영향도 함께 이야기됐어요.',
    topics: [
      '해외 판매량 늘어',
      '전기차 신모델 공개',
      '환율이 수출에 준 영향',
      '부품 공급 계약',
      '자율주행 시험 시작',
    ],
  },
  finance: {
    description: '은행·보험·증권·카드처럼 돈을 맡고 빌려주고 관리하는 산업이에요.',
    why: '여러 금융회사가 주주에게 이익을 더 돌려주겠다는 계획을 발표했어요.',
    topics: [
      '주주환원 계획 발표',
      '은행 대출 금리 변화',
      '보험사 실적 발표',
      '증권사 거래대금 늘어',
      '카드 이용액 발표',
    ],
  },
  game: {
    description: '컴퓨터·스마트폰·콘솔 게임을 만들고 서비스하는 산업이에요.',
    why: '새 게임 출시 일정이 발표되면서 뉴스 언급은 늘었지만, 기존 게임 매출이 줄어 주가는 조금 내렸어요.',
    topics: [
      '새 게임 출시 일정 발표',
      '해외 게임쇼 참가',
      '기존 게임 매출 줄어',
      '게임 이용 시간 통계',
      '모바일 게임 순위 발표',
    ],
  },
};

/** 시가총액 예시 값 (조 원) */
const marketCaps: Record<string, number> = {
  '005930': 760,
  '000660': 300,
  '373220': 85,
  '207940': 75,
  '005380': 48,
  '000270': 40,
  '068270': 39,
  '035420': 39,
  '035720': 21,
  '051910': 20,
  '006400': 15,
  '105560': 45,
  '055550': 35,
  '012330': 28,
  '032830': 24,
  '003670': 12,
  '086790': 20,
  '316140': 16,
  '096770': 17,
  '009150': 12,
  '018260': 12,
  '012450': 40,
  '329180': 36,
  '247540': 12,
  '196170': 22,
  '042700': 11,
  '000990': 2.3,
  '011070': 4.3,
  '403870': 2.6,
  '058470': 3.3,
  '039030': 2.0,
  '240810': 1.7,
  '036930': 1.4,
  '095340': 1.6,
  '357780': 1.9,
  '005290': 1.7,
  '204320': 2.1,
  '161390': 5.7,
  '073240': 1.6,
  '011210': 1.4,
  '018880': 2.2,
  '086280': 9.6,
  '036570': 4.7,
  '251270': 4.5,
  '259960': 17.8,
  '293490': 1.4,
  '263750': 2.4,
  '112040': 1.0,
  '323410': 13,
  '377300': 5.2,
  '307950': 4.3,
  '000810': 19,
  '005830': 6.8,
  '088350': 2.7,
  '138040': 21,
  '024110': 13,
  '071050': 5.4,
  '006800': 11,
  '016360': 5.5,
  '039490': 5.6,
  '029780': 5.2,
  '000100': 9.5,
  '128940': 4.0,
  '326030': 8.2,
  '302440': 3.6,
  '006280': 1.7,
  '185750': 1.0,
  '028300': 8.0,
  '141080': 4.6,
  '145020': 4.3,
  '086520': 9.0,
  '011790': 4.2,
  '009540': 19,
  '042660': 26,
  '010140': 14.8,
  '064350': 19.9,
  '047810': 8.5,
  '079550': 8.4,
  '000880': 5.8,
  '267260': 15.4,
  '010120': 8.0,
};

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

/** 산업 예시 기사 5개 (최신순) */
export function industryNews(industryId: string): NewsItem[] {
  const info = text[industryId];
  if (!info) throw new ApiError('산업을 찾지 못했어요', 404, 'INDUSTRY_NOT_FOUND');
  return info.topics.map((topic, i) => ({
    id: `${industryId}-news-${i + 1}`,
    title: topic,
    press: '예시 뉴스',
    published_at: hoursAgo([2, 5, 20, 30, 60][i]),
    url: `https://example.com/industries/${industryId}/${i + 1}`,
    summary_short: `${topic} 소식이에요. (예시 기사)`,
    summary_long: null,
    company_stock_code: null,
    related_metric: null,
  }));
}

/** 1개월 전 대비 누적 등락률을 주 단위 5개 점으로 */
function weeklyTrend(monthChange: number, seed: number) {
  const { date } = lastClose();
  return [4, 3, 2, 1, 0].map((weeksAgo, i) => {
    const day = new Date(date);
    day.setDate(day.getDate() - weeksAgo * 7);
    const wobble = i === 0 || i === 4 ? 0 : Math.sin(seed + i) * 0.8;
    return { date: dateText(day), value: Math.round(((monthChange * i) / 4 + wobble) * 10) / 10 };
  });
}

export function industryDetail(industryId: string, companies: CompanySummary[]): IndustryDetail {
  const record = industryRecords.find((r) => r.industry_id === industryId);
  const info = text[industryId];
  if (!record || !info) throw new ApiError('산업을 찾지 못했어요', 404, 'INDUSTRY_NOT_FOUND');
  const news = industryNews(industryId).slice(0, 2);
  return {
    industry_id: record.industry_id,
    name: record.name,
    icon_key: record.icon_key,
    description: info.description,
    why: { text: info.why, news_ids: news.map((n) => n.id) },
    trend: weeklyTrend(record.factors['1m'].price_change_rate, industryRecords.indexOf(record)),
    score_breakdown: { ...record.factors['1w'], period: '1w' },
    news,
    companies: record.companies
      .map((code) => companies.find((c) => c.stock_code === code))
      .filter((c): c is CompanySummary => Boolean(c))
      .map((c) => ({
        stock_code: c.stock_code,
        name: c.name,
        intro: c.one_liner,
        market_cap: marketCaps[c.stock_code] ?? 1,
        change_rate: c.change_rate.value,
      }))
      .sort((a, b) => b.market_cap - a.market_cap),
    as_of: lastClose().asOf,
    is_sample: true,
  };
}
