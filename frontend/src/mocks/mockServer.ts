/**
 * 백엔드가 준비되기 전까지 API 응답을 흉내 내는 목 서버예요.
 * src/api/* 에서만 import 해요. (컴포넌트·훅에서 직접 import 금지)
 *
 * 개발 중 확인용 주소 옵션
 * - ?mock_report=fail : 리포트 생성이 실패하는 경우를 흉내 내요.
 * - ?mock_market=fail : 메인 시장 정보를 불러오지 못하는 경우를 흉내 내요.
 */
import companiesJson from './companies.json';
import { hotIndustries } from './industries';
import { marketSummary } from './market';
import { companyNews, marketNews } from './news';
import crosswordsJson from './crosswords.json';
import samsungJson from './samsungElectronics.json';
import termsJson from './terms.json';
import { ApiError } from '../api/errors';
import type { AuthUser } from '../features/auth/AuthContext';
import type {
  CompanyDetail,
  CompanyReport,
  CompanySummary,
  CrosswordPuzzle,
  CrosswordSummary,
  Financials,
  HeatPeriod,
  HomeDashboard,
  MarketSummary,
  NewsItem,
  NewsPage,
  PriceHistory,
  PricePeriod,
  SectorGroup,
  Term,
} from '../types';

const isTest = import.meta.env.MODE === 'test';
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, isTest ? 0 : ms));

const companies = companiesJson as CompanySummary[];
const terms = termsJson as Term[];

/** 재무·뉴스·리포트 원본이 있는 회사. 다른 회사를 추가하려면 JSON을 만들고 여기에 등록해요. */
const companyData: Record<
  string,
  { company: CompanyDetail; financials: Financials; report: CompanyReport }
> = {
  '005930': samsungJson as unknown as {
    company: CompanyDetail;
    financials: Financials;
    report: CompanyReport;
  },
};

function findCompany(stockCode: string) {
  const company = companies.find((c) => c.stock_code === stockCode);
  if (!company) throw new ApiError('회사를 찾지 못했어요', 404, 'COMPANY_NOT_FOUND');
  return company;
}

function getData(stockCode: string) {
  const data = companyData[stockCode];
  if (!data) throw new ApiError('자료를 찾지 못했어요', 404, 'DATA_NOT_FOUND');
  return data;
}

/** 직전 거래일(주말 제외) YYYY-MM-DD. 실시간이 아니라 전날 자료일 수 있다는 걸 흉내 내요. */
function lastTradingDate() {
  const date = new Date();
  do {
    date.setDate(date.getDate() - 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, '');

export async function searchCompanies(query: string, limit: number): Promise<CompanySummary[]> {
  await wait(200);
  const q = normalize(query);
  if (!q) return [];
  return companies
    .filter((c) => [c.name, c.name_en, c.stock_code].some((field) => normalize(field).includes(q)))
    .slice(0, limit);
}

export async function getCompaniesByCodes(codes: string[]): Promise<CompanySummary[]> {
  await wait(150);
  return codes
    .map((code) => companies.find((c) => c.stock_code === code))
    .filter((c): c is CompanySummary => Boolean(c));
}

/** 원본 JSON이 없는 회사는 검색 목록 정보만으로 채워요. (사업 설명 등은 빈 값) */
export async function getCompany(stockCode: string): Promise<CompanyDetail> {
  await wait(150);
  const data = companyData[stockCode];
  if (data) return { ...data.company, price_as_of: lastTradingDate() };
  const summary = findCompany(stockCode);
  return {
    ...summary,
    price_as_of: lastTradingDate(),
    market_cap: null,
    homepage_url: '',
    dart_url: 'https://dart.fss.or.kr/',
    business_description: '',
    business_segments: [],
    timeline: [],
    timeline_source: '',
  };
}

export async function getFinancials(stockCode: string): Promise<Financials> {
  await wait(250);
  return getData(stockCode).financials;
}

/** 기업 뉴스: 최신순, 페이지 단위 */
export async function getCompanyNews(
  stockCode: string,
  page: number,
  size: number,
): Promise<NewsPage> {
  await wait(250);
  const all = companyNews(findCompany(stockCode));
  const start = (page - 1) * size;
  return { items: all.slice(start, start + size), page, size, has_next: start + size < all.length };
}

/**
 * 메인 "오늘의 시장". 주소에 ?mock_market=fail 을 붙이면 실패를 흉내 내요.
 */
export async function getMarketSummary(): Promise<MarketSummary> {
  await wait(200);
  if (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mock_market') === 'fail'
  ) {
    throw new ApiError('시장 정보를 불러오지 못했어요', 503, 'MARKET_UNAVAILABLE');
  }
  return marketSummary();
}

/** 시장 뉴스 (목 데이터는 날짜와 상관없이 같은 목록) */
export async function getMarketNews(date: string): Promise<NewsItem[]> {
  await wait(200);
  void date;
  return marketNews();
}

/* ------------------------------------------------------------------ */
/* 산업                                                                */
/* ------------------------------------------------------------------ */

export async function getHotIndustries(period: HeatPeriod) {
  await wait(200);
  return hotIndustries(period);
}

/* ------------------------------------------------------------------ */
/* AI 리포트: 없음 → 생성 중(약 15초) → 완료 / 실패                   */
/* ------------------------------------------------------------------ */

/** 실제 생성 시간(약 16초)과 비슷하게 맞췄어요. */
const GENERATION_MS = isTest ? 0 : 15_000;

interface ReportJob {
  startedAt: number;
  fail: boolean;
}

/** 서버의 리포트 저장소 흉내. 새로고침 전까지 기억해요. 삼성전자는 이미 만들어 둔 상태로 시작해요. */
const doneReports = new Map<string, CompanyReport>([['005930', companyData['005930'].report]]);
const failedReports = new Map<string, string>();
const jobs = new Map<string, ReportJob>();

const emptyReport = (stockCode: string, status: CompanyReport['status']): CompanyReport => ({
  stock_code: stockCode,
  status,
  generated_at: null,
  headline: '',
  key_points: [],
  evidence: { financials: null, news: [], vision: null },
  quiz: [],
  sources: [],
  failure_reason: null,
});

const shouldFail = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('mock_report') === 'fail';

/** 생성 시간이 지났으면 작업을 끝내고 결과를 저장해요. */
function settle(stockCode: string) {
  const job = jobs.get(stockCode);
  if (!job || Date.now() - job.startedAt < GENERATION_MS) return;
  jobs.delete(stockCode);
  const source = companyData[stockCode]?.report;
  if (job.fail || !source) {
    failedReports.set(
      stockCode,
      job.fail
        ? '자료를 정리하는 중에 문제가 생겼어요.'
        : '이 기업의 재무제표를 아직 불러오지 못했어요. (시연용 목 데이터에는 삼성전자 자료만 있어요)',
    );
    return;
  }
  failedReports.delete(stockCode);
  doneReports.set(stockCode, { ...source, generated_at: new Date().toISOString() });
}

/**
 * 응답 규칙: 마지막으로 성공한 리포트 내용 + 지금 상태.
 * 다시 만드는 중이거나 실패해도 이전 내용은 그대로 담아서 보내요.
 */
function currentReport(stockCode: string): CompanyReport {
  settle(stockCode);
  const base = doneReports.get(stockCode) ?? emptyReport(stockCode, 'none');
  if (jobs.has(stockCode)) return { ...base, status: 'generating', failure_reason: null };
  const failure = failedReports.get(stockCode);
  if (failure) return { ...base, status: 'failed', failure_reason: failure };
  return base;
}

export async function getCompanyReport(stockCode: string): Promise<CompanyReport> {
  findCompany(stockCode);
  await wait(120);
  return currentReport(stockCode);
}

/** 새로 만들기 시작해요. (실제로는 DART·뉴스·사업보고서를 읽고 Claude API 호출) */
export async function generateReport(stockCode: string): Promise<CompanyReport> {
  findCompany(stockCode);
  await wait(200);
  if (!jobs.has(stockCode)) {
    jobs.set(stockCode, { startedAt: Date.now(), fail: shouldFail() });
  }
  return currentReport(stockCode);
}

/* ------------------------------------------------------------------ */
/* 메인 대시보드                                                       */
/* ------------------------------------------------------------------ */

const pick = (codes: string[]) =>
  codes
    .map((code) => companies.find((c) => c.stock_code === code))
    .filter(Boolean) as CompanySummary[];

/** 거래대금(억 원) 예시 값. 순위 30개까지 */
const tradingValues: [string, number][] = [
  ['005930', 21450],
  ['000660', 18730],
  ['012450', 9820],
  ['329180', 7640],
  ['373220', 6210],
  ['035420', 4380],
  ['005380', 3920],
  ['042700', 3510],
  ['068270', 3150],
  ['003230', 2980],
  ['247540', 2740],
  ['000270', 2510],
  ['035720', 2330],
  ['207940', 2180],
  ['006400', 1990],
  ['105560', 1820],
  ['009150', 1710],
  ['196170', 1640],
  ['005490', 1520],
  ['003670', 1410],
  ['051910', 1330],
  ['012330', 1240],
  ['055550', 1150],
  ['010130', 1070],
  ['097950', 980],
  ['015760', 910],
  ['066570', 860],
  ['271560', 790],
  ['086790', 720],
  ['000990', 650],
];

export async function getHomeDashboard(): Promise<HomeDashboard> {
  await wait(200);
  const headlineOf = (code: string) => {
    const report = doneReports.get(code);
    return report?.status === 'done' && report.headline ? report.headline : null;
  };
  const bySector = (group: SectorGroup) => companies.filter((c) => c.sector_group === group);

  return {
    base_time: `${lastTradingDate()} 15:30`,
    trading_value_top: tradingValues.map(([code, value]) => ({
      ...findCompany(code),
      trading_value: { value, is_sample: true },
      ai_headline: headlineOf(code),
    })),
    sector_companies: {
      semiconductor: bySector('semiconductor'),
      auto: bySector('auto'),
      internet: bySector('internet'),
      finance: bySector('finance'),
      food: bySector('food'),
      etc: bySector('etc'),
    },
    rising: {
      criteria: '기준을 정하는 중이에요. 지금은 예시 목록이에요.',
      items: pick(['012450', '329180', '009150', '196170', '000660', '015760']),
    },
    most_viewed: {
      criteria: '다진에서 최근 7일 동안 많이 본 기업 (집계 기준 정하는 중 · 예시 목록)',
      items: pick(['005930', '000660', '035720', '005380', '035420', '373220']),
    },
    ai_analyzed: [...doneReports.values()]
      .filter((r) => r.status === 'done' && r.generated_at)
      .map((r) => ({
        stock_code: r.stock_code,
        name: findCompany(r.stock_code).name,
        headline: r.headline,
        generated_at: r.generated_at as string,
      })),
  };
}

/* ------------------------------------------------------------------ */
/* 주가 (예시)                                                         */
/* ------------------------------------------------------------------ */

const pricePeriods: Record<PricePeriod, { count: number; stepDays: number; volatility: number }> = {
  '1m': { count: 22, stepDays: 1, volatility: 0.014 },
  '3m': { count: 64, stepDays: 1, volatility: 0.014 },
  '6m': { count: 126, stepDays: 1, volatility: 0.014 },
  '1y': { count: 52, stepDays: 7, volatility: 0.032 },
};

/** 같은 입력이면 항상 같은 값을 내는 난수 (그래프가 새로고침마다 바뀌지 않게) */
function seededRandom(seedText: string) {
  let seed = [...seedText].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

/** 예시 주가 흐름. 마지막 값은 현재가(예시 값)와 같아요. */
export async function getPriceHistory(
  stockCode: string,
  period: PricePeriod,
): Promise<PriceHistory> {
  await wait(200);
  const company = findCompany(stockCode);

  const { count, stepDays, volatility } = pricePeriods[period];
  const random = seededRandom(`${stockCode}-${period}`);
  const tick = company.current_price.value >= 50_000 ? 100 : 50;

  const closes = [company.current_price.value];
  for (let i = 1; i < count; i += 1) {
    const change = (random() - 0.47) * 2 * volatility;
    closes.unshift(Math.round(closes[0] / (1 + change) / tick) * tick);
  }

  // 마지막 값은 직전 거래일 종가예요. (실시간 시세가 아니에요)
  const dates: string[] = [];
  const cursor = new Date(`${lastTradingDate()}T12:00:00`);
  while (dates.length < count) {
    const day = cursor.getDay();
    if (stepDays > 1 || (day !== 0 && day !== 6)) dates.unshift(toDateString(cursor));
    cursor.setDate(cursor.getDate() - stepDays);
  }

  return {
    stock_code: stockCode,
    period,
    is_sample: true,
    points: closes.map((close, i) => ({ date: dates[i], close })),
  };
}

export async function getTerms(): Promise<Term[]> {
  await wait(100);
  return terms;
}

/* ------------------------------------------------------------------ */
/* 가로세로 낱말퀴즈 (직접 설계한 퍼즐 3개)                              */
/* ------------------------------------------------------------------ */

const crosswords = crosswordsJson as CrosswordPuzzle[];

export async function getCrosswordPuzzles(): Promise<CrosswordSummary[]> {
  await wait(120);
  return crosswords.map(({ id, title, difficulty, size, words }) => ({
    id,
    title,
    difficulty,
    size,
    word_count: words.length,
  }));
}

export async function getCrosswordPuzzle(puzzleId: string): Promise<CrosswordPuzzle> {
  await wait(120);
  const puzzle = crosswords.find((p) => p.id === puzzleId);
  if (!puzzle) throw new ApiError('퍼즐을 찾지 못했어요', 404, 'PUZZLE_NOT_FOUND');
  return puzzle;
}

/** 목 모드는 실제 로그인이 없어서 항상 로그아웃 상태로 둬요. */
export async function getMe(): Promise<AuthUser | null> {
  await wait(80);
  return null;
}

export async function logout(): Promise<void> {
  await wait(80);
}
