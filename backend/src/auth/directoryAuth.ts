import { Client } from "ldapts";

import { directoryConfig } from "./directoryConfig.js";

function toUserPrincipalName(username: string, domain: string): string {
  const trimmed = username.trim();
  if (trimmed.includes("@")) return trimmed;
  const accountName = trimmed.includes("\\") ? trimmed.split("\\").at(-1)! : trimmed;
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
  } catch {
    return false;
  } finally {
    await client.unbind().catch(() => {});
  }
}
