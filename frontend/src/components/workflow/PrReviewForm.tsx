import { useState } from "react";
import { calculateSalary, type AccommodationType } from "@travel-reimbursement/shared";

import { PriceComparison } from "../pricing/PriceComparison";
import { workflowApi, type ApprovalQueueItem } from "../../services/workflowApi";
import { useLanguage } from "../../hooks/useLanguage";

export function PrReviewForm({ request, onAction }: { request: ApprovalQueueItem; onAction: (action: () => Promise<void>) => Promise<void> }) {
  const { tr } = useLanguage();
  const [accommodationType, setAccommodationType] = useState<AccommodationType>(request.requestDetails.accommodationType ?? "none");
  const [comment, setComment] = useState("");
  const details = request.requestDetails;
  const departure = new Date(details.departureAt ?? "");
  const arrival = new Date(details.returnAt ?? "");
  const overnightCount = Math.max(0, Math.round((Date.UTC(arrival.getUTCFullYear(), arrival.getUTCMonth(), arrival.getUTCDate()) - Date.UTC(departure.getUTCFullYear(), departure.getUTCMonth(), departure.getUTCDate())) / 86_400_000));
  const preview = calculateSalary({ jobLevel: request.employeeJobLevel, accommodationType, overnightCount, isSameDayMission: overnightCount === 0, sameDayVerifiedHours: details.verifiedSameDayHours ?? 0, returnDayVerifiedHours: details.verifiedReturnDayHours ?? 0, transportationCost: details.transportationCost ?? 0, bonusAmount: details.bonusAmount ?? 0, penaltyAmount: details.penaltyAmount ?? 0 });

  return (
    <div className="pr-review-form form-panel">
      <h3>{tr("PR & Accommodation Review", "مراجعة العلاقات العامة والإقامة")}</h3>
      <div className="form-group">
        <label htmlFor={`pr-accommodation-${request.id}`}>{tr("Confirmed accommodation", "الإقامة المؤكدة")}</label>
        <select id={`pr-accommodation-${request.id}`} value={accommodationType} onChange={(event) => setAccommodationType(event.target.value as AccommodationType)}>
          <option value="none">{tr("Employee arranged / none", "على نفقة الموظف / بدون إقامة")}</option>
          <option value="room-only">{tr("Company room only", "غرفة فقط على نفقة الشركة")}</option>
          <option value="room-and-food">{tr("Company room and food", "غرفة ووجبات على نفقة الشركة")}</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor={`pr-comment-${request.id}`}>{tr("PR review comment", "تعليق مراجعة العلاقات العامة")}</label>
        <textarea
          id={`pr-comment-${request.id}`}
          rows={4}
          maxLength={1000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={tr("Add a comment about the accommodation or PR review...", "أضف تعليقاً عن الإقامة أو مراجعة العلاقات العامة...")}
        />
        <small className="form-help">{tr("The comment is saved in the request audit history.", "يُحفظ التعليق في سجل إجراءات الطلب.")}</small>
      </div>
      <PriceComparison originalPrice={request.currentPrice} newPrice={preview.totalAmount} />
      <button
        className="btn-approve"
        type="button"
        onClick={() => void onAction(() => workflowApi.approve(request.id, {
          accommodationType,
          reason: comment.trim() || tr("Accommodation verified by PR.", "تم التحقق من الإقامة بواسطة العلاقات العامة."),
        }))}
      >
        {tr("Approve & Pass to Transportation", "اعتماد وتحويل إلى الانتقالات")}
      </button>
    </div>
  );
}
