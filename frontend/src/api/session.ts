/**
 * 지금 로그인한 사용자 id. 실제 서버는 로그인 쿠키로 알아내지만,
 * 목 서버는 쿠키가 없어서 AuthProvider 가 여기에 알려줘요. (목 데이터 모드 전용)
 */
let currentUser: { id: string; nickname: string } | null = null;

export const setSessionUser = (user: { id: string; nickname: string } | null) => {
  currentUser = user;
};

export const getSessionUser = () => currentUser;
