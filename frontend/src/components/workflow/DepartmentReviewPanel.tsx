import React from 'react';
import { ApprovalQueueItem } from '../../services/workflowApi';
import { ManagerActions } from './ManagerActions';
import { PrReviewForm } from './PrReviewForm';
import { TransportationReviewForm } from './TransportationReviewForm';
import { TimingReviewForm } from './TimingReviewForm';
import { PriceHistoryTimeline } from '../pricing/PriceHistoryTimeline';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency } from '../../i18n/format';

interface Props {
  request: ApprovalQueueItem;
  onAction: (actionFn: () => Promise<void>) => Promise<void>;
}

export const DepartmentReviewPanel: React.FC<Props> = ({ request, onAction }) => {
  const { user } = useAuth();
  const { language, tr } = useLanguage();

  if (!user) {
    return <p role="alert">{tr("Sign in to review department requests.", "سجل الدخول لمراجعة طلبات القسم.")}</p>;
  }
  
  // Renders the correct form based on the request's current stage and user's role.
  // Backend authorization ultimately protects the submission.
  const renderActionForm = () => {
    switch (request.currentStage) {
      case 'manager-review':
        return <ManagerActions request={request} onAction={onAction} />;
      case 'pr-review':
        return <PrReviewForm request={request} onAction={onAction} />;
      case 'transportation-review':
        return <TransportationReviewForm request={request} onAction={onAction} />;
      case 'timing-review':
        return <TimingReviewForm request={request} onAction={onAction} />;
      default:
        return <p>{tr("Awaiting review from another department.", "بانتظار المراجعة من قسم آخر.")}</p>;
    }
  };

  return (
    <div className="department-review-panel">
      <h2>{tr("Review Details", "تفاصيل المراجعة")}</h2>
      
      <section className="request-info">
        <p><strong>{tr("Employee", "الموظف")}:</strong> {request.employeeName} ({request.employeeNumber})</p>
        <p><strong>{tr("Department", "القسم")}:</strong> {request.department}</p>
        <p><strong>{tr("Initial System Calculation", "حساب النظام الأولي")}:</strong> {formatCurrency(request.initialPrice, language)}</p>
      </section>

      {request.revisions && request.revisions.length > 0 && (
        <section className="price-history">
          <h3>{tr("Earlier Revisions", "التعديلات السابقة")}</h3>
          <PriceHistoryTimeline revisions={request.revisions} />
        </section>
      )}

      <div className="action-area">
        {renderActionForm()}
      </div>
    </div>
  );
};
