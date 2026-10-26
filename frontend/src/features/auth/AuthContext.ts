import { createContext } from 'react';

/** 로그인 후 받을 정보는 이메일과 이름뿐이에요. (전화번호 등 민감 정보는 받지 않아요) */
export interface AuthUser {
  email: string;
  name: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /** 처음 열었을 때 로그인 여부를 서버에 물어보는 중이에요. */
  isLoading: boolean;
  /** Google 로그인 화면으로 이동해요 (페이지를 벗어나요, 값을 돌려주지 않아요). */
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
