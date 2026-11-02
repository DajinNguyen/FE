import { ImagePlus, Smile, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import {
  checkImage,
  COMMUNITY_LIMITS,
  findBannedWord,
  IMAGE_UPLOAD,
} from '../../config/communityRules';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import type { CommentInput } from '../../types';
import { EmojiPanel } from './EmojiPanel';
import styles from './Comment.module.css';

interface CommentComposerProps {
  /** 댓글·답글 보내기. 실패하면 onError 를 불러 주세요 (쓴 내용을 되돌려요). */
  onSubmit: (input: CommentInput, callbacks: { onError: () => void }) => void;
  /** 답글 입력창이면 true (입력창 이름이 "답글 입력"이 돼요) */
  reply?: boolean;
  /** 답글이면 원댓글 id (서버가 parent_id 를 지원할 때) */
  parentId?: string;
  /** 답글의 답글이면 대상 닉네임 */
  replyTo?: string;
  placeholder?: string;
  /** 최대 글자 수. 기업 댓글은 2,000자, 답글은 500자 */
  maxLength?: number;
  autoFocus?: boolean;
  onCancel?: () => void;
}

/** 댓글·답글 입력창: 글 + 다진 이모지 + 사진 1장 (모두 로그인 필요) */
export function CommentComposer({
  onSubmit,
  reply,
  parentId,
  replyTo,
  placeholder = '댓글을 남겨 보세요',
  maxLength = COMMUNITY_LIMITS.commentMax,
  autoFocus,
  onCancel,
}: CommentComposerProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const requireLogin = useRequireLogin();
  const { state: upload, upload: uploadImage, reset: resetUpload } = useImageUpload();
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 주소는 다 쓰면 정리해요.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (autoFocus) textRef.current?.focus();
  }, [autoFocus]);

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    resetUpload();
    if (fileRef.current) fileRef.current.value = '';
  };

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    const problem = checkImage(picked);
    if (problem) {
      setError(problem);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setError(null);
    setFile(picked);
  };

  const send = async () => {
    const body = text.trim();
    let imageUrl: string | null = null;
    if (file) {
      imageUrl = await uploadImage(file);
      if (!imageUrl) return; // 실패 안내와 [다시 시도]는 아래에 보여요.
    }
    const input: CommentInput = {
      body,
      parent_id: parentId ?? null,
      reply_to_nickname: replyTo ?? null,
      image_url: imageUrl,
    };
    onSubmit(input, {
      // 실패하면 쓴 글을 입력창에 되돌려요.
      onError: () => setText(body),
    });
    setText('');
    clearFile();
    setEmojiOpen(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body && !file) return;
    const banned = findBannedWord(body);
    if (banned) {
      setError(`${banned}은(는) 쓸 수 없어요.`);
      return;
    }
    requireLogin(() => {
      setError(null);
      void send();
    });
  };

  const uploading = upload.status === 'uploading';

  return (
    <form className={styles.composer} onSubmit={submit}>
      <label htmlFor={inputId} className="visually-hidden">
        {reply || parentId ? '답글 입력' : '댓글 입력'}
      </label>
      <textarea
        id={inputId}
        ref={textRef}
        className={styles.input}
        value={text}
        maxLength={maxLength}
        rows={2}
        placeholder={replyTo ? `@${replyTo} 님에게 답글` : placeholder}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
      />

      {preview && (
        <div className={styles.attachment}>
          <img src={preview} alt="첨부할 사진 미리보기" className={styles.thumb} />
          <button
            type="button"
            className={styles.removeAttachment}
            onClick={clearFile}
            aria-label="사진 첨부 취소"
            disabled={uploading}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      {uploading && (
        <p className={styles.uploading} role="status">
          사진 올리는 중… {upload.percent}%
          <span className={styles.progress} aria-hidden="true">
            <span style={{ width: `${upload.percent}%` }} />
          </span>
        </p>
      )}
      {upload.status === 'error' && (
        <p className={styles.error} role="alert">
          {upload.message}{' '}
          <button type="button" className={styles.textButton} onClick={() => void send()}>
            다시 시도
          </button>
        </p>
      )}

      {emojiOpen && (
        <EmojiPanel
          onPick={(token) => {
            setText((prev) => `${prev}${token}`);
            textRef.current?.focus();
          }}
        />
      )}

      <div className={styles.toolbar}>
        <div className={styles.tools}>
          <button
            type="button"
            className={styles.toolButton}
            aria-pressed={emojiOpen}
            onClick={() => requireLogin(() => setEmojiOpen((open) => !open))}
          >
            <Smile size={18} aria-hidden="true" /> 이모지
          </button>
          <button
            type="button"
            className={styles.toolButton}
            disabled={!IMAGE_UPLOAD.enabled}
            onClick={() => requireLogin(() => fileRef.current?.click())}
            title={IMAGE_UPLOAD.enabled ? 'jpg·png·webp, 5MB 이하' : '사진 올리기는 준비 중이에요'}
          >
            <ImagePlus size={18} aria-hidden="true" />
            {IMAGE_UPLOAD.enabled ? '사진' : '사진 (준비 중)'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_UPLOAD.types.join(',')}
            className="visually-hidden"
            tabIndex={-1}
            aria-label="사진 고르기"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </div>
        <div className={styles.tools}>
          <span className={styles.counter}>
            {text.length.toLocaleString('ko-KR')}/{maxLength.toLocaleString('ko-KR')}
          </span>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={(!text.trim() && !file) || uploading}>
            등록
          </Button>
        </div>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
