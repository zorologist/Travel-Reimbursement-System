import { Client, InvalidCredentialsError } from "ldapts";

import { directoryConfig } from "./directoryConfig.js";

export type DirectoryAuthenticationFailure =
  | "invalid-credentials"
  | "account-locked"
  | "account-disabled"
  | "account-expired"
  | "password-expired"
  | "password-change-required"
  | "account-restricted"
  | "directory-unavailable";

export class DirectoryAuthenticationError extends Error {
  public readonly name = "DirectoryAuthenticationError";

  public constructor(public readonly reason: Exclude<DirectoryAuthenticationFailure, "invalid-credentials">) {
    super(reason);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function resultCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  return typeof error.code === "number" ? error.code : undefined;
}

/** Converts ldapts/AD failures to safe application-level reasons. */
export function classifyDirectoryAuthenticationError(error: unknown): DirectoryAuthenticationFailure {
  const invalidCredentials = error instanceof InvalidCredentialsError || resultCode(error) === 49;
  if (!invalidCredentials) return "directory-unavailable";

  const diagnostic = error instanceof Error ? error.message : String(error);
  const subcode = /\bdata\s+(?:0x)?([0-9a-f]+)\b/i.exec(diagnostic)?.[1]?.toLowerCase();
  switch (subcode) {
    case "775": return "account-locked";
    case "533": return "account-disabled";
    case "701": return "account-expired";
    case "532": return "password-expired";
    case "773": return "password-change-required";
    case "52f":
    case "530":
    case "531": return "account-restricted";
    // AD deliberately does not reliably distinguish an unknown username from
    // a bad password. Keep both cases under the same safe response.
    case "525":
    case "52e":
    default: return "invalid-credentials";
  }
}

export function toUserPrincipalName(username: string, domain: string): string {
  const trimmed = username.trim();
  if (trimmed.includes("@")) return trimmed;
  // Accept either slash direction - people mix these up constantly by hand.
  const accountName = /[\\/]/.test(trimmed) ? trimmed.split(/[\\/]/).at(-1)! : trimmed;
  return `${accountName}@${domain}`;
}

/** Verifies a username/password pair against Active Directory via an LDAP simple bind. */
export async function verifyDirectoryCredentials(username: string, password: string): Promise<boolean> {
  // An empty password performs an LDAP "unauthenticated bind", which servers
  // may accept without checking credentials at all.
  if (!username.trim() || !password.trim()) return false;

  const { url, domain } = directoryConfig();
  const bindDn = toUserPrincipalName(username, domain);
  const client = new Client({ url, connectTimeout: 5_000, timeout: 5_000 });

  try {
    await client.bind(bindDn, password);
    return true;
  } catch (error) {
    const reason = classifyDirectoryAuthenticationError(error);
    if (reason === "invalid-credentials") return false;
    throw new DirectoryAuthenticationError(reason);
  } finally {
    await client.unbind().catch(() => {});
  }
}
