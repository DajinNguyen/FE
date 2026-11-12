/**
 * 테스트 데이터로 API 요청에 답하는 가짜 서버의 길 안내(라우팅).
 * 테스트(fetchStub.ts)와 스크린샷용 가짜 API 서버가 같이 써요. 앱 코드에서는 쓰지 않아요.
 */
import { ApiError } from '../../src/api/errors';
import * as server from './mockServer';
import type { HeatPeriod, PostCategory, PostSort, PricePeriod } from '../../src/types';

type Handler = (match: RegExpMatchArray, query: URLSearchParams, body: any) => Promise<unknown>; // eslint-disable-line @typescript-eslint/no-explicit-any

const routes: [method: string, pattern: RegExp, handler: Handler][] = [
  [
    'GET',
    /^\/api\/companies$/,
    async (_, q) => {
      const codes = q.get('stock_codes');
      if (codes !== null) return server.getCompaniesByCodes(codes ? codes.split(',') : []);
      return server.searchCompanies(q.get('query') ?? '', Number(q.get('limit') ?? 20));
    },
  ],
  ['GET', /^\/api\/companies\/(\w+)$/, async ([, code]) => server.getCompany(code)],
  ['GET', /^\/api\/companies\/(\w+)\/financials$/, async ([, code]) => server.getFinancials(code)],
  [
    'GET',
    /^\/api\/companies\/(\w+)\/performance$/,
    async ([, code]) => server.getPerformanceDetail(code),
  ],
  [
    'GET',
    /^\/api\/companies\/(\w+)\/prices$/,
    async ([, code], q) => server.getPriceHistory(code, (q.get('period') ?? '3m') as PricePeriod),
  ],
  ['GET', /^\/api\/companies\/(\w+)\/report$/, async ([, code]) => server.getCompanyReport(code)],
  ['POST', /^\/api\/companies\/(\w+)\/report$/, async ([, code]) => server.generateReport(code)],
  [
    'GET',
    /^\/api\/companies\/(\w+)\/news$/,
    async ([, code], q) =>
      server.getCompanyNews(code, Number(q.get('page') ?? 1), Number(q.get('size') ?? 10)),
  ],
  [
    'GET',
    /^\/api\/companies\/(\w+)\/posts$/,
    async ([, code], q) =>
      server.getPosts(
        code,
        {
          sort: (q.get('sort') ?? 'latest') as PostSort,
          category: (q.get('category') ?? undefined) as PostCategory | undefined,
          page: Number(q.get('page') ?? 1),
        },
        Number(q.get('size') ?? 10),
      ),
  ],
  [
    'POST',
    /^\/api\/companies\/(\w+)\/posts$/,
    async ([, code], _, body) => server.createPost(code, body),
  ],
  ['GET', /^\/api\/posts\/([\w-]+)$/, async ([, id]) => server.getPost(id)],
  ['PUT', /^\/api\/posts\/([\w-]+)$/, async ([, id], _, body) => server.updatePost(id, body)],
  ['DELETE', /^\/api\/posts\/([\w-]+)$/, async ([, id]) => server.deletePost(id)],
  ['GET', /^\/api\/posts\/([\w-]+)\/comments$/, async ([, id]) => server.getComments(id)],
  [
    'POST',
    /^\/api\/posts\/([\w-]+)\/comments$/,
    async ([, id], _, body) => server.createComment(id, body),
  ],
  ['POST', /^\/api\/posts\/([\w-]+)\/like$/, async ([, id]) => server.likePost(id)],
  ['DELETE', /^\/api\/posts\/([\w-]+)\/like$/, async ([, id]) => server.unlikePost(id)],
  ['DELETE', /^\/api\/comments\/([\w-]+)$/, async ([, id]) => server.deleteComment(id)],
  ['POST', /^\/api\/reports$/, async (_, __, body) => server.reportTarget(body)],
  ['GET', /^\/api\/market\/summary$/, async () => server.getMarketSummary()],
  ['GET', /^\/api\/market\/news$/, async (_, q) => server.getMarketNews(q.get('date') ?? '')],
  [
    'GET',
    /^\/api\/industries\/hot$/,
    async (_, q) => server.getHotIndustries((q.get('period') ?? '1w') as HeatPeriod),
  ],
  ['GET', /^\/api\/industries\/([\w-]+)$/, async ([, id]) => server.getIndustry(id)],
  [
    'GET',
    /^\/api\/industries\/([\w-]+)\/news$/,
    async ([, id], q) => server.getIndustryNews(id, Number(q.get('size') ?? 5)),
  ],
  ['GET', /^\/api\/terms$/, async () => server.getTerms()],
  ['GET', /^\/api\/learn\/crosswords$/, async () => server.getCrosswordPuzzles()],
  ['GET', /^\/api\/learn\/crosswords\/([\w-]+)$/, async ([, id]) => server.getCrosswordPuzzle(id)],
  ['GET', /^\/api\/home$/, async () => server.getHomeDashboard()],
  ['GET', /^\/api\/auth\/me$/, async () => server.getMe()],
  ['POST', /^\/api\/auth\/logout$/, async () => server.logout()],
];

/** 이 조건에 맞는 요청은 서버 에러(503)로 응답해요. 테스트에서 실패 화면을 확인할 때 써요. */
let failWhen: ((path: string) => boolean) | null = null;
export const failRequests = (predicate: ((path: string) => boolean) | null) => {
  failWhen = predicate;
};

const jsonResponse = (status: number, data: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
  }) as Response;

export async function handle(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(String(input), 'http://localhost');
  const method = (init?.method ?? 'GET').toUpperCase();
  const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;

  if (failWhen?.(url.pathname)) {
    return jsonResponse(503, {
      error: { code: 'SERVICE_UNAVAILABLE', message: '서버가 잠시 응답하지 않아요.' },
    });
  }

  for (const [routeMethod, pattern, handler] of routes) {
    const match = url.pathname.match(pattern);
    if (!match || routeMethod !== method) continue;
    try {
      const data = await handler(match, url.searchParams, body);
      return data === undefined
        ? ({
            ok: true,
            status: 204,
            headers: new Headers(),
            json: async () => undefined,
          } as Response)
        : jsonResponse(200, data);
    } catch (error) {
      if (error instanceof ApiError) {
        return jsonResponse(error.status, { error: { code: error.code, message: error.message } });
      }
      throw error;
    }
  }
  return jsonResponse(404, { error: { code: 'NOT_FOUND', message: `${method} ${url.pathname}` } });
}
