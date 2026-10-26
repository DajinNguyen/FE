import { createContext } from 'react';

/** 로그인 후 받을 정보는 이메일과 이름뿐이에요. (전화번호 등 민감 정보는 받지 않아요) */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** 커뮤니티에 보이는 이름 (실명 대신) */
  nickname: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /**
   * Google OAuth 연결 예정. 지금은 아무것도 하지 않고 false 를 돌려줘요.
   * 연결 후에는 로그인 성공 시 true 를 돌려주도록 AuthProvider 에서 구현해요.
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
