import { useState } from "react";
import { calculateSalary, type AccommodationType } from "@travel-reimbursement/shared";

import { PriceComparison } from "../pricing/PriceComparison";
import { workflowApi, type ApprovalQueueItem } from "../../services/workflowApi";

export function PrReviewForm({ request, onAction }: { request: ApprovalQueueItem; onAction: (action: () => Promise<void>) => Promise<void> }) {
  const [accommodationType, setAccommodationType] = useState<AccommodationType>(request.requestDetails.accommodationType ?? "none");
  const [comment, setComment] = useState("");
  const details = request.requestDetails;
  const departure = new Date(details.departureAt ?? "");
  const arrival = new Date(details.returnAt ?? "");
  const overnightCount = Math.max(0, Math.round((Date.UTC(arrival.getUTCFullYear(), arrival.getUTCMonth(), arrival.getUTCDate()) - Date.UTC(departure.getUTCFullYear(), departure.getUTCMonth(), departure.getUTCDate())) / 86_400_000));
  const preview = calculateSalary({ jobLevel: request.employeeJobLevel, accommodationType, overnightCount, isSameDayMission: overnightCount === 0, sameDayVerifiedHours: details.verifiedSameDayHours ?? 0, returnDayVerifiedHours: details.verifiedReturnDayHours ?? 0, transportationCost: details.transportationCost ?? 0, bonusAmount: details.bonusAmount ?? 0, penaltyAmount: details.penaltyAmount ?? 0 });

  return (
    <div className="pr-review-form form-panel">
      <h3>PR &amp; Accommodation Review</h3>
      <div className="form-group">
        <label htmlFor={`pr-accommodation-${request.id}`}>Confirmed accommodation</label>
        <select id={`pr-accommodation-${request.id}`} value={accommodationType} onChange={(event) => setAccommodationType(event.target.value as AccommodationType)}>
          <option value="none">Employee arranged / none</option>
          <option value="room-only">Company room only</option>
          <option value="room-and-food">Company room and food</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor={`pr-comment-${request.id}`}>PR review comment</label>
        <textarea
          id={`pr-comment-${request.id}`}
          rows={4}
          maxLength={1000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Add a comment about the accommodation or PR review..."
        />
        <small className="form-help">The comment is saved in the request audit history.</small>
      </div>
      <PriceComparison originalPrice={request.currentPrice} newPrice={preview.totalAmount} />
      <button
        className="btn-approve"
        type="button"
        onClick={() => void onAction(() => workflowApi.approve(request.id, {
          accommodationType,
          reason: comment.trim() || "Accommodation verified by PR.",
        }))}
      >
        Approve &amp; Pass to Transportation
      </button>
    </div>
  );
}
