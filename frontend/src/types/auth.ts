/**
 * GET /api/auth/me 응답.
 * 로그인 후 받을 정보는 이메일과 이름뿐이에요. (전화번호 등 민감 정보는 받지 않아요)
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** 커뮤니티에 보이는 이름 (실명 대신) */
  nickname: string;
}
