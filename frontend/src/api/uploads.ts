import { apiConfig } from './client';
import { ApiError } from './errors';

/**
 * 사진 올리기 (POST /api/uploads, multipart, 칸 이름 file) → { image_url }
 * 진행률을 보여주려고 fetch 대신 XMLHttpRequest 를 써요.
 */
export function uploadImage(file: File, onProgress?: (percent: number) => void) {
  return new Promise<{ image_url: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${apiConfig.baseUrl}/api/uploads`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let data: { image_url?: string; error?: { code?: string; message?: string } } | undefined;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = undefined;
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.image_url) {
        resolve({ image_url: data.image_url });
      } else {
        reject(
          new ApiError(
            data?.error?.message ?? '사진을 올리지 못했어요.',
            xhr.status,
            data?.error?.code,
          ),
        );
      }
    };
    xhr.onerror = () => reject(new ApiError('서버에 연결하지 못했어요.', 0, 'NETWORK_ERROR'));
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}
