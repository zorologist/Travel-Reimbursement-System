/**
 * An expected HTTP-facing error.
 *
 * Services and route handlers may throw this when a request should fail with a
 * known status and a safe message. Unexpected errors are deliberately handled
 * separately so internal details are never returned to the client.
 */
export class ApiError extends Error {
  public readonly name = "ApiError";

  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown = null,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
