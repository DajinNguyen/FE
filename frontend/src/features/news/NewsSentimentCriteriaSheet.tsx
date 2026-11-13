import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import {
  NEWS_SENTIMENT_CRITERIA_TEXT,
  NEWS_SENTIMENT_DISCLAIMER,
  NEWS_SENTIMENT_LABELS,
  NEWS_SENTIMENT_ORDER,
} from '../../config/newsSentiment';
import styles from './News.module.css';

/** "기준 보기": 뉴스 호재·악재(아주 좋음~아주 나쁨) 판단 기준 설명 */
export function NewsSentimentCriteriaSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="기준 보기"
      title="뉴스는 이런 기준으로 좋음/나쁨을 가려요"
    >
      <ul className={styles.criteria}>
        {NEWS_SENTIMENT_ORDER.map((level) => (
          <li key={level}>
            <strong>{NEWS_SENTIMENT_LABELS[level]}</strong> {NEWS_SENTIMENT_CRITERIA_TEXT[level]}
          </li>
        ))}
        <li>{NEWS_SENTIMENT_DISCLAIMER}</li>
      </ul>
      <Button block variant="secondary" onClick={onClose}>
        닫기
      </Button>
    </Sheet>
  );
}
