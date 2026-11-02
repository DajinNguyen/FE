/**
 * 테스트에서 fetch 를 가로채 fixtures 의 가짜 서버로 보내요.
 * 앱 코드는 실제 API 를 부르는 그대로 두고, 응답만 테스트 데이터로 바꿔요.
 */
import { vi } from 'vitest';
import { handle } from './routes';

export { failRequests } from './routes';

export function installFetchStub() {
  vi.stubGlobal('fetch', vi.fn(handle));
}
