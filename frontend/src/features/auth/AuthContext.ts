import { createContext } from 'react';

/** 로그인 후 받을 정보는 이메일과 이름뿐이에요. (전화번호 등 민감 정보는 받지 않아요) */
export interface AuthUser {
  /** (요청) 커뮤니티 "내 글" 판단에 쓰는 사용자 id */
  id?: string;
  email: string;
  name: string;
  /** (요청) 커뮤니티에 보이는 이름. 실명 대신 써요. 없으면 name 을 써요. */
  nickname?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /** 처음 열었을 때 로그인 여부를 서버에 물어보는 중이에요. */
  isLoading: boolean;
  /** Google 로그인 화면으로 이동해요 (페이지를 벗어나요, 값을 돌려주지 않아요). */
  loginWithGoogle: () => void;
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

/** 화면에 보여줄 이름: 닉네임 → 이름 */
export const displayName = (user: AuthUser) => user.nickname ?? user.name;
