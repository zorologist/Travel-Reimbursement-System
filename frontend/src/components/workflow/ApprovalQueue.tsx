import React, { useEffect, useState } from 'react';
import type { ApprovalQueueItem } from '../../services/workflowApi';
import { DepartmentReviewPanel } from './DepartmentReviewPanel';
import { EmptyState } from '../ui/EmptyState';
import { useLanguage } from '../../hooks/useLanguage';
import { localizeLabel } from '../../i18n/format';

interface Props {
  queue: ApprovalQueueItem[];
  onAction: (actionFn: () => Promise<void>) => Promise<void>;
}

export const ApprovalQueue: React.FC<Props> = ({ queue, onAction }) => {
  const { language, tr } = useLanguage();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedItemId((current) => current && queue.some((item) => item.id === current) ? current : (queue[0]?.id ?? null));
  }, [queue]);

  if (queue.length === 0) {
    return (
      <EmptyState
        title={tr("No pending requests", "لا توجد طلبات معلقة")}
        description={tr("There are no requests in your department queue.", "لا توجد طلبات في قائمة القسم الخاصة بك.")}
      />
    );
  }

  const selectedItem = queue.find(item => item.id === selectedItemId);

  return (
    <div className="approval-queue-container">
      <div className="queue-list">
        {queue.map(item => (
          <button type="button"
            key={item.id} 
            className={`queue-card ${selectedItemId === item.id ? 'active' : ''}`}
            onClick={() => setSelectedItemId(item.id)}
          >
            <h3>{tr("Request", "طلب")} #{item.id.slice(-4)}</h3>
            <p>{item.employeeName}</p>
            <small>{localizeLabel(item.currentStage, language)}</small>
          </button>
        ))}
      </div>
      
      <div className="queue-detail">
        {selectedItem ? (
          <DepartmentReviewPanel request={selectedItem} onAction={onAction} />
        ) : (
          <div className="select-prompt">{tr("Select a request to review", "اختر طلباً لمراجعته")}</div>
        )}
      </div>
    </div>
  );
};// All departments will share this queue, with actions based on the signed-in user's role.
