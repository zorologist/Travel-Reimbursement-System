import { useState, useEffect } from 'react';
import { requestApi, TravelRequestData, RequestResponse } from '../services/requestApi';

export function useRequests() {
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestApi.getMyRequests();
      setRequests(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SERVER_ERROR';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addRequest = async (formData: TravelRequestData) => {
    setLoading(true);
    setError(null);
    try {
      const newReq = await requestApi.createRequest(formData);
      setRequests((prev: RequestResponse[]) => [newReq, ...prev]);
      return newReq;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SERVER_ERROR';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return { requests, loading, error, addRequest, refetch: fetchRequests };
}