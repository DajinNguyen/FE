import type { Term } from '../../types';

/** meaning: 용어 → 뜻 고르기 / term: 뜻 → 용어 고르기 / ox: 용어와 뜻이 맞는지 */
export type GameType = 'meaning' | 'term' | 'ox';
export type GameMode = GameType | 'mixed';

export const GAME_ROUND_SIZE = 10;
const CHOICE_COUNT = 4;

export interface GameQuestion {
  id: string;
  type: GameType;
  /** 문제의 정답 용어 */
  term: Term;
  /** OX 문제에서 보여주는 뜻 (정답 용어의 뜻이거나, 다른 용어의 뜻) */
  statement?: string;
  options: string[];
  answerIndex: number;
}

type Random = () => number;

const gameTypes: GameType[] = ['meaning', 'term', 'ox'];

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 오답 보기는 같은 분류의 다른 용어에서 먼저 뽑고, 모자라면 다른 분류에서 채워요. */
export function pickDistractors(target: Term, allTerms: Term[], count: number, random: Random) {
  const others = allTerms.filter((t) => t.id !== target.id);
  const sameCategory = shuffle(
    others.filter((t) => t.category === target.category),
    random,
  );
  const otherCategory = shuffle(
    others.filter((t) => t.category !== target.category),
    random,
  );
  return [...sameCategory, ...otherCategory].slice(0, count);
}

function buildQuestion(
  target: Term,
  type: GameType,
  allTerms: Term[],
  random: Random,
  index: number,
): GameQuestion {
  const id = `${index}-${type}-${target.id}`;

  if (type === 'ox') {
    const isTrue = random() < 0.5;
    const [other] = pickDistractors(target, allTerms, 1, random);
    const statement = isTrue || !other ? target.easy : other.easy;
    return {
      id,
      type,
      term: target,
      statement,
      options: ['O', 'X'],
      answerIndex: statement === target.easy ? 0 : 1,
    };
  }

  const distractors = pickDistractors(target, allTerms, CHOICE_COUNT - 1, random);
  const choices = shuffle([target, ...distractors], random);
  const label = (t: Term) => (type === 'meaning' ? t.easy : t.term);
  return {
    id,
    type,
    term: target,
    options: choices.map(label),
    answerIndex: choices.findIndex((t) => t.id === target.id),
  };
}

/**
 * 한 판의 문제를 만들어요. random 을 받아서 테스트에서는 결과를 고정할 수 있어요.
 * @param targets 문제로 낼 용어 (분류 필터나 "틀린 용어만"이 적용된 목록)
 * @param allTerms 오답 보기를 뽑을 전체 용어
 */
export function buildQuestions({
  targets,
  allTerms,
  mode,
  random = Math.random,
  count = GAME_ROUND_SIZE,
}: {
  targets: Term[];
  allTerms: Term[];
  mode: GameMode;
  random?: Random;
  count?: number;
}): GameQuestion[] {
  const picked = shuffle(targets, random).slice(0, count);
  return picked.map((target, index) => {
    const type = mode === 'mixed' ? gameTypes[index % gameTypes.length] : mode;
    return buildQuestion(target, type, allTerms, random, index);
  });
}
