import { useState, useEffect, useCallback } from 'react';
import { workflowApi, ApprovalQueueItem } from '../services/workflowApi';
import { useLanguage } from './useLanguage';

export const useApprovalQueue = () => {
  const { localizeError } = useLanguage();
  const [queue, setQueue] = useState<ApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workflowApi.getQueue();
      setQueue(data);
      setError(null);
    } catch (err: unknown) {
      setError(localizeError(err, 'Failed to load the approval queue.', 'تعذر تحميل قائمة الاعتماد.'));
    } finally {
      setLoading(false);
    }
  }, [localizeError]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleAction = async (actionFn: () => Promise<void>) => {
    try {
      await actionFn();
      await fetchQueue(); // Refresh after action
    } catch (err: unknown) {
      setError(localizeError(err, 'Action failed. Please refresh and try again.', 'تعذر تنفيذ الإجراء. حدّث الصفحة وحاول مرة أخرى.'));
    }
  };

  return { queue, loading, error, handleAction, fetchQueue };
};
