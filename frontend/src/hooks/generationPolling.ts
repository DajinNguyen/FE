import type { GenerationStatus } from '../types';

/** AI가 칸을 채우는 동안 다시 물어보는 간격 */
export const GENERATION_POLL_MS = 5_000;

/** 하나라도 만드는 중이면 GENERATION_POLL_MS 마다 다시 물어봐요 (다 되면 멈춰요). */
export function pollWhileGenerating(...statuses: (GenerationStatus | undefined)[]) {
  return statuses.includes('generating') ? GENERATION_POLL_MS : false;
}
