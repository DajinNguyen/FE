/**
 * 백엔드가 준비되기 전까지 API 응답을 흉내 내는 목 서버예요.
 * src/api/* 에서만 import 해요. (컴포넌트·훅에서 직접 import 금지)
 */
import companiesJson from './companies.json';
import samsungJson from './samsungElectronics.json';
import termsJson from './terms.json';
import { ApiError } from '../api/errors';
import type {
  CompanyDetail,
  CompanyReport,
  CompanySummary,
  Financials,
  NewsItem,
  PriceHistory,
  PricePeriod,
  Term,
} from '../types';

const isTest = import.meta.env.MODE === 'test';
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, isTest ? 0 : ms));

const companies = companiesJson as CompanySummary[];
const terms = termsJson as Term[];

/** 리포트가 준비된 회사. 다른 회사를 추가하려면 JSON을 만들고 여기에 등록해요. */
const companyData: Record<
  string,
  { company: CompanyDetail; financials: Financials; news: NewsItem[]; report: CompanyReport }
> = {
  '005930': samsungJson as unknown as {
    company: CompanyDetail;
    financials: Financials;
    news: NewsItem[];
    report: CompanyReport;
  },
};

function getData(stockCode: string) {
  const data = companyData[stockCode];
  if (!data) {
    throw new ApiError('시연에서는 삼성전자 리포트만 준비되어 있어요', 404, 'REPORT_NOT_READY');
  }
  return data;
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

export async function getPopularCompanies(): Promise<CompanySummary[]> {
  await wait(150);
  return companies.slice(0, 5);
}

export async function getCompaniesByCodes(codes: string[]): Promise<CompanySummary[]> {
  await wait(150);
  return codes
    .map((code) => companies.find((c) => c.stock_code === code))
    .filter((c): c is CompanySummary => Boolean(c));
}

export async function getCompany(stockCode: string): Promise<CompanyDetail> {
  await wait(150);
  return getData(stockCode).company;
}

export async function getFinancials(stockCode: string): Promise<Financials> {
  await wait(250);
  return getData(stockCode).financials;
}

export async function getNews(stockCode: string): Promise<NewsItem[]> {
  await wait(250);
  return getData(stockCode).news;
}

/** 서버의 리포트 저장소 흉내. 생성한 리포트는 새로고침 전까지 기억해요. */
const savedReports = new Map<string, CompanyReport>();

/** 저장된 리포트가 있으면 바로 돌려주고, 없으면 404 예요. */
export async function getSavedReport(stockCode: string): Promise<CompanyReport> {
  getData(stockCode);
  await wait(120);
  const saved = savedReports.get(stockCode);
  if (!saved) throw new ApiError('아직 만든 리포트가 없어요', 404, 'REPORT_NOT_FOUND');
  return { ...saved, is_cached: true };
}

/** AI 리포트를 새로 만들어요. (실제로는 DART·뉴스·사업보고서를 읽고 Claude API 호출) */
export async function generateReport(stockCode: string): Promise<CompanyReport> {
  const { report } = getData(stockCode);
  const startedAt = performance.now();
  await wait(3000);
  const generated: CompanyReport = {
    ...report,
    is_cached: false,
    generated_at: new Date().toISOString(),
    generation_seconds: Math.round((performance.now() - startedAt) / 100) / 10,
  };
  savedReports.set(stockCode, generated);
  return generated;
}

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
  const company = companies.find((c) => c.stock_code === stockCode);
  if (!company) throw new ApiError('회사를 찾지 못했어요', 404, 'COMPANY_NOT_FOUND');

  const { count, stepDays, volatility } = pricePeriods[period];
  const random = seededRandom(`${stockCode}-${period}`);
  const tick = company.current_price.value >= 50_000 ? 100 : 50;

  const closes = [company.current_price.value];
  for (let i = 1; i < count; i += 1) {
    const change = (random() - 0.47) * 2 * volatility;
    closes.unshift(Math.round(closes[0] / (1 + change) / tick) * tick);
  }

  const dates: string[] = [];
  const cursor = new Date();
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
