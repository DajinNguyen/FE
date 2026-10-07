import { Link } from 'react-router';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { useTerms } from '../../hooks/useTerms';
import { useTermSheet } from '../../hooks/useTermSheet';
import styles from './TodayTermCard.module.css';

const dayIndex = () => Math.floor(Date.now() / 86_400_000);

export function TodayTermCard() {
  const { data: terms } = useTerms();
  const { openTerm } = useTermSheet();
  if (!terms || terms.length === 0) return null;
  const term = terms[dayIndex() % terms.length];

  return (
    <Card tone="brandWeak" className={styles.card}>
      <p className={styles.eyebrow}>오늘의 용어</p>
      <button type="button" className={styles.term} onClick={() => openTerm(term.id)}>
        <span className={styles.name}>{term.term}</span>
        <span className={styles.meaning}>{term.easy}</span>
      </button>
      <div className={styles.links}>
        <Link to="/terms?mode=game" className={styles.game}>
          오늘의 용어 게임 하러 가기 <Icon name="chevronRight" size={16} />
        </Link>
        <Link to="/terms" className={styles.more}>
          용어 카드로 더 알아보기 <Icon name="chevronRight" size={16} />
        </Link>
      </div>
    </Card>
  );
}
