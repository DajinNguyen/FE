import { createContext } from 'react';
import type { AuthUser } from '../../types';

export type { AuthUser };

export interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /** 처음 열 때 로그인 쿠키로 사용자를 확인하는 중 (실제 API 모드에서만 잠깐 true) */
  isChecking: boolean;
  /**
   * Google 로그인 페이지로 이동해요. 로그인을 마치면 지금 화면으로 돌아와요.
   * 목 데이터 모드에서는 이동하지 않고 false 를 돌려줘요. (개발용 로그인을 써요)
   */
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  /**
   * 개발용 가짜 로그인 (목 데이터 모드에서만 있어요). 로그인 상태의 화면 흐름을 확인할 때 써요.
   * 실제 API 모드(VITE_USE_MOCK=false)에서는 undefined 예요.
   */
  devLogin?: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** 개발용 가짜 사용자 (목 데이터 모드에서만) */
export const DEV_USER: AuthUser = {
  id: 'dev-user',
  email: 'dev@dajin.local',
  name: '개발용 사용자',
  nickname: '개발용 사용자',
};

/** 목 데이터 모드에서 [Google로 로그인]을 눌렀을 때 안내 */
export const GOOGLE_LOGIN_UNAVAILABLE =
  '목 데이터 모드에서는 Google 로그인이 동작하지 않아요. [개발용 로그인]으로 확인해 주세요.';

/** 백엔드가 로그인 실패 후 ?login_error= 로 돌려보낼 때 안내 */
export const loginErrorMessages: Record<string, string> = {
  cancelled: '로그인을 취소했어요.',
  failed: 'Google 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
};
