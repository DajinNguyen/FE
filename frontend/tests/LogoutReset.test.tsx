import { act, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DEV_USER, type AuthUser } from '../src/features/auth/AuthContext';
import { SYNC_TIMING } from '../src/hooks/syncedRecord';
import { useAuth } from '../src/hooks/useAuth';
import { useWallet } from '../src/hooks/useWallet';
import { useWatchlist } from '../src/hooks/useWatchlist';
import { serverTermProgress } from './fixtures/me';
import { setSessionUser } from './fixtures/session';
import { providersWrapper, renderWithProviders } from './testUtils';

const OTHER: AuthUser = { id: 'other-user', email: 'other@dajin.local', name: '다른 사용자' };
const original = { ...SYNC_TIMING };
beforeEach(() => Object.assign(SYNC_TIMING, { debounce: 0, retryDelays: [30] }));
afterEach(() => Object.assign(SYNC_TIMING, original));

const record = () => screen.getByRole('region', { name: '내 학습 기록' });

describe('로그아웃 시 계정 데이터 초기화', () => {
  it('로그아웃하면 학습 기록·정답 표시가 처음 상태로, 다시 로그인하면 서버 기록을 새로 불러와요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/terms?mode=cards', user: DEV_USER });

    await user.click(await screen.findByRole('button', { name: '알았어요' }));
    await waitFor(() =>
      expect(serverTermProgress.get(DEV_USER.id!)?.terms.stock.status).toBe('mastered'),
    );
    expect(record()).toHaveTextContent('외운 용어1개');

    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(record()).toHaveTextContent('외운 용어0개'));
    expect(screen.getByText(/로그인하면 기록이 저장돼요/)).toBeInTheDocument();
    // 이 계정의 기기 키는 지우고, 비로그인 기록에도 섞이지 않아요.
    const keys = Object.keys(window.localStorage);
    expect(keys.filter((k) => k.startsWith('dajin:dev-user:term-progress'))).toEqual([]);
    expect(window.localStorage.getItem('dajin:guest:term-progress')).toBeNull();

    await user.click(screen.getByRole('button', { name: '개발용 로그인' }));
    await waitFor(() => expect(record()).toHaveTextContent('외운 용어1개'));
  });

  it('낱말퀴즈에 채운 정답이 로그아웃 후 화면에 남지 않고, 다시 로그인하면 이어서 풀 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, {
      route: '/terms?mode=crossword&puzzle=basics-easy',
      user: DEV_USER,
    });
    await screen.findByRole('textbox', { name: /가로 3번/ });
    await user.click(screen.getByRole('button', { name: '정답 보기' }));
    expect(
      screen.getByRole('button', { name: /^가로 3번, 1번째 칸.*입력: 주/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(
      await screen.findByRole('button', { name: /^가로 3번, 1번째 칸.*비어 있음$/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText('정답을 채웠어요')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '개발용 로그인' }));
    expect(
      await screen.findByRole('button', { name: /^가로 3번, 1번째 칸.*입력: 주/ }),
    ).toBeInTheDocument();
  });

  it('관심 기업: 로그아웃하면 화면에서 비우고, 같은 계정으로 다시 로그인하면 돌아와요', async () => {
    const { result } = renderHook(() => ({ auth: useAuth(), watchlist: useWatchlist() }), {
      wrapper: providersWrapper(DEV_USER),
    });
    act(() => {
      result.current.watchlist.toggle('005930');
    });
    expect(result.current.watchlist.stockCodes).toEqual(['005930']);

    await act(() => result.current.auth.logout());
    expect(result.current.watchlist.stockCodes).toEqual([]);

    act(() => result.current.auth.devLogin!());
    expect(result.current.watchlist.stockCodes).toEqual(['005930']);
  });

  it('ADK 잔액·내역도 로그아웃하면 비우고, 다시 로그인하면 서버에서 새로 불러와요', async () => {
    const { result } = renderHook(() => ({ auth: useAuth(), wallet: useWallet() }), {
      wrapper: providersWrapper(DEV_USER),
    });
    await waitFor(() => expect(result.current.wallet.balance).toBe(50));

    await act(() => result.current.auth.logout());
    expect(result.current.wallet.wallet).toBeUndefined();
    expect(result.current.wallet.balance).toBeNull();

    act(() => result.current.auth.devLogin!());
    await waitFor(() => expect(result.current.wallet.balance).toBe(50));
  });

  it('챗봇 대화 기록도 로그아웃하면 비워요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/', user: DEV_USER });
    await screen.findByRole('button', { name: '내 앰똥깡 50 ADK' });
    await user.click(screen.getByRole('button', { name: 'AI에게 물어보기' }));
    const dialog = screen.getByRole('dialog', { name: 'AI에게 물어보기' });
    await user.type(within(dialog).getByLabelText('질문 입력'), '로그아웃 전 질문');
    await user.click(within(dialog).getByRole('button', { name: '보내기 · 5 ADK' }));
    await within(dialog).findByText(/지금 화면을 기준으로/);
    await user.click(within(dialog).getByRole('button', { name: '시트 닫기' }));

    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await user.click(await screen.findByRole('button', { name: '개발용 로그인' }));
    await user.click(await screen.findByRole('button', { name: 'AI에게 물어보기' }));
    const again = screen.getByRole('dialog', { name: 'AI에게 물어보기' });
    expect(within(again).queryByText('로그아웃 전 질문')).not.toBeInTheDocument();
  });

  it('다른 계정으로 로그인하면 이전 계정의 학습 기록·관심 기업이 보이지 않아요', async () => {
    const first = renderHook(() => useWatchlist(), { wrapper: providersWrapper(DEV_USER) });
    act(() => {
      first.result.current.toggle('000660');
    });
    first.unmount();

    setSessionUser({ id: OTHER.id!, nickname: '다른 사용자' });
    const second = renderHook(() => useWatchlist(), { wrapper: providersWrapper(OTHER) });
    expect(second.result.current.stockCodes).toEqual([]);
    second.unmount();

    serverTermProgress.set(DEV_USER.id!, {
      terms: {
        stock: {
          status: 'mastered',
          correct_count: 0,
          wrong_count: 0,
          last_studied_at: '2026-11-16T01:00:00Z',
          set_id: 'basic',
        },
      },
      set_progress: [],
      study_dates: [],
    });
    renderWithProviders(<App />, { route: '/terms?mode=cards', user: OTHER });
    await screen.findByRole('button', { name: '알았어요' });
    await waitFor(() => expect(record()).toHaveTextContent('외운 용어0개'));
  });

  it('비로그인 기록은 guest 키에만 두고, 로그인하면 계정으로 합친 뒤 guest 키를 지워요', () => {
    const guest = renderHook(() => useWatchlist(), { wrapper: providersWrapper(null) });
    act(() => {
      guest.result.current.toggle('035420');
    });
    expect(JSON.parse(window.localStorage.getItem('dajin:guest:watchlist')!)).toEqual(['035420']);
    guest.unmount();

    const member = renderHook(() => useWatchlist(), { wrapper: providersWrapper(DEV_USER) });
    expect(member.result.current.stockCodes).toEqual(['035420']);
    expect(window.localStorage.getItem('dajin:guest:watchlist')).toBeNull();
    expect(JSON.parse(window.localStorage.getItem('dajin:dev-user:watchlist')!)).toEqual([
      '035420',
    ]);
  });

  it('예전 키(계정 구분 없음)는 비로그인 기록으로 옮겨요', () => {
    window.localStorage.setItem('dajin:watchlist', JSON.stringify(['005930']));
    const { result } = renderHook(() => useWatchlist(), { wrapper: providersWrapper(null) });
    expect(result.current.stockCodes).toEqual(['005930']);
    expect(window.localStorage.getItem('dajin:watchlist')).toBeNull();
  });
});
