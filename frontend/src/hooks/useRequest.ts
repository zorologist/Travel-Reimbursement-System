import { useCallback, useEffect, useState } from "react";

import {
  requestApi,
  type RequestResponse,
  type TravelRequestData,
} from "../services/requestApi";
import { useLanguage } from "./useLanguage";

export function useRequests() {
  const { localizeError } = useLanguage();
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await requestApi.getMyRequests());
    } catch (loadError) {
      setError(localizeError(loadError, "Unable to load requests.", "تعذر تحميل الطلبات."));
    } finally {
      setLoading(false);
    }
  }, [localizeError]);

  const addRequest = useCallback(async (formData: TravelRequestData) => {
    setLoading(true);
    setError(null);
    try {
      const created = await requestApi.createRequest(formData);
      setRequests((current) => [created, ...current]);
      return created;
    } catch (createError) {
      setError(localizeError(createError, "Unable to create the request.", "تعذر إنشاء الطلب."));
      throw createError;
    } finally {
      setLoading(false);
    }
  }, [localizeError]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, addRequest, refetch: fetchRequests };
}
