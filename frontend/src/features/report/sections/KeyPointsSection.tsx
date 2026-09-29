import { Section } from '../../../components/Section';
import { StatusBadge } from '../../../components/StatusBadge';
import { TermText } from '../../../components/TermText';
import type { ReportSectionProps } from '../sectionTypes';
import styles from './ReportSections.module.css';

export function KeyPointsSection({ report }: ReportSectionProps) {
  return (
    <Section title={`핵심 포인트 ${report.key_points.length}가지`}>
      <ul className={styles.grid3}>
        {report.key_points.map((point) => (
          <li key={point.id} className={styles.pointCard}>
            <div className={styles.pointHead}>
              <h3 className={styles.pointTitle}>{point.title}</h3>
              <StatusBadge status={point.status} />
            </div>
            <p className={styles.pointBody}>
              <TermText text={point.body} />
            </p>
            <p className={styles.source}>
              {point.source} · {point.base_date}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
