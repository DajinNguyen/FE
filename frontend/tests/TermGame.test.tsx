import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildQuestions, pickDistractors } from '../src/features/term-game/buildQuestions';
import termsJson from '../src/mocks/terms.json';
import { TermCardsPage } from '../src/pages/TermCardsPage';
import type { Term } from '../src/types';
import { renderWithProviders } from './testUtils';

const terms = termsJson as Term[];

/** 테스트용으로 항상 같은 순서를 내는 난수 */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('용어 데이터', () => {
  it('용어가 50개 이상이고, 5개 분류와 난이도가 모두 있어요', () => {
    expect(terms.length).toBeGreaterThanOrEqual(50);
    const categories = new Set(terms.map((t) => t.category));
    expect([...categories].sort()).toEqual(
      ['basic', 'financial_statement', 'indicator', 'industry', 'market'].sort(),
    );
    terms.forEach((t) => {
      expect(['beginner', 'intermediate']).toContain(t.level);
      expect(t.term && t.easy && t.example).toBeTruthy();
      expect(t.aliases.length).toBeGreaterThan(0);
    });
    expect(new Set(terms.map((t) => t.id)).size).toBe(terms.length);
  });
});

describe('buildQuestions', () => {
  it('한 판은 10문제이고, 4지선다에는 정답이 꼭 한 번 들어 있어요', () => {
    const questions = buildQuestions({
      targets: terms,
      allTerms: terms,
      mode: 'meaning',
      random: seeded(7),
    });
    expect(questions).toHaveLength(10);
    questions.forEach((q) => {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options[q.answerIndex]).toBe(q.term.easy);
    });
  });

  it('용어 맞히기는 보기가 용어 이름이에요', () => {
    const [q] = buildQuestions({
      targets: terms,
      allTerms: terms,
      mode: 'term',
      random: seeded(3),
    });
    expect(q.options[q.answerIndex]).toBe(q.term.term);
  });

  it('OX 문제는 보여주는 뜻이 정답 용어의 뜻일 때만 O가 정답이에요', () => {
    const questions = buildQuestions({
      targets: terms,
      allTerms: terms,
      mode: 'ox',
      random: seeded(11),
    });
    questions.forEach((q) => {
      expect(q.options).toEqual(['O', 'X']);
      expect(q.answerIndex).toBe(q.statement === q.term.easy ? 0 : 1);
    });
    expect(questions.some((q) => q.answerIndex === 0)).toBe(true);
    expect(questions.some((q) => q.answerIndex === 1)).toBe(true);
  });

  it('섞어서 모드는 세 종류가 모두 나와요', () => {
    const questions = buildQuestions({
      targets: terms,
      allTerms: terms,
      mode: 'mixed',
      random: seeded(5),
    });
    expect(new Set(questions.map((q) => q.type))).toEqual(new Set(['meaning', 'term', 'ox']));
  });

  it('오답 보기는 같은 분류에서 먼저 뽑아요', () => {
    const target = terms.find((t) => t.id === 'per')!;
    const distractors = pickDistractors(target, terms, 3, seeded(9));
    expect(distractors).toHaveLength(3);
    distractors.forEach((d) => {
      expect(d.id).not.toBe(target.id);
      expect(d.category).toBe(target.category);
    });
  });

  it('용어가 10개보다 적으면 그 개수만큼만 문제를 내요', () => {
    const targets = terms.slice(0, 3);
    const questions = buildQuestions({ targets, allTerms: terms, mode: 'meaning' });
    expect(questions).toHaveLength(3);
  });
});

describe('용어 게임 화면', () => {
  beforeEach(() => window.localStorage.clear());

  it('?mode=game 으로 들어오면 게임을 풀고 결과를 볼 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TermCardsPage />, { route: '/terms?mode=game' });

    await user.click(await screen.findByRole('radio', { name: 'OX' }));
    await user.click(screen.getByRole('button', { name: '게임 시작' }));

    for (let i = 0; i < 10; i += 1) {
      expect(screen.getByText(`문제 ${i + 1} / 10`)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'O' }));
      expect(screen.getByText(/^(정답이에요!|아쉬워요, 틀렸어요.)$/)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: i === 9 ? '결과 보기' : '다음 문제' }));
    }

    expect(screen.getByText(/10문제 중/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 하기' })).toBeInTheDocument();

    const saved = JSON.parse(window.localStorage.getItem('dajin:term-game') ?? '{}');
    expect(saved.plays).toBe(1);
  });

  it('분류를 고르면 카드 목록과 진행 개수가 그 분류만 보여요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TermCardsPage />, { route: '/terms' });

    const filters = await screen.findByRole('group', { name: '용어 분류' });
    await user.click(within(filters).getByRole('button', { name: /^산업/ }));

    const industryCount = terms.filter((t) => t.category === 'industry').length;
    expect(screen.getByText(`1 / ${industryCount}`)).toBeInTheDocument();
    const list = screen.getByRole('complementary', { name: '용어 목록' });
    expect(within(list).getByRole('button', { name: 'HBM' })).toBeInTheDocument();
    expect(within(list).queryByRole('button', { name: 'PER' })).not.toBeInTheDocument();
  });
});
