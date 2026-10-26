import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import styles from './TermLearningBanner.module.css';

/** 용어 학습으로 가는 한 줄. 크게 꾸미지 않아요. */
export function TermLearningBanner() {
  return (
    <Link to="/terms" className={styles.banner}>
      <span>
        <strong className={styles.title}>용어 학습</strong>
        <span className={styles.text}>카드·게임·가로세로 낱말퀴즈로 주식 용어를 익혀요</span>
      </span>
      <span className={styles.go}>
        시작하기 <Icon name="chevronRight" size={16} />
      </span>
    </Link>
  );
}
