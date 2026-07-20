import { useCallback, useEffect, useState } from "react";

import {
  requestApi,
  type RequestResponse,
  type TravelRequestData,
} from "../services/requestApi";

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load requests.";
}

export function useRequests() {
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await requestApi.getMyRequests());
    } catch (loadError) {
      setError(messageFor(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  const addRequest = useCallback(async (formData: TravelRequestData) => {
    setLoading(true);
    setError(null);
    try {
      const created = await requestApi.createRequest(formData);
      setRequests((current) => [created, ...current]);
      return created;
    } catch (createError) {
      setError(messageFor(createError));
      throw createError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, addRequest, refetch: fetchRequests };
}
