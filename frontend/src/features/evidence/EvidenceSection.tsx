import type { ReactNode } from 'react';
import { HorizontalBars } from '../../components/HorizontalBars';
import { Icon } from '../../components/Icon';
import { SampleBadge } from '../../components/SampleBadge';
import { Section } from '../../components/Section';
import { TermText } from '../../components/TermText';
import type { CompanyReport, EvidenceKind } from '../../types';
import { evidenceAnchorId } from '../analysis/reportMeta';
import type { CompanyTabId, GoToTab } from '../companyTabs';
import styles from './EvidenceSection.module.css';

interface EvidenceSectionProps {
  evidence: CompanyReport['evidence'];
  onGoToTab: GoToTab;
}

/** "이 분석의 근거": 재무 / 뉴스 / 기업 비전. 하나가 비어도 나머지는 그대로 보여줘요. */
export function EvidenceSection({ evidence, onGoToTab }: EvidenceSectionProps) {
  const { financials, news, vision } = evidence;

  return (
    <Section title="이 분석의 근거" description="AI 핵심 분석은 아래 자료를 바탕으로 썼어요">
      <div className={styles.grid}>
        <EvidenceBlock
          kind="financials"
          title="재무"
          detail={{ tab: 'financials', label: '재무 상세 보기' }}
          onGoToTab={onGoToTab}
          meta={
            financials ? sourceLine(financials.highlights[0]?.source, financials.base_date) : ''
          }
        >
          {financials && financials.highlights.length > 0 ? (
            <ul className={styles.highlights}>
              {financials.highlights.slice(0, 4).map((h) => (
                <li key={h.label} className={styles.highlight}>
                  <span className={styles.highlightLabel}>
                    <TermText text={h.label} />
                  </span>
                  <span className={styles.highlightValue}>
                    {h.value} <SampleBadge isSample={Boolean(h.is_sample)} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <NotFound />
          )}
        </EvidenceBlock>

        <EvidenceBlock
          kind="news"
          title="뉴스"
          detail={{ tab: 'news', label: '뉴스 상세 보기' }}
          onGoToTab={onGoToTab}
        >
          {news.length > 0 ? (
            <ul className={styles.news}>
              {news.slice(0, 3).map((item) => (
                <li key={item.title}>
                  <button
                    type="button"
                    className={styles.newsItem}
                    onClick={() => onGoToTab('news')}
                  >
                    <span className={styles.newsTitle}>{item.title}</span>
                    <span className={styles.meta}>
                      {item.press} · {item.published_at}
                    </span>
                    <span className={styles.newsSummary}>{item.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <NotFound />
          )}
        </EvidenceBlock>

        <EvidenceBlock
          kind="vision"
          title="기업 비전"
          detail={{ tab: 'info', label: '기업 정보 보기' }}
          onGoToTab={onGoToTab}
          meta={vision ? sourceLine(vision.source, vision.base_date) : ''}
        >
          {vision ? (
            <>
              <p className={styles.visionText}>
                <TermText text={vision.summary} />
              </p>
              {vision.revenue_mix.length > 0 && (
                <div className={styles.mix}>
                  <p className={styles.mixTitle}>
                    사업별 매출 · {vision.revenue_mix[0].period} · 단위:{' '}
                    {vision.revenue_mix[0].unit}
                  </p>
                  <HorizontalBars
                    data={vision.revenue_mix.map((m) => ({
                      id: m.name,
                      label: m.name,
                      value: m.amount,
                    }))}
                    formatValue={(v) =>
                      `${v.toLocaleString('ko-KR', { minimumFractionDigits: 1 })}`
                    }
                  />
                </div>
              )}
            </>
          ) : (
            <NotFound />
          )}
        </EvidenceBlock>
      </div>
    </Section>
  );
}

const sourceLine = (source?: string, baseDate?: string) =>
  [source && `출처: ${source}`, baseDate && `기준: ${baseDate}`].filter(Boolean).join(' · ');

function EvidenceBlock({
  kind,
  title,
  meta,
  detail,
  onGoToTab,
  children,
}: {
  kind: EvidenceKind;
  title: string;
  meta?: string;
  detail: { tab: CompanyTabId; label: string };
  onGoToTab: GoToTab;
  children: ReactNode;
}) {
  return (
    <article id={evidenceAnchorId(kind)} className={styles.block} tabIndex={-1}>
      <h3 className={styles.blockTitle}>{title}</h3>
      <div className={styles.blockBody}>{children}</div>
      {meta && <p className={styles.meta}>{meta}</p>}
      <button type="button" className={styles.detail} onClick={() => onGoToTab(detail.tab)}>
        {detail.label} <Icon name="chevronRight" size={16} />
      </button>
    </article>
  );
}

function NotFound() {
  return <p className={styles.notFound}>자료를 찾지 못했어요</p>;
}
