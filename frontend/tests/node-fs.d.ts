/**
 * 테스트에서 스타일 파일을 글자 그대로 읽을 때 쓰는 node:fs 의 타입 (프로젝트에 @types/node 가 없어요).
 * vitest 는 Node 에서 돌아서 실제로는 그대로 동작해요.
 */
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
}
