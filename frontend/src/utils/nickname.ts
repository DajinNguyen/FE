const NICKNAME_RE = /^[0-9A-Za-z가-힣_]+$/;

/** 닉네임 규칙 검사 (서버도 같은 규칙으로 다시 검사해요). 문제가 없으면 null */
export function nicknameProblem(value: string): string | null {
  const nickname = value.trim();
  if (nickname === '') return null; // 비우면 자동 닉네임으로 돌아가요
  if (nickname.length < 2 || nickname.length > 12) return '닉네임은 2~12자로 정해 주세요.';
  if (!NICKNAME_RE.test(nickname)) return '한글, 영문, 숫자, 밑줄(_)만 쓸 수 있어요.';
  return null;
}
