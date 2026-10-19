import type { SectorGroup } from '../types';

/** 메인 화면 업종 탭. 탭 이름과 순서는 여기서만 정해요. */
export const SECTOR_GROUPS = [
  { id: 'semiconductor', label: '반도체' },
  { id: 'auto', label: '자동차' },
  { id: 'internet', label: '인터넷' },
  { id: 'finance', label: '금융' },
  { id: 'food', label: '식품' },
  { id: 'etc', label: '기타' },
] as const satisfies readonly { id: SectorGroup; label: string }[];
