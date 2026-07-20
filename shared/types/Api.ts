export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

export interface RequestEnvelope<T> {
  request: T;
}

export interface RequestsEnvelope<T> {
  requests: T[];
}
