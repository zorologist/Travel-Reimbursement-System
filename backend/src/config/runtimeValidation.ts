import { existsSync } from "node:fs";

import { authenticationConfig } from "../auth/authConfig.js";
import { databaseConfig } from "../database/config.js";

export function validateRuntime(environment: NodeJS.ProcessEnv = process.env): void {
  if (environment.NODE_ENV !== "production") return;
  const problems: string[] = [];
  if (!databaseConfig(environment)) problems.push("PostgreSQL connection settings are required");
  const authMode = authenticationConfig(environment).mode;
  if (authMode !== "iis" && authMode !== "ldap") problems.push("AUTH_MODE must be iis or ldap");
  if (environment.STORAGE_MODE !== "postgres") problems.push("STORAGE_MODE must be postgres");
  if (environment.ENABLE_DEVELOPMENT_ACCOUNTS === "true") problems.push("development accounts must be disabled");
  if (environment.ALLOW_DEV_AUTH_HEADER === "true") problems.push("development auth headers must be disabled");
  if (environment.HOST && !["127.0.0.1", "::1", "localhost"].includes(environment.HOST.trim())) {
    problems.push("HOST must be loopback so users cannot bypass IIS");
  }
  if (environment.SERVE_FRONTEND !== "true") problems.push("SERVE_FRONTEND must be true");
  if (problems.length > 0) throw new Error(`Invalid production configuration: ${problems.join("; ")}.`);
}

export function requireFrontendBuild(frontendIndex: string, environment: NodeJS.ProcessEnv = process.env): void {
  if ((environment.SERVE_FRONTEND === "true" || environment.NODE_ENV === "production") && !existsSync(frontendIndex)) {
    throw new Error(`Frontend production build is missing: ${frontendIndex}`);
  }
}
