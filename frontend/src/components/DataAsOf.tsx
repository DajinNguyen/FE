import { formatMarketDate } from '../utils/format';
import styles from './DataAsOf.module.css';

export interface AsOfItem {
  /** 무엇의 기준인지 (예: "주가"). 하나뿐이면 비워도 돼요. */
  label?: string;
  /** "2026-10-16 15:30", "2026-10-16", "2025년 사업보고서" 같은 값. 비어 있으면 빼요. */
  value: string | null | undefined;
}

interface DataAsOfProps {
  /** 기준값 하나 또는 여러 개 ("재무 2025년 사업보고서 · 주가 10월 16일") */
  value?: string | null;
  items?: AsOfItem[];
  /** 앞에 붙일 말 (예: "이 리포트는") */
  prefix?: string;
  /** 뒤에 붙일 말 */
  suffix?: string;
  className?: string;
}

/**
 * 데이터 기준일. "10월 16일 장 마감 기준", "2025년 사업보고서 기준" 처럼 보여줘요.
 * 실시간이 아니라 전날 자료일 수 있다는 걸 날짜로 자연스럽게 알려줘요. 값이 없으면 아무것도 그리지 않아요.
 */
export function DataAsOf({ value, items, prefix, suffix = '기준', className }: DataAsOfProps) {
  const list = items ?? [{ value }];
  const text = list
    .filter((item) => item.value)
    .map((item) => [item.label, formatMarketDate(item.value as string)].filter(Boolean).join(' '))
    .join(' · ');
  if (!text) return null;

  return (
    <span
      className={[styles.asOf, className].filter(Boolean).join(' ')}
      title="실시간 정보가 아니라 이 날짜 기준 자료예요"
    >
      {[prefix, text, suffix].filter(Boolean).join(' ')}
    </span>
  );
}
