import { Icon } from './Icon';
import styles from './DetailNotice.module.css';

/** 상세 탭 맨 위 안내. 초보자는 개요로 돌아갈 수 있게 해요. */
export function DetailNotice({ onBack }: { onBack: () => void }) {
  return (
    <div className={styles.notice}>
      <p className={styles.text}>
        <strong>자세한 데이터를 보는 화면이에요.</strong> 처음이라면 개요와 AI 분석부터 보면
        이해하기 쉬워요.
      </p>
      <button type="button" className={styles.back} onClick={onBack}>
        <Icon name="back" size={16} /> 개요로 돌아가기
      </button>
    </div>
  );
}
