export const SESSION_COOKIE = "travel_reimbursement_session";

export function sessionCookie(token: string, remember: boolean): string {
  const parts = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, "HttpOnly", "SameSite=Lax", "Path=/"];
  if (remember) parts.push(`Max-Age=${7 * 24 * 60 * 60}`);
  // This deployment runs on plain HTTP permanently (no HTTPS certificate
  // planned) - a "Secure" cookie is silently rejected by browsers over HTTP,
  // which would break every login. Only add it when actually serving HTTPS.
  if (process.env.FORCE_HTTPS === "true") parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
