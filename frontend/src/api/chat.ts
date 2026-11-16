import type { ChatRequest, ChatResponse } from '../types';
import { request } from './client';

/**
 * 챗봇 질문. 서버가 답변을 만든 뒤에만 5 ADK 를 빼고 남은 잔액을 돌려줘요.
 * 지금은 답변을 한 번에 받아요. 스트리밍(답변을 이어서 받기)을 붙일 때는 이 함수만
 * 바꿔서 onDelta 로 조각을 넘기면 돼요. (화면은 메시지 status 'streaming' 으로 이미 준비돼 있어요)
 */
export function sendChatMessage(body: ChatRequest) {
  return request<ChatResponse>({ path: '/api/chat', method: 'POST', body });
}
