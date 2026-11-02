/**
 * 뉴스 목 데이터. 실제 기사처럼 보이지 않도록 예시 기사는 언론사를 "예시 뉴스", 주소를 example.com 으로 둬요.
 * 시각은 지금 기준으로 계산해서 "3시간 전" 같은 표시를 확인할 수 있어요.
 */
import type { CompanySummary, NewsItem } from '../types';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

/** 삼성전자 뉴스룸 기사 (리포트 근거에도 쓰여요) */
export const samsungNewsroom: NewsItem[] = [
  {
    id: 'samsung-2025q4',
    title: '삼성전자, 2025년 4분기 매출 93.8조 원… 분기 기준 역대 최대',
    press: '삼성전자 뉴스룸',
    published_at: '2026-01-29T09:00:00+09:00',
    url: 'https://news.samsung.com/kr/',
    summary_short:
      '4분기 매출 93.8조 원, 영업이익 20.1조 원으로 분기 기준 가장 좋은 실적을 냈어요.',
    summary_long:
      '2025년 4분기에 매출 93.8조 원, 영업이익 20.1조 원으로 분기 기준 역대 가장 좋은 실적을 냈어요. AI용 메모리(HBM) 판매가 늘어난 덕분이에요.',
    company_stock_code: '005930',
    related_metric: { label: '2025년 매출', value: '333.6조 원' },
  },
  {
    id: 'samsung-hbm4',
    title: '삼성전자, HBM4 공급 시작 계획 발표',
    press: '삼성전자 뉴스룸',
    published_at: '2026-01-29T10:00:00+09:00',
    url: 'https://news.samsung.com/kr/',
    summary_short: '다음 세대 AI 메모리인 HBM4 공급을 시작할 계획이라고 밝혔어요.',
    summary_long:
      'HBM 판매를 늘린 데 이어, 다음 세대 제품인 HBM4 공급을 시작할 계획이라고 밝혔어요. AI 제품 경쟁력으로 AI 시대를 이끌겠다는 방향이에요.',
    company_stock_code: '005930',
    related_metric: { label: '반도체(DS) 매출', value: '44.0조 원' },
  },
];

/** 기업 이름으로 만드는 예시 기사 틀 (예측·투자 권유 표현 없이 사실만) */
const companyTemplates = [
  ['신규 설비 투자 계획 발표', '공장과 설비에 새로 투자하겠다는 계획을 밝혔어요.'],
  ['분기 실적 발표 일정 공개', '다음 분기 실적을 발표하는 날짜를 공시했어요.'],
  ['해외 공장 가동률 높여', '해외 공장의 생산량을 늘리고 있다고 밝혔어요.'],
  ['연구개발 인력 채용 확대', '새 기술 개발을 위해 연구 인력을 더 뽑기로 했어요.'],
  ['주주총회에서 새 이사 선임', '주주총회에서 회사를 이끌 새 이사를 뽑았어요.'],
  ['친환경 공정 전환 계획 공개', '탄소 배출을 줄이는 공정으로 바꾸겠다는 계획을 내놨어요.'],
  ['협력사와 공동 기술 개발 협약', '부품을 만드는 협력사와 함께 기술을 개발하기로 했어요.'],
  ['배당 정책 안내', '앞으로 주주에게 이익을 어떻게 나눌지 안내했어요.'],
  ['신제품 출시 일정 발표', '새 제품을 언제 내놓을지 발표했어요.'],
  ['사업보고서 공시', '1년 동안의 사업 내용을 정리한 사업보고서를 공시했어요.'],
  ['해외 매출 비중 늘어', '해외에서 번 매출의 비중이 커졌다고 밝혔어요.'],
  ['안전 점검 결과 공개', '공장 안전 점검 결과를 공개했어요.'],
] as const;

const companyHours = [1, 3, 5, 9, 20, 28, 50, 75, 100, 150, 200, 260];

export function companyNews(company: Pick<CompanySummary, 'stock_code' | 'name'>): NewsItem[] {
  const samples = companyTemplates.map(([title, summary], i) => ({
    id: `${company.stock_code}-sample-${i + 1}`,
    title: `${company.name}, ${title}`,
    press: '예시 뉴스',
    published_at: hoursAgo(companyHours[i]),
    url: `https://example.com/news/${company.stock_code}/${i + 1}`,
    summary_short: summary,
    summary_long: null,
    company_stock_code: company.stock_code,
    related_metric: null,
  }));
  const real = company.stock_code === '005930' ? samsungNewsroom : [];
  return [...samples, ...real].sort((a, b) => b.published_at.localeCompare(a.published_at));
}

/** 시장 뉴스 (메인 "왜 움직였나요?"의 근거로도 쓰여요) */
export function marketNews(): NewsItem[] {
  const items: [string, string, string, number][] = [
    [
      'market-chip',
      '미국 빅테크, 데이터센터 투자 확대 발표',
      'AI 서버를 늘리겠다는 발표에 메모리 반도체 수요 기대가 커졌어요.',
      2,
    ],
    [
      'market-chip-2',
      '반도체 수출 증가세 이어져',
      '이번 달 반도체 수출이 작년보다 늘었다는 통계가 나왔어요.',
      4,
    ],
    [
      'market-fx',
      '원·달러 환율 하락',
      '달러 대비 원화 가치가 올라 외국인 투자자의 부담이 줄었어요.',
      3,
    ],
    [
      'market-foreign',
      '외국인 투자자, 대형주 중심으로 순매수',
      '외국인 투자자가 판 것보다 산 주식이 더 많았어요.',
      5,
    ],
    [
      'market-bio',
      '바이오 업종, 임상 결과 발표 앞두고 관망',
      '임상 결과 발표를 앞두고 거래가 줄었어요.',
      6,
    ],
    [
      'market-battery',
      '2차전지 업종, 원재료 가격 하락 영향',
      '배터리 원재료 가격이 내려 관련 기업 주가가 약했어요.',
      7,
    ],
  ];
  return items.map(([id, title, summary, hours]) => ({
    id,
    title,
    press: '예시 뉴스',
    published_at: hoursAgo(hours),
    url: `https://example.com/market/${id}`,
    summary_short: summary,
    summary_long: null,
    company_stock_code: null,
    related_metric: null,
  }));
}
