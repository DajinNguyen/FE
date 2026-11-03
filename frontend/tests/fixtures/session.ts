/**
 * 테스트용 서버가 "지금 요청한 사람"으로 보는 사용자.
 * 실제 서버는 로그인 쿠키로 알아내요. 테스트에서는 앱의 [개발용 로그인]과 같은 사용자로 둬요.
 * (앱 화면의 로그인 여부는 AuthProvider 가 따로 관리해요)
 */
const DEV_VIEWER = { id: 'dev-user', nickname: '개발용 사용자' };

let currentUser: { id: string; nickname: string } | null = DEV_VIEWER;

export const setSessionUser = (user: { id: string; nickname: string } | null) => {
  currentUser = user;
};

export const getSessionUser = () => currentUser;

export const resetSessionUser = () => {
  currentUser = DEV_VIEWER;
};
