import { useState } from "react";

import { workflowApi, type ApprovalQueueItem } from "../../services/workflowApi";

function inputDate(value: string) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

function isoDate(value: string): string {
  return value ? new Date(value).toISOString() : "";
}

export function missionNightCount(departureAt: string, returnAt: string): number | null {
  const departure = new Date(departureAt);
  const arrival = new Date(returnAt);
  if (!Number.isFinite(departure.getTime()) || !Number.isFinite(arrival.getTime()) || arrival <= departure) return null;
  const departureDay = Date.UTC(departure.getUTCFullYear(), departure.getUTCMonth(), departure.getUTCDate());
  const arrivalDay = Date.UTC(arrival.getUTCFullYear(), arrival.getUTCMonth(), arrival.getUTCDate());
  return Math.max(0, Math.round((arrivalDay - departureDay) / 86_400_000));
}

export function TimingReviewForm({ request, onAction }: { request: ApprovalQueueItem; onAction: (action: () => Promise<void>) => Promise<void> }) {
  const [departureAt, setDepartureAt] = useState(request.requestDetails.departureAt ?? "");
  const [returnAt, setReturnAt] = useState(request.requestDetails.returnAt ?? "");
  const [meetsSevenHourRule, setMeetsSevenHourRule] = useState(true);
  const nightCount = missionNightCount(departureAt, returnAt);

  return (
    <div className="timing-review-form form-panel">
      <h3>Timing &amp; Hours Review</h3>
      <div className="form-group">
        <label>Verified departure time</label>
        <input type="datetime-local" value={inputDate(departureAt)} onChange={(event) => setDepartureAt(isoDate(event.target.value))} />
      </div>
      <div className="form-group">
        <label>Verified return time</label>
        <input type="datetime-local" value={inputDate(returnAt)} onChange={(event) => setReturnAt(isoDate(event.target.value))} />
      </div>
      <div className={`mission-duration ${nightCount === 0 ? "same-day" : nightCount === null ? "invalid" : "overnight"}`} aria-live="polite">
        <strong>Mission duration</strong>
        {nightCount === null ? (
          <span>Enter a valid return time after the departure time.</span>
        ) : nightCount === 0 ? (
          <span>Same-day travel — 1 day, 0 nights</span>
        ) : (
          <span>Overnight travel — {nightCount} {nightCount === 1 ? "night" : "nights"}</span>
        )}
      </div>
      <label className="checkbox-group">
        <input type="checkbox" checked={meetsSevenHourRule} onChange={(event) => setMeetsSevenHourRule(event.target.checked)} />
        Verified attendance meets the seven-hour allowance rule
      </label>
      <button disabled={nightCount === null} className="btn-approve" type="button" onClick={() => void onAction(() => workflowApi.approve(request.id, { departureAt, returnAt, meetsSevenHourRule, reason: "Attendance dates and qualifying hours verified." }))}>
        Approve &amp; Pass to Salary
      </button>
    </div>
  );
}
