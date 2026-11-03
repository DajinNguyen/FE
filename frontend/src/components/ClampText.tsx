import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styles from './ClampText.module.css';

/** 3줄이 넘는 문단은 접어 두고 [더 보기]로 펼쳐요. */
export function ClampText({ children, lines = 3 }: { children: ReactNode; lines?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !open) setOverflow(el.scrollHeight > el.clientHeight + 1);
  }, [children, open]);

  return (
    <>
      <div
        ref={ref}
        className={open ? undefined : styles.clamp}
        style={open ? undefined : { WebkitLineClamp: lines }}
      >
        {children}
      </div>
      {(overflow || open) && (
        <button type="button" className={styles.more} onClick={() => setOpen((v) => !v)}>
          {open ? '접기' : '더 보기'}
        </button>
      )}
    </>
  );
}
