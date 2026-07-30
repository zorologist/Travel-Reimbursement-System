interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export class ApiClientError extends Error {
  public readonly name = "ApiClientError";

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

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
const apiBaseUrl = configuredBaseUrl.replace(/\/$/, "");
export const AUTHENTICATION_EXPIRED_EVENT = "travel-reimbursement:authentication-expired";
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiClientError(
      response.status,
      "INVALID_API_RESPONSE",
      "The server returned an invalid JSON response.",
    );
  }
}

function errorEnvelope(value: unknown): ApiErrorEnvelope | null {
  if (typeof value !== "object" || value === null) return null;
  return value as ApiErrorEnvelope;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(csrfToken && init.method && !["GET", "HEAD"].includes(init.method)
          ? { "X-CSRF-Token": csrfToken }
          : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401 && path !== "/api/auth/login") {
      setCsrfToken(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTHENTICATION_EXPIRED_EVENT));
      }
    }
    const envelope = errorEnvelope(data)?.error;
    throw new ApiClientError(
      response.status,
      envelope?.code ?? "API_REQUEST_FAILED",
      envelope?.message ?? `Request failed with status ${response.status}.`,
      envelope?.details ?? null,
    );
  }

  return {
    data: data as T,
    status: response.status,
  };
}

const api = {
  get<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path);
  },

  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
};

export default api;
