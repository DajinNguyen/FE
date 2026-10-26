import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { browser } from '../src/api/auth';
import { apiConfig } from '../src/api/client';
import { LoginButton } from '../src/features/auth/LoginButton';
import { renderWithProviders } from './testUtils';

const me = { id: 'u1', email: 'student@example.com', name: '김다진', nickname: '주린이' };

function mockFetch(meStatus: 200 | 401) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/auth/me')) {
      return meStatus === 200
        ? new Response(JSON.stringify(me), { status: 200 })
        : new Response(
            JSON.stringify({ error: { code: 'LOGIN_REQUIRED', message: '로그인이 필요해요' } }),
            { status: 401 },
          );
    }
    if (url.endsWith('/api/auth/logout') && init?.method === 'POST') {
      return new Response(null, { status: 204 });
    }
    return new Response('{}', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('로그인 연동 (실제 API 모드)', () => {
  beforeEach(() => {
    apiConfig.useMock = false;
    apiConfig.baseUrl = 'http://api.test';
  });
  afterEach(() => {
    apiConfig.useMock = true;
    apiConfig.baseUrl = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('처음 열 때 /api/auth/me 로 확인해서, 로그인돼 있으면 닉네임을 보여줘요', async () => {
    mockFetch(200);
    renderWithProviders(<LoginButton />);
    expect(await screen.findByText('주린이님')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '개발용 로그인' })).not.toBeInTheDocument();
  });

  it('로그인 안 돼 있으면 [Google로 로그인]이 지금 화면 주소를 담아 백엔드 로그인으로 보내요', async () => {
    mockFetch(401);
    const go = vi.spyOn(browser, 'go').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<LoginButton />, { route: '/companies/005930?tab=community' });

    await user.click(await screen.findByRole('button', { name: /Google로 로그인/ }));
    expect(go).toHaveBeenCalledWith(
      'http://api.test/api/auth/google/login?redirect=%2Fcompanies%2F005930%3Ftab%3Dcommunity',
    );
  });

  it('[로그아웃]을 누르면 서버에 알리고 로그아웃 상태가 돼요', async () => {
    const fetchMock = mockFetch(200);
    const user = userEvent.setup();
    renderWithProviders(<LoginButton />);

    await user.click(await screen.findByRole('button', { name: '로그아웃' }));
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/auth/logout',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(await screen.findByRole('button', { name: /Google로 로그인/ })).toBeInTheDocument();
  });

  it('로그인에 실패하고 돌아오면(?login_error=cancelled) 안내를 보여줘요', async () => {
    mockFetch(401);
    renderWithProviders(<LoginButton />, { route: '/?login_error=cancelled' });
    expect(await screen.findByText('로그인을 취소했어요.')).toBeInTheDocument();
  });
});

describe('로그인 (목 데이터 모드)', () => {
  it('[Google로 로그인]은 이동하지 않고 개발용 로그인을 안내해요', async () => {
    const go = vi.spyOn(browser, 'go').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<LoginButton />);

    await user.click(screen.getByRole('button', { name: /Google로 로그인/ }));
    expect(go).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.getByText(/목 데이터 모드에서는 Google 로그인이 동작하지 않아요/),
      ).toBeInTheDocument(),
    );
    go.mockRestore();
  });
});
