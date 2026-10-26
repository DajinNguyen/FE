import { useAuth } from './useAuth';

/** 커뮤니티 쿼리 키에 쓰는 "보는 사람" (비로그인은 guest) */
export function useViewerId() {
  return useAuth().user?.id ?? 'guest';
}
