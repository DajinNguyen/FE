/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_API_BASE_URL?: string;
  /** 'true' 일 때만 광고 자리를 보여줘요 (기본: 숨김) */
  readonly VITE_SHOW_ADS?: string;
  /** 'true' 일 때만 메인에 "떠오르는 기업"을 보여줘요 (기본: 숨김) */
  readonly VITE_FEATURE_RISING_COMPANIES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
