import { useState } from "react";
import type { AccommodationType } from "@travel-reimbursement/shared";

import { workflowApi, type ApprovalQueueItem } from "../../services/workflowApi";
import { useLanguage } from "../../hooks/useLanguage";
import { accommodationOptions } from "../../constants/accommodationOptions";

export function PrReviewForm({ request, onAction }: { request: ApprovalQueueItem; onAction: (action: () => Promise<void>) => Promise<void> }) {
  const { tr } = useLanguage();
  const [accommodationType, setAccommodationType] = useState<AccommodationType>(request.requestDetails.accommodationType ?? "none");
  const [comment, setComment] = useState("");

  return (
    <div className="pr-review-form form-panel">
      <h3>{tr("PR & Accommodation Review", "مراجعة العلاقات العامة والإقامة")}</h3>
      <div className="form-group">
        <label htmlFor={`pr-accommodation-${request.id}`}>{tr("Confirmed accommodation", "الإقامة المؤكدة")}</label>
        <select id={`pr-accommodation-${request.id}`} value={accommodationType} onChange={(event) => setAccommodationType(event.target.value as AccommodationType)}>
          {accommodationOptions.map((option) => <option key={option.value} value={option.value}>{tr(option.english, option.arabic)}</option>)}
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
