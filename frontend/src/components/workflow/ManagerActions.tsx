import React, { useState } from 'react';
import { ApprovalQueueItem, workflowApi } from '../../services/workflowApi';

interface Props {
  request: ApprovalQueueItem;
  onAction: (actionFn: () => Promise<void>) => Promise<void>;
}

export const ManagerActions: React.FC<Props> = ({ request, onAction }) => {
  const [reason, setReason] = useState('');

  const handleApprove = () => {
    onAction(() => workflowApi.approve(request.id, { reason }));
  };

  const handleReject = () => {
    if (!reason) {
      alert("A reason is required for rejection.");
      return;
    }
    onAction(() => workflowApi.reject(request.id, reason));
  };

  return (
    <div className="manager-actions form-panel">
      <h3>Manager Approval</h3>
      <textarea 
        placeholder="Enter reasoning (required for rejection)" 
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="button-group">
        <button className="btn-approve" onClick={handleApprove}>Approve Request</button>
        <button className="btn-reject" onClick={handleReject}>Reject Request</button>
      </div>
    </div>
  );
};
