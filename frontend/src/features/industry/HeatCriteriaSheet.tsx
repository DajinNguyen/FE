import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { HEAT_CRITERIA_TEXT } from '../../config/industryHeat';
import styles from './Industry.module.css';

/** "기준 보기": 뜨는 산업을 고르는 임시 기준 설명 */
export function HeatCriteriaSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="기준 보기"
      title="관심이 몰리는 산업은 이렇게 골라요"
    >
      <ul className={styles.criteria}>
        {HEAT_CRITERIA_TEXT.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className={styles.criteriaNote}>
        지금은 임시 기준이에요. 기준이 바뀌면 이 설명도 바뀌어요.
      </p>
      <Button block variant="secondary" onClick={onClose}>
        닫기
      </Button>
    </Sheet>
  );
}
