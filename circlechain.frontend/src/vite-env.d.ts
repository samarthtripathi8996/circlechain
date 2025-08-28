/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TOKEN_REFRESH_INTERVAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}