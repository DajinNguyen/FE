import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ADK_COST,
  ADK_NOTICE,
  ADK_SHORTAGE_TEXT,
  CURRENCY_LABEL,
  formatAdk,
  PUZZLE_REWARD,
  PUZZLE_REWARD_TEXT,
  SIGNUP_GIFT_TEXT,
} from '../src/config/currency';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { useWallet } from '../src/hooks/useWallet';
import { serverWallet } from './fixtures/wallet';
import { providersWrapper } from './testUtils';

const walletCalls = () =>
  vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/api/me/wallet'));

describe('앰똥깡(ADK) 설정', () => {
  it('화면 문구는 config 의 이름·단위로 만들고, 숫자는 정수·천 단위 쉼표예요', () => {
    expect(CURRENCY_LABEL).toBe('앰똥깡(ADK)');
    expect(formatAdk(1240)).toBe('1,240 ADK');
    expect(formatAdk(7.9)).toBe('7 ADK');
    expect(ADK_COST).toEqual({ report: 7, chat: 5 });
    expect(PUZZLE_REWARD).toMatchObject({ puzzlesPerReward: 3, amount: 20 });
    expect(PUZZLE_REWARD_TEXT).toBe('낱말퀴즈 3개를 풀면 20 ADK');
    expect(ADK_SHORTAGE_TEXT).toBe(
      '앰똥깡이 부족해요. 낱말퀴즈 3개를 풀면 20 ADK를 받을 수 있어요',
    );
    expect(SIGNUP_GIFT_TEXT).toBe('Google로 로그인하면 가입 선물로 50 ADK를 드려요');
    expect(ADK_NOTICE).toContain('실제 돈이 아니며 실제 돈으로 사거나 바꿀 수 없어요');
  });
});

describe('useWallet', () => {
  it('비로그인은 지갑을 불러오지 않아요', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: providersWrapper(null) });
    expect(result.current.wallet).toBeUndefined();
    expect(result.current.canAfford(0)).toBe(false);
    expect(walletCalls()).toHaveLength(0);
  });

  it('로그인하면 서버의 잔액·진행·내역을 불러와요 (가입 선물 50 ADK)', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper: providersWrapper(DEV_USER) });
    await waitFor(() => expect(result.current.balance).toBe(50));
    expect(result.current.wallet?.puzzle_progress).toEqual({ done: 0, required: 3 });
    expect(result.current.wallet?.history[0]).toMatchObject({
      type: 'earn',
      amount: 50,
      reason: '가입 선물',
    });
    expect(result.current.canAfford(ADK_COST.report)).toBe(true);
  });

  it('잔액이 비용보다 적으면 canAfford 가 false 예요', async () => {
    serverWallet.setBalance(DEV_USER.id!, 6);
    const { result } = renderHook(() => useWallet(), { wrapper: providersWrapper(DEV_USER) });
    await waitFor(() => expect(result.current.balance).toBe(6));
    expect(result.current.canAfford(ADK_COST.report)).toBe(false);
    expect(result.current.canAfford(ADK_COST.chat)).toBe(true);
  });
});
