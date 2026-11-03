import { useState } from 'react';
import { Sheet } from '../../components/Sheet';
import { DAJIN_EMOJIS, EMOJI_TOKEN_PATTERN, isEmojiOnly } from '../../config/dajinEmojis';
import styles from './Comment.module.css';

/** ":dajin-like:" 같은 표시를 이미지로 바꿔요. 모르는 이모지는 글자 그대로 둬요. */
function renderBody(body: string, emojiOnly: boolean) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of body.matchAll(EMOJI_TOKEN_PATTERN)) {
    const emoji = DAJIN_EMOJIS.find((e) => e.id === match[1]);
    if (!emoji) continue;
    parts.push(body.slice(last, match.index));
    parts.push(
      <img
        key={match.index}
        src={emoji.src}
        alt={emoji.alt}
        className={emojiOnly ? styles.emojiLarge : styles.emojiInline}
      />,
    );
    last = (match.index ?? 0) + match[0].length;
  }
  parts.push(body.slice(last));
  return parts;
}

/** 댓글 본문: "@닉네임" + 글(이모지 포함) + 작은 사진 (누르면 크게) */
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
  const emojiOnly = isEmojiOnly(body);
  return (
    <>
      {(body || replyTo) && (
        <p className={`${styles.body} ${emojiOnly ? styles.emojiOnly : ''}`}>
          {replyTo && <span className={styles.mention}>@{replyTo} </span>}
          {renderBody(body, emojiOnly)}
        </p>
      )}
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
