import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      ALLOW_DEV_AUTH_HEADER: "true",
      ENABLE_DEVELOPMENT_ACCOUNTS: "true",
    },
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["dist/**", "node_modules/**"],
  },
});
