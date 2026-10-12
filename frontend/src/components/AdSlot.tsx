import { MOCK_AD_TEXT } from '../mocks/ads';
import styles from './AdSlot.module.css';

/** VITE_SHOW_ADS=true 일 때만 보여요. (기본: 숨김) */
export const showAds = import.meta.env.VITE_SHOW_ADS === 'true';

interface AdSlotProps {
  /** banner: 가로 배너 / card: 카드형 / skyscraper: 화면 양옆 세로형 */
  size?: 'banner' | 'card' | 'skyscraper';
  /** size="skyscraper"일 때 어느 쪽에 붙일지 */
  side?: 'left' | 'right';
  /** 어느 자리인지 (광고 연동 시 지면 구분용) */
  placement: string;
}

/**
 * 광고 자리. 실제 광고 연동 전까지 큰 글씨 텍스트 목데이터를 보여줘요.
 * AI 핵심 분석과 근거 자료 사이에는 넣지 않아요.
 */
export function AdSlot({ size = 'banner', side, placement }: AdSlotProps) {
  if (!showAds) return null;
  const sideClass = size === 'skyscraper' && side === 'left' ? styles.skyscraperLeft
    : size === 'skyscraper' && side === 'right' ? styles.skyscraperRight
    : '';

  return (
    <aside
      className={`${styles.slot} ${styles[size]} ${sideClass}`}
      aria-label="광고"
      data-ad-placement={placement}
    >
      <span className={styles.label}>광고</span>
      <p className={styles.bigText}>{MOCK_AD_TEXT}</p>
    </aside>
  );
}
