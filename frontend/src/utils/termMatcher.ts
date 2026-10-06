import type { Term } from '../types';

export interface TextPart {
  text: string;
  termId?: string;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 문장에서 용어 사전에 있는 단어를 찾아 나눠요.
 * 같은 용어는 한 문장 안에서 처음 나온 곳만 표시해요 (밑줄이 너무 많아지지 않게).
 */
export function splitByTerms(text: string, terms: Term[]): TextPart[] {
  const aliasToId = new Map<string, string>();
  terms.forEach((term) => term.aliases.forEach((alias) => aliasToId.set(alias, term.id)));
  if (aliasToId.size === 0) return [{ text }];

  const pattern = new RegExp(
    [...aliasToId.keys()]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join('|'),
    'g',
  );

  const parts: TextPart[] = [];
  const used = new Set<string>();
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const termId = aliasToId.get(match[0]);
    const index = match.index ?? 0;
    if (!termId || used.has(termId)) continue;
    used.add(termId);
    if (index > cursor) parts.push({ text: text.slice(cursor, index) });
    parts.push({ text: match[0], termId });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
