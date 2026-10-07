import styles from './AdSlot.module.css';

/** VITE_SHOW_ADS=true 일 때만 보여요. (기본: 숨김) */
export const showAds = import.meta.env.VITE_SHOW_ADS === 'true';

interface AdSlotProps {
  /** banner: 가로 배너 / card: 카드형 */
  size?: 'banner' | 'card';
  /** 어느 자리인지 (광고 연동 시 지면 구분용) */
  placement: string;
}

/**
 * 광고 자리표시. 실제 광고 연동 전까지 "광고" 라벨이 붙은 빈 자리만 보여줘요.
 * AI 핵심 분석과 근거 자료 사이에는 넣지 않아요.
 */
export function AdSlot({ size = 'banner', placement }: AdSlotProps) {
  if (!showAds) return null;
  return (
    <aside
      className={`${styles.slot} ${styles[size]}`}
      aria-label="광고"
      data-ad-placement={placement}
    >
      <span className={styles.label}>광고</span>
      <span className={styles.placeholder}>광고가 들어갈 자리예요</span>
    </aside>
  );
}
