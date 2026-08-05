export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl: boolean;
}

export function databaseConfig(
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseConfig | null {
  const connectionString = environment.DATABASE_URL?.trim();
  const host = environment.DATABASE_HOST?.trim();
  const database = environment.DATABASE_NAME?.trim();
  const user = environment.DATABASE_USER?.trim();
  const password = environment.DATABASE_PASSWORD;
  const hasIndividualSettings = Boolean(host || database || user || password);
  if (!connectionString && !hasIndividualSettings) return null;

  if (connectionString) {
    let parsed: URL;
    try {
      parsed = new URL(connectionString);
    } catch {
      throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      throw new Error("DATABASE_URL must start with postgres:// or postgresql://.");
    }
    if (!parsed.hostname || !parsed.pathname.slice(1)) {
      throw new Error("DATABASE_URL must include a database host and database name.");
    }
  } else if (!host || !database || !user || password === undefined) {
    throw new Error(
      "DATABASE_HOST, DATABASE_NAME, DATABASE_USER, and DATABASE_PASSWORD must all be provided.",
    );
  }

  const portText = environment.DATABASE_PORT?.trim() || "5432";
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("DATABASE_PORT must be an integer between 1 and 65535.");
  }

  const sslSetting = environment.DATABASE_SSL?.trim().toLowerCase();
  if (sslSetting && !["true", "false"].includes(sslSetting)) {
    throw new Error("DATABASE_SSL must be true or false when provided.");
  }

  return {
    ...(connectionString
      ? { connectionString }
      : { host, port, database, user, password }),
    ssl: sslSetting === "true",
  };
}

export function requireDatabaseConfig(
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseConfig {
  const config = databaseConfig(environment);
  if (!config) throw new Error("DATABASE_URL is required for this command.");
  return config;
}
