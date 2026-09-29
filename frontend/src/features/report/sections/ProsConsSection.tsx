import { Section } from '../../../components/Section';
import { TermText } from '../../../components/TermText';
import type { ReportSectionProps } from '../sectionTypes';
import styles from './ReportSections.module.css';

export function ProsConsSection({ report }: ReportSectionProps) {
  return (
    <Section title="좋은 점과 지켜볼 점">
      <div className={styles.grid2}>
        <div className={`${styles.prosCons} ${styles.pros}`}>
          <h3 className={styles.prosConsTitle}>좋은 점</h3>
          <ul className={styles.bullets}>
            {report.strengths.map((text) => (
              <li key={text}>
                <TermText text={text} />
              </li>
            ))}
          </ul>
        </div>
        <div className={`${styles.prosCons} ${styles.cons}`}>
          <h3 className={styles.prosConsTitle}>지켜볼 점</h3>
          <ul className={styles.bullets}>
            {report.watch_points.map((text) => (
              <li key={text}>
                <TermText text={text} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
