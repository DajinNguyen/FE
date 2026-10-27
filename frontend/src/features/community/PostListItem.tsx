import { Link } from 'react-router';
import type { Post } from '../../types';
import { formatRelativeTime } from '../../utils/format';
import { categoryLabels, communityPaths, HIDDEN_POST_TEXT } from './communityLabels';
import styles from './Community.module.css';

/** 글 목록 한 줄: [말머리] 제목 / 본문 한 줄 / 닉네임 · 시간 · 댓글 · 좋아요 */
export function PostListItem({ post }: { post: Post }) {
  if (post.is_hidden) {
    return <p className={styles.hiddenRow}>{HIDDEN_POST_TEXT}</p>;
  }
  return (
    <Link to={communityPaths.post(post.stock_code, post.id)} className={styles.row}>
      <span className={styles.rowTitle}>
        <span className={styles.category}>{categoryLabels[post.category]}</span>
        {post.title}
      </span>
      <span className={styles.preview}>{post.body}</span>
      <span className={styles.meta}>
        {post.author.nickname} · {formatRelativeTime(post.created_at)} · 댓글 {post.comment_count} ·
        좋아요 {post.like_count}
      </span>
    </Link>
  );
}
