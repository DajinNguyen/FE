import styles from './SampleBadge.module.css';

/** 아직 공식 자료로 확인하지 않은 값 옆에 붙이는 배지 */
export function SampleBadge({ isSample = true }: { isSample?: boolean }) {
  if (!isSample) return null;
  return (
    <span
      className={styles.badge}
      title="아직 확인하지 않은 예시 값이에요. 실제 자료로 바꿀 예정이에요."
    >
      예시 값
    </span>
  );
}
