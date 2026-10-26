/**
 * 커뮤니티 목 서버 (메모리 저장). 새로고침 전까지 글쓰기·댓글·좋아요·신고가 실제처럼 남아요.
 * 실제 서버에서 지켜야 할 규칙(글자 수, 금지어, 도배 방지, 신고 3건 숨김, 본인만 수정·삭제)도 흉내 내요.
 */
import { ApiError } from '../api/errors';
import { getSessionUser } from '../api/session';
import { COMMUNITY_LIMITS, findBannedWord } from '../config/communityRules';
import type {
  Comment,
  LikeResult,
  Post,
  PostCategory,
  PostInput,
  PostPage,
  PostSort,
  ReportInput,
} from '../types';

interface StoredPost {
  id: string;
  stock_code: string;
  category: PostCategory;
  title: string;
  body: string;
  author: { id: string; nickname: string };
  created_at: string;
  updated_at: string | null;
  likes: Set<string>;
  reports: Set<string>;
}

interface StoredComment {
  id: string;
  post_id: string;
  body: string;
  author: { id: string; nickname: string };
  created_at: string;
  reports: Set<string>;
}

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

const people = {
  a: { id: 'u-a', nickname: '주린이' },
  b: { id: 'u-b', nickname: '반도체공부중' },
  c: { id: 'u-c', nickname: '배당좋아' },
  d: { id: 'u-d', nickname: '차트보단재무' },
  e: { id: 'u-e', nickname: '용어수집가' },
};

/** 좋아요·신고한 사람 수만큼 가짜 id 를 만들어요. */
const fakeUsers = (count: number, prefix: string) =>
  new Set(Array.from({ length: count }, (_, i) => `${prefix}-${i}`));

let posts: StoredPost[] = [];
let comments: StoredComment[] = [];
let lastPostAt = new Map<string, number>();
let seq = 0;

function seed() {
  const p = (
    id: string,
    category: PostCategory,
    title: string,
    body: string,
    author: StoredPost['author'],
    hours: number,
    likes: number,
    reports = 0,
  ): StoredPost => ({
    id,
    stock_code: '005930',
    category,
    title,
    body,
    author,
    created_at: hoursAgo(hours),
    updated_at: null,
    likes: fakeUsers(likes, `${id}-like`),
    reports: fakeUsers(reports, `${id}-report`),
  });
  posts = [
    p(
      'p1',
      'question',
      'HBM이 뭔지 쉽게 알려주실 분?',
      '메모리를 여러 층 쌓은 거라고 들었는데, 왜 AI에 필요한 건지 잘 모르겠어요.',
      people.a,
      2,
      12,
    ),
    p(
      'p2',
      'analysis',
      '4분기 실적 정리해 봤어요',
      '매출 93.8조, 영업이익 20.1조였어요. 작년 같은 분기보다 반도체 쪽이 많이 늘었네요. 숫자는 회사 발표 자료 기준이에요.',
      people.d,
      5,
      31,
    ),
    p(
      'p3',
      'news',
      'HBM4 공급 계획 기사 공유해요',
      '회사 뉴스룸에 다음 세대 메모리 공급 계획이 올라왔어요. 기사 원문은 뉴스 탭에서 볼 수 있어요.',
      people.b,
      8,
      7,
    ),
    p(
      'p4',
      'free',
      '처음 공부 시작했어요',
      '재무제표 보는 법부터 차근차근 익히는 중이에요. 용어 카드가 도움이 많이 되네요.',
      people.e,
      20,
      18,
    ),
    p(
      'p5',
      'question',
      '영업이익이랑 순이익 차이가 뭐예요?',
      '리포트 보다가 둘이 달라서 헷갈려요.',
      people.a,
      26,
      9,
    ),
    p(
      'p6',
      'analysis',
      '사업별 매출 비중 보니까',
      '반도체(DS)가 가장 크고 스마트폰(MX)이 뒤를 잇네요. 반도체 시장 분위기에 영향을 크게 받는 구조 같아요.',
      people.d,
      30,
      22,
    ),
    p(
      'p7',
      'free',
      '배당은 언제 들어오나요?',
      '분기마다 나오는지 1년에 한 번인지 궁금해요.',
      people.c,
      50,
      5,
    ),
    p(
      'p8',
      'news',
      '반도체 수출 통계 나왔어요',
      '이번 달 반도체 수출이 작년보다 늘었다는 통계가 나왔어요.',
      people.b,
      70,
      4,
    ),
    p(
      'p9',
      'question',
      'PER 18배면 높은 건가요?',
      '업종마다 다르다고 하던데 비교는 어떻게 하나요?',
      people.e,
      90,
      11,
    ),
    p('p10', 'free', '용어 게임 해봤는데 재밌네요', '낱말퀴즈도 있어서 좋아요.', people.c, 110, 3),
    p(
      'p11',
      'analysis',
      '부채비율 27%면 어떤 수준일까',
      '자기 돈에 비해 빚이 적은 편이라고 이해했어요. 맞나요?',
      people.d,
      140,
      8,
    ),
    p(
      'p12',
      'free',
      '오늘 꼭 사세요 무조건 오릅니다',
      '(신고로 숨겨진 글 예시)',
      people.b,
      3,
      0,
      3,
    ),
  ];
  const c = (
    id: string,
    postId: string,
    body: string,
    author: StoredComment['author'],
    hours: number,
    reports = 0,
  ): StoredComment => ({
    id,
    post_id: postId,
    body,
    author,
    created_at: hoursAgo(hours),
    reports: fakeUsers(reports, `${id}-report`),
  });
  comments = [
    c(
      'c1',
      'p1',
      '여러 층으로 쌓아서 한 번에 데이터를 많이 주고받을 수 있는 메모리예요.',
      people.b,
      1.5,
    ),
    c('c2', 'p1', '용어 카드에도 설명이 있어요!', people.e, 1),
    c('c3', 'p1', '여기서 말고 오픈채팅으로 오세요 (숨겨진 댓글 예시)', people.c, 0.5, 3),
    c('c4', 'p2', '정리 감사해요. 숫자 출처까지 적어 주셔서 좋네요.', people.a, 4),
    c(
      'c5',
      'p5',
      '영업이익은 장사로 번 돈, 순이익은 이자·세금까지 다 정리하고 남은 돈이에요.',
      people.d,
      20,
    ),
  ];
  lastPostAt = new Map();
  seq = 0;
}
seed();

/** 테스트 사이에 처음 상태로 되돌려요. */
export function resetCommunityStore() {
  seed();
}

const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : ms));

const isHidden = (reports: Set<string>) => reports.size >= COMMUNITY_LIMITS.hideAfterReports;

function toPost(stored: StoredPost): Post {
  const me = getSessionUser()?.id;
  const hidden = isHidden(stored.reports);
  return {
    id: stored.id,
    stock_code: stored.stock_code,
    category: stored.category,
    title: hidden ? '' : stored.title,
    body: hidden ? '' : stored.body,
    author: stored.author,
    created_at: stored.created_at,
    updated_at: stored.updated_at,
    like_count: stored.likes.size,
    comment_count: comments.filter((cm) => cm.post_id === stored.id).length,
    liked_by_me: Boolean(me && stored.likes.has(me)),
    reported_by_me: Boolean(me && stored.reports.has(me)),
    is_mine: stored.author.id === me,
    is_hidden: hidden,
  };
}

function toComment(stored: StoredComment): Comment {
  const hidden = isHidden(stored.reports);
  return {
    id: stored.id,
    post_id: stored.post_id,
    body: hidden ? '' : stored.body,
    author: stored.author,
    created_at: stored.created_at,
    is_mine: stored.author.id === getSessionUser()?.id,
    is_hidden: hidden,
  };
}

function requireUser() {
  const user = getSessionUser();
  if (!user) throw new ApiError('로그인이 필요해요', 401, 'LOGIN_REQUIRED');
  return user;
}

function findPost(postId: string) {
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new ApiError('글을 찾지 못했어요', 404, 'POST_NOT_FOUND');
  return post;
}

function validatePost(input: PostInput) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (
    !title ||
    title.length > COMMUNITY_LIMITS.titleMax ||
    !body ||
    body.length > COMMUNITY_LIMITS.bodyMax
  ) {
    throw new ApiError('제목과 본문 글자 수를 확인해 주세요', 400, 'INVALID_LENGTH');
  }
  const banned = findBannedWord(`${title} ${body}`);
  if (banned) throw new ApiError(`${banned}은(는) 쓸 수 없어요`, 400, 'BANNED_WORD');
  return { title, body };
}

export async function getPosts(
  stockCode: string,
  { sort, category, page }: { sort: PostSort; category?: PostCategory; page: number },
  size: number,
): Promise<PostPage> {
  await wait(200);
  const list = posts
    .filter((p) => p.stock_code === stockCode && (!category || p.category === category))
    .sort((a, b) =>
      sort === 'popular'
        ? b.likes.size - a.likes.size || b.created_at.localeCompare(a.created_at)
        : b.created_at.localeCompare(a.created_at),
    );
  const start = (page - 1) * size;
  return {
    items: list.slice(start, start + size).map(toPost),
    page,
    has_next: start + size < list.length,
  };
}

export async function getPost(postId: string): Promise<Post> {
  await wait(150);
  return toPost(findPost(postId));
}

export async function createPost(stockCode: string, input: PostInput): Promise<Post> {
  await wait(250);
  const user = requireUser();
  const last = lastPostAt.get(user.id);
  if (last && Date.now() - last < COMMUNITY_LIMITS.postIntervalSeconds * 1000) {
    throw new ApiError(
      '글은 30초에 한 번만 쓸 수 있어요. 잠시 후 다시 시도해 주세요',
      429,
      'TOO_FREQUENT',
    );
  }
  const { title, body } = validatePost(input);
  seq += 1;
  const stored: StoredPost = {
    id: `new-${Date.now()}-${seq}`,
    stock_code: stockCode,
    category: input.category,
    title,
    body,
    author: { id: user.id, nickname: user.nickname },
    created_at: new Date().toISOString(),
    updated_at: null,
    likes: new Set(),
    reports: new Set(),
  };
  posts = [stored, ...posts];
  lastPostAt.set(user.id, Date.now());
  return toPost(stored);
}

export async function updatePost(postId: string, input: PostInput): Promise<Post> {
  await wait(250);
  const user = requireUser();
  const post = findPost(postId);
  if (post.author.id !== user.id) throw new ApiError('내 글만 고칠 수 있어요', 403, 'NOT_OWNER');
  const { title, body } = validatePost(input);
  Object.assign(post, {
    category: input.category,
    title,
    body,
    updated_at: new Date().toISOString(),
  });
  return toPost(post);
}

export async function deletePost(postId: string): Promise<void> {
  await wait(200);
  const user = requireUser();
  const post = findPost(postId);
  if (post.author.id !== user.id) throw new ApiError('내 글만 지울 수 있어요', 403, 'NOT_OWNER');
  posts = posts.filter((p) => p.id !== postId);
  comments = comments.filter((cm) => cm.post_id !== postId);
}

export async function getComments(postId: string): Promise<Comment[]> {
  await wait(150);
  findPost(postId);
  return comments
    .filter((cm) => cm.post_id === postId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(toComment);
}

export async function createComment(postId: string, body: string): Promise<Comment> {
  await wait(200);
  const user = requireUser();
  findPost(postId);
  const text = body.trim();
  if (!text || text.length > COMMUNITY_LIMITS.commentMax) {
    throw new ApiError('댓글 글자 수를 확인해 주세요', 400, 'INVALID_LENGTH');
  }
  const banned = findBannedWord(text);
  if (banned) throw new ApiError(`${banned}은(는) 쓸 수 없어요`, 400, 'BANNED_WORD');
  seq += 1;
  const stored: StoredComment = {
    id: `c-new-${Date.now()}-${seq}`,
    post_id: postId,
    body: text,
    author: { id: user.id, nickname: user.nickname },
    created_at: new Date().toISOString(),
    reports: new Set(),
  };
  comments = [...comments, stored];
  return toComment(stored);
}

export async function deleteComment(commentId: string): Promise<void> {
  await wait(150);
  const user = requireUser();
  const comment = comments.find((cm) => cm.id === commentId);
  if (!comment) throw new ApiError('댓글을 찾지 못했어요', 404, 'COMMENT_NOT_FOUND');
  if (comment.author.id !== user.id)
    throw new ApiError('내 댓글만 지울 수 있어요', 403, 'NOT_OWNER');
  comments = comments.filter((cm) => cm.id !== commentId);
}

export async function likePost(postId: string): Promise<LikeResult> {
  await wait(150);
  const user = requireUser();
  const post = findPost(postId);
  post.likes.add(user.id);
  return { like_count: post.likes.size, liked_by_me: true };
}

export async function unlikePost(postId: string): Promise<LikeResult> {
  await wait(150);
  const user = requireUser();
  const post = findPost(postId);
  post.likes.delete(user.id);
  return { like_count: post.likes.size, liked_by_me: false };
}

export async function reportTarget(input: ReportInput): Promise<void> {
  await wait(200);
  const user = requireUser();
  const target =
    input.target_type === 'post'
      ? findPost(input.target_id)
      : comments.find((cm) => cm.id === input.target_id);
  if (!target) throw new ApiError('신고할 대상을 찾지 못했어요', 404, 'TARGET_NOT_FOUND');
  if (target.reports.has(user.id)) throw new ApiError('이미 신고했어요', 409, 'ALREADY_REPORTED');
  target.reports.add(user.id);
}
