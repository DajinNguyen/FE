import { createContext } from 'react';

/** 로그인 후 받을 정보는 이메일과 이름뿐이에요. (전화번호 등 민감 정보는 받지 않아요) */
export interface AuthUser {
  email: string;
  name: string;
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
}

export const AuthContext = createContext<AuthContextValue | null>(null);
