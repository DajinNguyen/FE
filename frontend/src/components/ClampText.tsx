import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styles from './ClampText.module.css';

interface ClampTextProps {
  children: ReactNode;
  /** 접혀 있을 때 보여줄 줄 수 */
  lines?: number;
  className?: string;
}

/** 문단이 정해진 줄 수를 넘으면 잘라서 보여주고 "더 보기"로 펼쳐요. */
export function ClampText({ children, lines = 3, className }: ClampTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, expanded]);

  return (
    <div className={className}>
      <p
        ref={ref}
        className={expanded ? undefined : styles.clamped}
        style={expanded ? undefined : { WebkitLineClamp: lines }}
      >
        {children}
      </p>
      {(overflowing || expanded) && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '접기' : '더 보기'}
        </button>
      )}
    </div>
  );
}
