/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_API_BASE_URL?: string;
  /** 'true' 일 때만 광고 자리를 보여줘요 (기본: 숨김) */
  readonly VITE_SHOW_ADS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
