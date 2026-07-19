import React from 'react';
import { ApprovalQueueItem } from '../../services/workflowApi';
import { ManagerActions } from './ManagerActions';
import { PrReviewForm } from './PrReviewForm';
import { PriceHistoryTimeline } from '../pricing/PriceHistoryTimeline';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  request: ApprovalQueueItem;
  onAction: (actionFn: () => Promise<void>) => Promise<void>;
}

export const DepartmentReviewPanel: React.FC<Props> = ({ request, onAction }) => {
  const { user } = useAuth();

  if (!user) {
    return <p role="alert">Sign in to review department requests.</p>;
  }
  
  // Renders the correct form based on the request's current stage and user's role.
  // Backend authorization ultimately protects the submission.
  const renderActionForm = () => {
    switch (request.currentStage) {
      case 'manager-review':
        return <ManagerActions request={request} onAction={onAction} />;
      case 'pr-review':
        return <PrReviewForm request={request} onAction={onAction} />;
      // TransportationReviewForm and TimingReviewForm would follow the exact pattern as PrReviewForm
      default:
        return <p>Awaiting review from another department.</p>;
    }
  };

  return (
    <div className="department-review-panel">
      <h2>Review Details</h2>
      
      <section className="request-info">
        <p><strong>Employee:</strong> {request.employeeId}</p>
        <p><strong>Initial System Calculation:</strong> ${request.initialPrice}</p>
      </section>

      {request.revisions && request.revisions.length > 0 && (
        <section className="price-history">
          <h3>Earlier Revisions</h3>
          <PriceHistoryTimeline revisions={request.revisions} />
        </section>
      )}

      <div className="action-area">
        {renderActionForm()}
      </div>
    </div>
  );
};
