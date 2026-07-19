import { useState, useEffect, useCallback } from 'react';
import { workflowApi, ApprovalQueueItem } from '../services/workflowApi';

export const useApprovalQueue = () => {
  const [queue, setQueue] = useState<ApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workflowApi.getQueue();
      setQueue(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load approval queue. Conflict or stale data may exist.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleAction = async (actionFn: () => Promise<void>) => {
    try {
      await actionFn();
      await fetchQueue(); // Refresh after action
    } catch (err: any) {
      setError(err.message || 'Action failed. Please refresh and try again.');
    }
  };

  return { queue, loading, error, handleAction, fetchQueue };
};
