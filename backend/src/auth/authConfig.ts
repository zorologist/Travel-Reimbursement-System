export type AuthenticationMode = "development" | "iis";

export interface AuthenticationConfig {
  mode: AuthenticationMode;
  identityHeader: string;
  trustedProxyAddresses: ReadonlySet<string>;
}

const HEADER_NAME = /^[a-z0-9-]+$/;

export function authenticationConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AuthenticationConfig {
  const defaultMode: AuthenticationMode = environment.NODE_ENV === "production" ? "iis" : "development";
  const mode = (environment.AUTH_MODE?.trim().toLowerCase() || defaultMode) as AuthenticationMode;
  if (!["development", "iis"].includes(mode)) {
    throw new Error("AUTH_MODE must be development or iis.");
  }
  const identityHeader = environment.IIS_IDENTITY_HEADER?.trim().toLowerCase()
    || "x-iis-windows-user";
  if (!HEADER_NAME.test(identityHeader)) {
    throw new Error("IIS_IDENTITY_HEADER must be a valid HTTP header name.");
  }
  const configuredAddresses = environment.IIS_TRUSTED_PROXY_ADDRESSES
    ?.split(",").map((value) => value.trim()).filter(Boolean);
  return {
    mode,
    identityHeader,
    trustedProxyAddresses: new Set(configuredAddresses?.length
      ? configuredAddresses
      : ["127.0.0.1", "::1", "::ffff:127.0.0.1"]),
  };
}
