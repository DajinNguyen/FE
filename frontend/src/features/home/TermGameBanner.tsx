import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { GAME_ROUND_SIZE } from '../term-game/buildQuestions';
import styles from './TermGameBanner.module.css';

/** 용어 게임·낱말퀴즈로 가는 한 줄 배너. 크게 꾸미지 않아요. */
export function TermGameBanner() {
  return (
    <div className={styles.banner}>
      <span>
        <strong className={styles.title}>용어 익히기</strong>
        <span className={styles.text}>PER, 영업이익 같은 주식 용어를 게임과 낱말퀴즈로 익혀요</span>
      </span>
      <span className={styles.links}>
        <Link to="/terms?mode=game" className={styles.go}>
          용어 게임 {GAME_ROUND_SIZE}문제 <Icon name="chevronRight" size={16} />
        </Link>
        <Link to="/terms?mode=crossword" className={styles.go}>
          가로세로 낱말퀴즈 <Icon name="chevronRight" size={16} />
        </Link>
      </span>
    </div>
  );
}
