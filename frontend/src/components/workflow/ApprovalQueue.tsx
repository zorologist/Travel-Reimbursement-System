import React, { useState } from 'react';
import { ApprovalQueueItem } from '../../services/workflowApi';
import { DepartmentReviewPanel } from './DepartmentReviewPanel';
import { EmptyState } from '../ui/EmptyState';

interface Props {
  queue: ApprovalQueueItem[];
  onAction: (actionFn: () => Promise<void>) => Promise<void>;
}

export const ApprovalQueue: React.FC<Props> = ({ queue, onAction }) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  if (queue.length === 0) {
    return (
      <EmptyState
        title="No pending requests"
        description="There are no requests in your department queue."
      />
    );
  }

  const selectedItem = queue.find(item => item.id === selectedItemId);

  return (
    <div className="approval-queue-container">
      <div className="queue-list">
        {queue.map(item => (
          <div 
            key={item.id} 
            className={`queue-card ${selectedItemId === item.id ? 'active' : ''}`}
            onClick={() => setSelectedItemId(item.id)}
          >
            <h3>Request #{item.id.slice(-4)}</h3>
            <p>Stage: {item.currentStage}</p>
          </div>
        ))}
      </div>
      
      <div className="queue-detail">
        {selectedItem ? (
          <DepartmentReviewPanel request={selectedItem} onAction={onAction} />
        ) : (
          <div className="select-prompt">Select a request to review</div>
        )}
      </div>
    </div>
  );
};// All departments will share this queue, with actions based on the signed-in user's role.
