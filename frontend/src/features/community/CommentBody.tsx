import { useState } from 'react';
import { Sheet } from '../../components/Sheet';
import { splitBody } from '../../config/dajinEmojis';
import styles from './Comment.module.css';

/** 댓글 본문: "@닉네임" + 글, 그 아래 다진 이모지 하나, 작은 사진 (누르면 크게) */
export function CommentBody({
  body,
  replyTo,
  imageUrl,
}: {
  body: string;
  replyTo?: string | null;
  imageUrl?: string | null;
}) {
  const [zoom, setZoom] = useState(false);
  const { text, emoji } = splitBody(body);
  return (
    <>
      {(text || replyTo) && (
        <p className={styles.body}>
          {replyTo && <span className={styles.mention}>@{replyTo} </span>}
          {text}
        </p>
      )}
      {emoji && <img src={emoji.src} alt={emoji.alt} className={styles.emoji} />}
      {imageUrl && (
        <>
          <button
            type="button"
            className={styles.thumbButton}
            onClick={() => setZoom(true)}
            aria-label="사진 크게 보기"
          >
            <img src={imageUrl} alt="댓글 사진" className={styles.thumb} />
          </button>
          <Sheet open={zoom} onClose={() => setZoom(false)} title="댓글 사진">
            <img src={imageUrl} alt="댓글 사진 크게 보기" className={styles.zoomed} />
          </Sheet>
        </>
      )}
    </>
  );
}
