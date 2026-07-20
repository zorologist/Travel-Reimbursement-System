/** Tests and an explicit opt-in may use the browser repository; normal development uses the backend API. */
export const useDevelopmentRepository =
  import.meta.env.MODE === "test"
  || import.meta.env.VITE_USE_DEVELOPMENT_REPOSITORY === "true";
