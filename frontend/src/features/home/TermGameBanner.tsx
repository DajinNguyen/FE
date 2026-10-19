import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { GAME_ROUND_SIZE } from '../term-game/buildQuestions';
import styles from './TermGameBanner.module.css';

/** 용어 게임으로 가는 한 줄 배너. 크게 꾸미지 않아요. */
export function TermGameBanner() {
  return (
    <Link to="/terms?mode=game" className={styles.banner}>
      <span>
        <strong className={styles.title}>용어 게임</strong>
        <span className={styles.text}>
          PER, 영업이익 같은 주식 용어를 {GAME_ROUND_SIZE}문제로 익혀요
        </span>
      </span>
      <span className={styles.go}>
        시작하기 <Icon name="chevronRight" size={16} />
      </span>
    </Link>
  );
}
