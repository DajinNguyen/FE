import { companyTabs } from '../companyTabs';
import type { ChatContext } from '../../types';

const tabLabel = (tab: string) =>
  companyTabs.find((t) => t.id === tab)?.label ?? (tab === 'compare' ? '비교하기' : tab);

/** 대화창 위 "지금 보고 있는 화면: 삼성전자 · 재무 상세" */
export function chatContextLabel(context: ChatContext): string {
  switch (context.page) {
    case 'main':
      return '메인';
    case 'company':
      return `${context.company_name} · ${tabLabel(context.tab)}`;
    case 'report':
      return `${context.company_name ?? context.stock_code} · AI 분석`;
    case 'compare':
      return `${context.left_name ?? context.left_code} vs ${context.right_name ?? context.right_code} · 비교하기`;
    case 'industry':
      return `${context.industry_name ?? context.industry_id} 산업`;
    case 'learn':
      return '용어 학습';
    case 'other':
      return '다진';
  }
}
