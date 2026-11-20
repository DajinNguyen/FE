/**
 * 앰똥깡(ADK) 지갑 목 서버 (메모리 저장). 실제 서버도 같은 규칙으로 판단해요.
 * 지금 요청한 사람은 session.ts 의 사용자예요. 없으면 401.
 */
import { ApiError } from '../../src/api/errors';
import { ADK_COST, PUZZLE_REWARD, SIGNUP_BONUS } from '../../src/config/currency';
import type { PuzzleCompletionResult, Wallet, WalletHistoryItem } from '../../src/types';
import { localDate } from '../../src/utils/date';
import { isCrosswordSolved, revealedCrosswords } from './mockServer';
import { getSessionUser } from './session';

interface StoredWallet {
  balance: number;
  done: number;
  rewardDate: string;
  rewardCount: number;
  countedToday: string[];
  history: WalletHistoryItem[];
}

let wallets = new Map<string, StoredWallet>();
let seq = 0;

function viewer() {
  const user = getSessionUser();
  if (!user) throw new ApiError('로그인이 필요해요', 401, 'UNAUTHORIZED');
  return user.id;
}

const entry = (type: 'earn' | 'spend', amount: number, reason: string): WalletHistoryItem => {
  seq += 1;
  return { id: `h${seq}`, type, amount, reason, created_at: new Date().toISOString() };
};

/** 처음 보는 사용자는 가입 선물을 받은 지갑으로 시작해요. */
function walletOf(userId: string): StoredWallet {
  let wallet = wallets.get(userId);
  if (!wallet) {
    wallet = {
      balance: SIGNUP_BONUS,
      done: 0,
      rewardDate: localDate(),
      rewardCount: 0,
      countedToday: [],
      history: [entry('earn', SIGNUP_BONUS, '가입 선물')],
    };
    wallets.set(userId, wallet);
  }
  // 날짜가 바뀌면 오늘 보상 횟수만 0으로 (진행도는 남겨요)
  if (wallet.rewardDate !== localDate()) {
    Object.assign(wallet, { rewardDate: localDate(), rewardCount: 0, countedToday: [] });
  }
  return wallet;
}

const toWallet = (w: StoredWallet): Wallet => ({
  balance: w.balance,
  puzzle_progress: { done: w.done, required: PUZZLE_REWARD.puzzlesPerReward },
  reward_count_today: w.rewardCount,
  reward_daily_limit: PUZZLE_REWARD.dailyLimit,
  history: w.history.slice(0, 10),
});

export async function getWallet(): Promise<Wallet> {
  return toWallet(walletOf(viewer()));
}

/**
 * 서버처럼: 마지막으로 채운 칸이 정답과 모두 같고, 정답 보기를 쓰지 않았고(서버가 기록), 오늘 이미 센 퀴즈·하루 한도
 * 이후가 아니어야 세요. 3개째에 +20 ADK
 */
export async function completePuzzle(body: {
  puzzle_id: string;
  used_reveal: boolean;
  entries?: Record<string, string>;
}): Promise<PuzzleCompletionResult> {
  const w = walletOf(viewer());
  let rewarded = false;
  const counts =
    !body.used_reveal &&
    !revealedCrosswords.has(body.puzzle_id) &&
    body.entries !== undefined &&
    isCrosswordSolved(body.puzzle_id, body.entries) &&
    !w.countedToday.includes(body.puzzle_id) &&
    w.rewardCount < PUZZLE_REWARD.dailyLimit;
  if (counts) {
    w.countedToday.push(body.puzzle_id);
    w.done += 1;
    if (w.done >= PUZZLE_REWARD.puzzlesPerReward) {
      w.done = 0;
      w.rewardCount += 1;
      w.balance += PUZZLE_REWARD.amount;
      w.history.unshift(entry('earn', PUZZLE_REWARD.amount, '낱말퀴즈 보상'));
      rewarded = true;
    }
  }
  const { puzzle_progress, reward_count_today, reward_daily_limit } = toWallet(w);
  return { puzzle_progress, rewarded, balance: w.balance, reward_count_today, reward_daily_limit };
}

/** 리포트·챗봇에서 쓰는 차감 (서버 안에서 해요). 부족하면 400 */
export function spend(reason: keyof typeof ADK_COST, label: string) {
  const w = walletOf(viewer());
  const cost = ADK_COST[reason];
  if (w.balance < cost) {
    throw new ApiError('앰똥깡이 부족해요', 400, 'INSUFFICIENT_BALANCE');
  }
  w.balance -= cost;
  w.history.unshift(entry('spend', cost, label));
  return w.balance;
}

/** 실패해서 돌려줄 때 */
export function refund(reason: keyof typeof ADK_COST, label: string) {
  const w = walletOf(viewer());
  w.balance += ADK_COST[reason];
  w.history.unshift(entry('earn', ADK_COST[reason], `${label} 실패로 돌려받음`));
  return w.balance;
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

/** 모의투자 (1안 ADK 단일): 사면 빼고 팔면 더해요. 모자라면 400 */
export function settleMockInvest(type: 'earn' | 'spend', adk: number, label: string) {
  const w = walletOf(viewer());
  if (type === 'spend' && w.balance + 1e-9 < adk) {
    throw new ApiError('앰똥깡이 부족해요', 400, 'INSUFFICIENT_BALANCE');
  }
  w.balance = round4(type === 'spend' ? w.balance - adk : w.balance + adk);
  w.history.unshift(entry(type, adk, label));
  return w.balance;
}

/** 지금 사용자의 잔액 (모의투자 가상 현금) */
export function currentBalance() {
  return walletOf(viewer()).balance;
}

/** 테스트에서 잔액을 정하거나 확인할 때 */
export const serverWallet = {
  get: (userId: string) => wallets.get(userId),
  setBalance: (userId: string, balance: number) => {
    walletOf(userId).balance = balance;
  },
  setProgress: (userId: string, done: number, rewardCount = 0) => {
    Object.assign(walletOf(userId), { done, rewardCount, countedToday: [] });
  },
};

export function resetWalletStore() {
  wallets = new Map();
  revealedCrosswords.clear();
  seq = 0;
}
