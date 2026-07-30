// This reference gives TypeScript the types for Vite features such as import.meta.env.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_DEVELOPMENT_REPOSITORY?: string;
  readonly VITE_DEVELOPMENT_ACCOUNTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
