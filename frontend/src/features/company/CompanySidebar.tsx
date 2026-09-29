import { SampleBadge } from '../../components/SampleBadge';
import { TermText } from '../../components/TermText';
import { useCompany } from '../../hooks/useCompanies';
import { useFinancials } from '../../hooks/useFinancials';
import type { SampleNumber } from '../../types';
import { formatTrillion } from '../../utils/format';
import styles from './CompanySidebar.module.css';

interface CompanySidebarProps {
  stockCode: string;
}

/** 기업 화면 오른쪽에 따라다니는 영역: 주요 지표 */
export function CompanySidebar({ stockCode }: CompanySidebarProps) {
  const { data: company } = useCompany(stockCode);
  const { data: financials } = useFinancials(stockCode);

  const stats: { label: string; value: SampleNumber; format: (v: number) => string }[] = [];
  if (company) {
    stats.push({
      label: '시가총액',
      value: company.market_cap,
      format: (v) => formatTrillion(v, { min: 0, max: 0 }),
    });
  }
  if (financials) {
    const { per, pbr, roe, debt_ratio } = financials.indicators;
    stats.push(
      { label: 'PER', value: per, format: (v) => `${v}배` },
      { label: 'PBR', value: pbr, format: (v) => `${v}배` },
      { label: 'ROE', value: roe, format: (v) => `${v}%` },
      { label: '부채비율', value: debt_ratio, format: (v) => `${v}%` },
    );
  }

  return (
    <aside className={styles.sidebar} aria-label="주요 지표">
      {stats.length > 0 && (
        <section className={styles.statsCard}>
          <h2 className={styles.statsTitle}>주요 지표</h2>
          <dl className={styles.stats}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <dt>
                  <TermText text={stat.label} />
                </dt>
                <dd>
                  {stat.format(stat.value.value)} <SampleBadge isSample={stat.value.is_sample} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <p className={styles.note}>
        교육용 정보이며 투자 추천이 아니에요. 숫자는 공식 자료를 그대로 쓰고, AI는 설명만 써요.
      </p>
    </aside>
  );
}
