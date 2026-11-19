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

describe('낱말퀴즈 요청', () => {
  it('목록을 받기 전에는 퍼즐 id 없이(/api/learn/crosswords/) 요청하지 않아요', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/terms" element={<TermCardsPage />} />
      </Routes>,
      { route: '/terms?mode=crossword' },
    );
    await screen.findByRole('group', { name: '퍼즐 고르기' });
    await screen.findByRole('textbox', { name: /답 입력/ });

    expect(crosswordCalls()).not.toContain('/api/learn/crosswords/');
    expect(crosswordCalls()).toContain('/api/learn/crosswords');
  });
});
