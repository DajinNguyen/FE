import { useEffect, useSyncExternalStore } from 'react';
import type { ChatContext } from '../../types';

/**
 * 지금 보고 있는 화면 정보 (페이지가 useChatContext 로 등록해요).
 * 화면을 떠나면 "other" 로 돌아가요.
 */
let current: ChatContext = { page: 'other' };
const listeners = new Set<() => void>();

function setChatContext(next: ChatContext) {
  current = next;
  listeners.forEach((listener) => listener());
}

export function useCurrentChatContext() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}

/** 페이지가 지금 보여주는 정보를 챗봇에 알려요. (값이 바뀌면 다시 등록) */
export function useChatContext(context: ChatContext) {
  const key = JSON.stringify(context);
  useEffect(() => {
    setChatContext(JSON.parse(key) as ChatContext);
    return () => {
      if (JSON.stringify(current) === key) setChatContext({ page: 'other' });
    };
  }, [key]);
}

/** 테스트에서 처음 상태로 */
export function resetChatContext() {
  current = { page: 'other' };
}
