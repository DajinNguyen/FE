import { useSearchParams } from 'react-router';

/** 주소의 ?with= 비교할 기업 (지금 보는 기업과 같으면 없는 것으로) */
export function useCompareWith(stockCode: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('with');
  const withCode = raw && raw !== stockCode ? raw : null;
  const setWith = (code: string | null) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (code) params.set('with', code);
        else params.delete('with');
        return params;
      },
      { replace: true },
    );
  return [withCode, setWith] as const;
}
