/**
 * 챗봇 목 서버. 실제 서버는 화면 데이터를 근거로 쉬운 말로 답하고, 투자 추천·예측은 하지 않아요.
 * 답변을 만든 뒤에만 5 ADK 를 빼요. (잔액이 부족하면 400)
 */
import { ApiError } from '../../src/api/errors';
import type { ChatRequest, ChatResponse } from '../../src/types';
import * as wallet from './wallet';

let conversations = 0;
/** 테스트에서 마지막으로 받은 요청을 확인할 때 */
export let lastChatRequest: ChatRequest | null = null;

export async function chat(body: ChatRequest): Promise<ChatResponse> {
  lastChatRequest = body;
  if (!body.message?.trim()) throw new ApiError('질문을 입력해 주세요', 400, 'EMPTY_MESSAGE');
  const where =
    body.context.page === 'company'
      ? `${body.context.company_name} 화면을 기준으로`
      : body.context.page === 'compare'
        ? '두 회사 비교 화면을 기준으로'
        : '지금 화면을 기준으로';
  const answer = `${where} 쉽게 설명할게요. 영업이익률은 100원어치를 팔아 남긴 돈의 비율이에요.`;
  const balance = wallet.spend('chat', '챗봇 질문');
  conversations += body.conversation_id ? 0 : 1;
  return { answer, conversation_id: body.conversation_id ?? `c${conversations}`, balance };
}

export function resetChatStore() {
  conversations = 0;
  lastChatRequest = null;
}
