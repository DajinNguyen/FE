import { Icon } from '../../../components/Icon';
import { Section } from '../../../components/Section';
import type { CompanyTabId } from '../../companyTabs';
import type { ReportSectionProps } from '../sectionTypes';
import styles from './ReportSections.module.css';

const links: { tab: CompanyTabId; label: string; description: string }[] = [
  {
    tab: 'financials',
    label: '재무제표 자세히 보기',
    description: '3년 실적 그래프와 지표 신호등',
  },
  { tab: 'news', label: '뉴스 더 보기', description: '최근 소식과 연결된 숫자' },
  { tab: 'info', label: '사업 내용 보기', description: '무슨 사업을 하고 어디로 가는지' },
];

export function DetailLinksSection({ onGoToTab }: ReportSectionProps) {
  return (
    <Section title="자세히 보기">
      <ul className={styles.links}>
        {links.map((link) => (
          <li key={link.tab}>
            <button type="button" className={styles.linkRow} onClick={() => onGoToTab(link.tab)}>
              <span>
                <span className={styles.linkLabel}>{link.label}</span>
                <span className={styles.linkDescription}>{link.description}</span>
              </span>
              <Icon name="chevronRight" size={20} />
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
