import { useState } from "react";

import { workflowApi, type ApprovalQueueItem } from "../../services/workflowApi";
import { useLanguage } from "../../hooks/useLanguage";

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
  const { tr } = useLanguage();
  const [departureAt, setDepartureAt] = useState(request.requestDetails.departureAt ?? "");
  const [returnAt, setReturnAt] = useState(request.requestDetails.returnAt ?? "");
  const [meetsSevenHourRule, setMeetsSevenHourRule] = useState(true);
  const [comment, setComment] = useState("");
  const isOneWay = request.requestDetails.tripType === "one-way";
  const nightCount = isOneWay ? 0 : missionNightCount(departureAt, returnAt);

  return (
    <div className="timing-review-form form-panel">
      <h3>{tr("Timing & Hours Review", "مراجعة المواعيد والساعات")}</h3>
      <div className="form-group">
        <label>{tr("Verified departure time", "وقت الذهاب المؤكد")}</label>
        <input type="datetime-local" value={inputDate(departureAt)} onChange={(event) => setDepartureAt(isoDate(event.target.value))} />
      </div>
      {!isOneWay && <div className="form-group">
        <label>{tr("Verified return time", "وقت العودة المؤكد")}</label>
        <input type="datetime-local" value={inputDate(returnAt)} onChange={(event) => setReturnAt(isoDate(event.target.value))} />
      </div>}
      <div className={`mission-duration ${nightCount === 0 ? "same-day" : nightCount === null ? "invalid" : "overnight"}`} aria-live="polite">
        <strong>{tr("Mission duration", "مدة المأمورية")}</strong>
        {isOneWay ? (
          <span>{tr("One-way trip — departure time verification only", "رحلة اتجاه واحد — يتم التحقق من وقت المغادرة فقط")}</span>
        ) : nightCount === null ? (
          <span>{tr("Enter a valid return time after the departure time.", "أدخل وقت عودة صحيحاً بعد وقت الذهاب.")}</span>
        ) : nightCount === 0 ? (
          <span>{tr("Same-day travel — 1 day, 0 nights", "سفر في نفس اليوم — يوم واحد، بدون مبيت")}</span>
        ) : (
          <span>{tr(`Overnight travel — ${nightCount} ${nightCount === 1 ? "night" : "nights"}`, `سفر بمبيت — ${nightCount} ${nightCount === 1 ? "ليلة" : "ليالٍ"}`)}</span>
        )}
      </div>
      {!isOneWay && <label className="checkbox-group">
        <input type="checkbox" checked={meetsSevenHourRule} onChange={(event) => setMeetsSevenHourRule(event.target.checked)} />
        {tr("Verified attendance meets the seven-hour allowance rule", "تم التحقق من أن الحضور يستوفي قاعدة بدل السبع ساعات")}
      </label>}
      <div className="form-group"><label htmlFor={`timing-comment-${request.id}`}>{tr("Timing comment", "تعليق المواعيد")}</label><textarea id={`timing-comment-${request.id}`} rows={4} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={tr("Add a review comment...", "أضف تعليق المراجعة...")} /></div>
      <div className="form-actions-row" style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button disabled={nightCount === null} className="btn-approve" type="button" onClick={() => void onAction(() => workflowApi.approve(request.id, { departureAt, ...(isOneWay ? {} : { returnAt, meetsSevenHourRule }), reason: comment.trim() || tr("Attendance dates and qualifying hours verified.", "تم التحقق من تواريخ الحضور والساعات المستحقة.") }))}>
          {tr("Approve & Pass to Payroll", "اعتماد وتحويل إلى الرواتب")}
        </button>
        <button
          className="btn-reject"
          type="button"
          style={{ backgroundColor: "#dc2626", color: "#ffffff", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, border: "none", cursor: "pointer" }}
          onClick={() => {
            const reason = comment.trim() || prompt(tr("Please enter a rejection reason:", "يرجى إدخال سبب الرفض:"));
            if (!reason) return;
            void onAction(() => workflowApi.reject(request.id, reason));
          }}
        >
          {tr("Reject Request", "رفض الطلب")}
        </button>
      </div>
    </div>
  );
}
