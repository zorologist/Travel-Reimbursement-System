/** Tests and development use the mock repository by default unless explicitly disabled via VITE_USE_DEVELOPMENT_REPOSITORY=false. */
export const useDevelopmentRepository =
  import.meta.env.MODE === "test"
  || (import.meta.env.DEV && import.meta.env.VITE_USE_DEVELOPMENT_REPOSITORY !== "false");
