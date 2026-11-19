import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { TermCardsPage } from '../src/pages/TermCardsPage';
import { renderWithProviders } from './testUtils';

const crosswordCalls = () =>
  vi
    .mocked(fetch)
    .mock.calls.map(([url]) => new URL(String(url), 'http://localhost').pathname)
    .filter((path) => path.startsWith('/api/learn/crosswords'));

const renderTerms = () =>
  renderWithProviders(
    <Routes>
      <Route path="/terms" element={<TermCardsPage />} />
    </Routes>,
    { route: '/terms?mode=crossword' },
  );

describe('낱말퀴즈 요청', () => {
  it('목록을 받기 전에는 퍼즐 id 없이(/api/learn/crosswords/) 요청하지 않아요', async () => {
    renderTerms();
    await screen.findByRole('group', { name: '퍼즐 고르기' });
    await screen.findByRole('textbox', { name: /답 입력/ });

    expect(crosswordCalls()).not.toContain('/api/learn/crosswords/');
    expect(crosswordCalls()).toContain('/api/learn/crosswords');
  });

  it('퍼즐 목록이 비어 있으면 퍼즐을 요청하지 않고 빈 상태를 보여줘요', async () => {
    const stub = vi.mocked(fetch);
    const original = stub.getMockImplementation()!;
    stub.mockImplementation((input, init) =>
      new URL(String(input), 'http://localhost').pathname === '/api/learn/crosswords'
        ? Promise.resolve(Response.json([]))
        : original(input, init),
    );
    renderTerms();

    expect(await screen.findByText('아직 풀 수 있는 낱말퀴즈가 없어요')).toBeInTheDocument();
    expect(crosswordCalls()).toEqual(['/api/learn/crosswords']);
  });
});
