import React from 'react';
import { ApprovalQueueItem } from '../../services/workflowApi';
import { ManagerActions } from './ManagerActions';
import { PrReviewForm } from './PrReviewForm';
import { TransportationReviewForm } from './TransportationReviewForm';
import { TimingReviewForm } from './TimingReviewForm';
import { PriceHistoryTimeline } from '../pricing/PriceHistoryTimeline';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency, formatDateTime, localizeLabel } from '../../i18n/format';

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
  const isPr = user.roles.includes("pr");
  const details = request.requestDetails;
  
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
        <p><strong>{tr("Selected job level", "المستوى الوظيفي المختار")}:</strong> {localizeLabel(request.employeeJobLevel, language)}</p>
        <p><strong>{tr("Route", "المسار")}:</strong> {localizeLabel(details.originCity ?? "Cairo", language)} → {localizeLabel(details.destinationCity ?? "", language)}</p>
        <p><strong>{tr("Trip type", "نوع الرحلة")}:</strong> {details.tripType === "one-way" ? tr("One way", "اتجاه واحد") : tr("Round trip", "ذهاب وعودة")}</p>
        <p><strong>{tr("Departure", "الذهاب")}:</strong> {formatDateTime(details.departureAt ?? "", language)}</p>
        {details.tripType !== "one-way" && <p><strong>{tr("Return", "العودة")}:</strong> {formatDateTime(details.returnAt ?? "", language)}</p>}
        <p><strong>{tr("Transportation", "وسيلة الانتقال")}:</strong> {localizeLabel(details.transportationMethod ?? "", language)}</p>
        <p><strong>{tr("Accommodation", "الإقامة")}:</strong> {localizeLabel(details.accommodationType ?? "none", language)}</p>
        <p><strong>{tr("Request notes", "ملاحظات الطلب")}:</strong> {details.notes || tr("No notes", "لا توجد ملاحظات")}</p>
        {!isPr && <p><strong>{tr("Employee-entered ticket amount", "قيمة التذكرة التي أدخلها الموظف")}:</strong> {formatCurrency(details.claimedTransportationCost ?? 0, language)}</p>}
        {!isPr && <p><strong>{tr("Current system calculation", "حساب النظام الحالي")}:</strong> {formatCurrency(request.currentPrice, language)}</p>}
      </section>

      <section className="request-info">
        <p><strong>{tr("Ticket attachments", "مرفقات التذكرة")}:</strong></p>
        {request.attachments.length === 0 ? <p>{tr("No attachments", "لا توجد مرفقات")}</p> : request.attachments.map((attachment) => (
          <p key={attachment.id}><a href={attachment.url} download={attachment.name}>{attachment.name}</a></p>
        ))}
      </section>

      {!isPr && request.revisions && request.revisions.length > 0 && (
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
