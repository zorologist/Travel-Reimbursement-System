import React, { useState } from 'react';
import { ApprovalQueueItem, workflowApi } from '../../services/workflowApi';
import { useLanguage } from '../../hooks/useLanguage';

interface Props {
  request: ApprovalQueueItem;
  onAction: (actionFn: () => Promise<void>) => Promise<void>;
}

export const ManagerActions: React.FC<Props> = ({ request, onAction }) => {
  const { tr } = useLanguage();
  const [reason, setReason] = useState('');

  const handleApprove = () => {
    onAction(() => workflowApi.approve(request.id, { reason }));
  };

  const handleReject = () => {
    if (!reason) {
      alert(tr("A reason is required for rejection.", "يجب إدخال سبب الرفض."));
      return;
    }
    onAction(() => workflowApi.reject(request.id, reason));
  };

  return (
    <div className="manager-actions form-panel">
      <h3>{tr("Manager Approval", "اعتماد المدير")}</h3>
      <textarea 
        placeholder={tr("Enter a comment (required for rejection)", "أدخل تعليقاً (مطلوب عند الرفض)")}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="button-group">
        <button className="btn-approve" onClick={handleApprove}>{tr("Approve Request", "اعتماد الطلب")}</button>
        <button className="btn-reject" onClick={handleReject}>{tr("Reject Request", "رفض الطلب")}</button>
      </div>
    </div>
  );
};
