import { useCallback, useState } from 'react';
import { uploadImage } from '../api/uploads';

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; percent: number }
  | { status: 'error'; message: string };

/** 댓글 사진 올리기: 진행률과 실패를 알려줘요. 성공하면 image_url 을 돌려줘요. */
export function useImageUpload() {
  const [state, setState] = useState<UploadState>({ status: 'idle' });

  const upload = useCallback(async (file: File) => {
    setState({ status: 'uploading', percent: 0 });
    try {
      const { image_url } = await uploadImage(file, (percent) =>
        setState({ status: 'uploading', percent }),
      );
      setState({ status: 'idle' });
      return image_url;
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '사진을 올리지 못했어요.',
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, upload, reset };
}
