/**
 * 모의투자 목 서버 (메모리 저장). 실제 서버도 같은 규칙으로 판단해요. (문서 19장)
 * - 앰똥깡을 가상 현금으로 환전 (정수 ADK, 1 ADK = ADK_TO_WON 원, 되돌릴 수 없음)
 * - 가상 현금 = 환전한 돈 + 판 돈 − 산 돈. 사고팔아도 앰똥깡은 그대로예요.
 * - 가격: 지연 시세 (여기서는 companies.json 의 current_price)
 * - 초기화 없음
 */
import { ApiError } from '../../src/api/errors';
import { ADK_TO_WON, MAX_ORDER_QUANTITY } from '../../src/config/mockInvest';
import type {
  CompanySummary,
  MockExchangeResult,
  MockHolding,
  MockOrderRequest,
  MockOrderResult,
  MockPortfolio,
  MockTrade,
} from '../../src/types';
import companiesJson from './companies.json';
import { getSessionUser } from './session';
import { currentBalance, settleMockInvest } from './wallet';

const companies = companiesJson as CompanySummary[];

interface Account {
  holdings: Map<string, { quantity: number; avgPrice: number }>;
  trades: MockTrade[];
  /** 가상 현금 (원) */
  cash: number;
  exchanged: boolean;
}

let accounts = new Map<string, Account>();
let seq = 0;

/** 지연 시세 기준 시각 (테스트에서 고정) */
export const MOCK_PRICE_AS_OF = '2026-11-18 10:20';

function viewer() {
  const user = getSessionUser();
  if (!user) throw new ApiError('로그인이 필요해요', 401, 'UNAUTHORIZED');
  return user.id;
}

function accountOf(userId: string) {
  let account = accounts.get(userId);
  if (!account) {
    account = { holdings: new Map(), trades: [], cash: 0, exchanged: false };
    accounts.set(userId, account);
  }
  return account;
}

function quote(stockCode: string) {
  const company = companies.find((c) => c.stock_code === stockCode);
  if (!company) throw new ApiError('회사를 찾지 못했어요', 404, 'COMPANY_NOT_FOUND');
  return {
    name: company.name,
    price: company.current_price.value,
    changeRate: company.change_rate.value,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function toPortfolio(account: Account): MockPortfolio {
  const holdings: MockHolding[] = [...account.holdings.entries()].map(([code, h]) => {
    const q = quote(code);
    const evaluation = q.price * h.quantity;
    const cost = h.avgPrice * h.quantity;
    return {
      stock_code: code,
      name: q.name,
      quantity: h.quantity,
      avg_price: Math.round(h.avgPrice),
      current_price: q.price,
      change_rate: q.changeRate,
      evaluation,
      profit: Math.round(evaluation - cost),
      profit_rate: round2(((evaluation - cost) / cost) * 100),
    };
  });
  const evaluation = holdings.reduce((sum, h) => sum + h.evaluation, 0);
  const cost = holdings.reduce((sum, h) => sum + h.avg_price * h.quantity, 0);
  const todayChange = holdings.reduce(
    (sum, h) => sum + h.evaluation - h.evaluation / (1 + h.change_rate / 100),
    0,
  );
  const cash = account.cash;
  return {
    started: account.trades.length > 0 || account.exchanged,
    adk_to_won: ADK_TO_WON,
    adk_balance: currentBalance(),
    cash,
    evaluation,
    total_asset: cash + evaluation,
    profit: Math.round(evaluation - cost),
    profit_rate: holdings.length > 0 ? round2(((evaluation - cost) / cost) * 100) : null,
    today_change: Math.round(todayChange),
    // 실제 서버처럼 보유 종목이 없으면 null
    price_as_of: holdings.length > 0 ? MOCK_PRICE_AS_OF : null,
    holdings,
  };
}

export async function getMockPortfolio(): Promise<MockPortfolio> {
  return toPortfolio(accountOf(viewer()));
}

export async function getMockTrades(): Promise<MockTrade[]> {
  return accountOf(viewer()).trades.slice(0, 50);
}

/** 테스트에서 주문 횟수 제한(429)을 흉내 낼 때: 남은 초 */
let rateLimitedFor: number | null = null;
export const limitMockOrders = (seconds: number | null) => {
  rateLimitedFor = seconds;
};

export async function placeMockOrder(body: MockOrderRequest): Promise<MockOrderResult> {
  const account = accountOf(viewer());
  if (rateLimitedFor !== null) {
    throw new ApiError('주문이 너무 잦아요', 429, 'RATE_LIMITED', { retry_after: rateLimitedFor });
  }
  const quantity = body.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ORDER_QUANTITY) {
    throw new ApiError('수량을 확인해 주세요', 400, 'INVALID_QUANTITY');
  }
  const q = quote(body.stock_code);
  const amount = q.price * quantity;
  const held = account.holdings.get(body.stock_code);

  if (body.side === 'buy') {
    if (amount > account.cash) {
      throw new ApiError('가상 현금이 모자라요', 400, 'INSUFFICIENT_CASH', {
        required: amount,
        cash: account.cash,
      });
    }
    account.cash -= amount;
    const prevQty = held?.quantity ?? 0;
    const prevCost = (held?.avgPrice ?? 0) * prevQty;
    account.holdings.set(body.stock_code, {
      quantity: prevQty + quantity,
      avgPrice: (prevCost + amount) / (prevQty + quantity),
    });
  } else {
    if (!held || held.quantity < quantity) {
      throw new ApiError('가진 수량보다 많이 팔 수 없어요', 400, 'INSUFFICIENT_QUANTITY', {
        held: held?.quantity ?? 0,
      });
    }
    account.cash += amount;
    if (held.quantity === quantity) account.holdings.delete(body.stock_code);
    else held.quantity -= quantity;
  }

  seq += 1;
  const trade: MockTrade = {
    id: `t${seq}`,
    stock_code: body.stock_code,
    name: q.name,
    side: body.side,
    quantity,
    price: q.price,
    amount,
    amount_adk: 0,
    created_at: new Date().toISOString(),
  };
  account.trades.unshift(trade);
  return { trade, balance: currentBalance(), portfolio: toPortfolio(account) };
}

/** 앰똥깡 → 가상 현금 환전 */
export async function exchangeMockCash(body: { adk: unknown }): Promise<MockExchangeResult> {
  const account = accountOf(viewer());
  const adk = body.adk;
  if (typeof adk !== 'number' || !Number.isInteger(adk) || adk < 1) {
    throw new ApiError('1 ADK 단위로 정해 주세요', 400, 'INVALID_AMOUNT');
  }
  const won = adk * ADK_TO_WON;
  const balance = settleMockInvest(
    'spend',
    adk,
    `모의투자 · ${adk} ADK를 가상 ${won.toLocaleString('ko-KR')}원으로 환전`,
  );
  account.cash += won;
  account.exchanged = true;
  seq += 1;
  return {
    exchange: { id: `x${seq}`, adk, won, created_at: new Date().toISOString() },
    balance,
    portfolio: toPortfolio(account),
  };
}

/** 테스트에서 확인할 때 */
export const serverMockInvest = {
  holdings: (userId: string) => accounts.get(userId)?.holdings,
  trades: (userId: string) => accounts.get(userId)?.trades ?? [],
  cash: (userId: string) => accounts.get(userId)?.cash ?? 0,
  /** 테스트에서 환전해 둔 상태로 시작할 때 */
  setCash: (userId: string, won: number) => {
    const account = accountOf(userId);
    account.cash = won;
    account.exchanged = true;
  },
};

export function resetMockInvestStore() {
  accounts = new Map();
  seq = 0;
  rateLimitedFor = null;
}
