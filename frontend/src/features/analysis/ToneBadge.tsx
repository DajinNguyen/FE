import { CircleCheck, TriangleAlert } from 'lucide-react';
import { toneLabel, type KeyPointTone } from './reportMeta';
import styles from './ToneBadge.module.css';

const toneIcon = { positive: CircleCheck, caution: TriangleAlert } as const;

/** "좋은 점"(초록·체크) / "지켜볼 점"(주황·주의) 라벨. 색만으로 구분하지 않게 아이콘과 글자를 같이 보여줘요. */
export function ToneBadge({ tone }: { tone: KeyPointTone }) {
  const Icon = toneIcon[tone];
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
      {toneLabel[tone]}
    </span>
  );
}
