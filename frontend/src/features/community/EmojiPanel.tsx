import { DAJIN_EMOJIS, type DajinEmoji } from '../../config/dajinEmojis';
import styles from './Comment.module.css';

/** 다진 이모지 고르기 패널. 이미지가 아직 없으면 준비 중 안내를 보여줘요. */
export function EmojiPanel({ onPick }: { onPick: (emoji: DajinEmoji) => void }) {
  return (
    <div className={styles.emojiPanel} role="group" aria-label="다진 이모지">
      {DAJIN_EMOJIS.length === 0 ? (
        <p className={styles.panelEmpty}>다진 이모지를 준비하고 있어요.</p>
      ) : (
        <ul className={styles.emojiGrid}>
          {DAJIN_EMOJIS.map((emoji) => (
            <li key={emoji.id}>
              <button
                type="button"
                className={styles.emojiButton}
                onClick={() => onPick(emoji)}
                aria-label={emoji.name}
                title={emoji.name}
              >
                <img src={emoji.src} alt="" className={styles.emojiPick} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
