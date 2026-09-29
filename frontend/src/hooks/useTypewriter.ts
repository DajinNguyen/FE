import { useEffect, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** enabled 가 true 가 되면 text 를 한 글자씩 보여줘요. */
export function useTypewriter(text: string, enabled: boolean, msPerChar = 38) {
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (prefersReducedMotion()) {
      setLength(text.length);
      return;
    }
    setLength(0);
    const timer = setInterval(() => {
      setLength((prev) => {
        if (prev >= text.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, msPerChar);
    return () => clearInterval(timer);
  }, [text, enabled, msPerChar]);

  return { typed: text.slice(0, length), done: enabled && length >= text.length };
}
