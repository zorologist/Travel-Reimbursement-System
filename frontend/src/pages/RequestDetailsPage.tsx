import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { AuditEvent, WorkflowStage } from "@travel-reimbursement/shared";

import logoUrl from "../../EGAS.png";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { requestApi, type RequestDetailsResponse } from "../services/requestApi";
import { useLanguage } from "../hooks/useLanguage";
import { formatCurrency, formatDate, formatDateTime, localizeLabel } from "../i18n/format";
import "../styles/requestTracker.css";

type StepState = "done" | "current" | "pending";

const workflowSteps: Array<{ stage: WorkflowStage | "submitted" }> = [
  { stage: "submitted" },
  { stage: "manager-review" },
  { stage: "pr-review" },
  { stage: "transportation-review" },
  { stage: "timing-review" },
  { stage: "salary-finalization" },
  { stage: "completed" },
];

function eventForStep(events: readonly AuditEvent[], stage: WorkflowStage | "submitted") {
  if (stage === "submitted") return events.find((event) => event.action === "submit");
  if (stage === "completed") return events.find((event) => event.toStage === "completed");
  return events.find((event) => event.fromStage === stage && ["approve", "reject", "finalize"].includes(event.action));
}

function rejectedStage(request: RequestDetailsResponse): WorkflowStage | null {
  return request.auditEvents.find((event) => event.action === "reject")?.fromStage ?? null;
}

function stepState(request: RequestDetailsResponse, index: number): StepState {
  if (index === 0) return "done";
  if (request.stage === "completed") return "done";

  const rejected = rejectedStage(request);
  const comparisonStage = rejected ?? request.stage;
  const comparisonIndex = workflowSteps.findIndex((step) => step.stage === comparisonStage);
  if (index < comparisonIndex) return "done";
  if (index === comparisonIndex) return "current";
  return "pending";
}

function stepTag(request: RequestDetailsResponse, state: StepState, index: number, tr: (english: string, arabic: string) => string): string {
  if (index === 0) return tr("Request submitted", "تم إرسال الطلب");
  if (request.stage === "cancelled" && workflowSteps[index]?.stage === rejectedStage(request)) return tr("Rejected", "تم الرفض");
  if (state === "done") return tr("Approved", "تم الاعتماد");
  if (state === "current") return tr("Under review", "قيد المراجعة");
  return tr("Not started", "لم يبدأ بعد");
}

function StepMarker({ state, number, currentLabel }: { state: StepState; number: number; currentLabel: string }) {
  if (state === "done") {
    return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (state === "current") return <span className="tracker-marker-dots" aria-label={currentLabel}>•••</span>;
  return <span>{number}</span>;
}

export function RequestDetailsPage() {
  const { id = "" } = useParams();
  const { direction, language, localizeError, tr } = useLanguage();
  const [request, setRequest] = useState<RequestDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequest(await requestApi.getRequest(id));
    } catch (loadError) {
      setError(localizeError(loadError, "Unable to load the request details.", "تعذر تحميل بيانات الطلب."));
    } finally {
      setLoading(false);
    }
  }, [id, localizeError]);

  useEffect(() => { void load(); }, [load]);

  const steps = useMemo(() => request ? workflowSteps.map((step, index) => {
    const state = stepState(request, index);
    const event = eventForStep(request.auditEvents, step.stage);
    return {
      ...step,
      state,
      label: step.stage === "submitted" ? tr("Submitted", "تم التقديم") : localizeLabel(step.stage, language),
      tag: stepTag(request, state, index, tr),
      meta: event ? formatDateTime(event.createdAt, language) : state === "current" ? tr("Under review now", "قيد المراجعة الآن") : tr("Not started", "لم يبدأ بعد"),
    };
  }) : [], [language, request, tr]);

  if (loading) return <main className="ui-page"><LoadingState message={tr("Loading request details...", "جاري تحميل تفاصيل الطلب...")} /></main>;
  if (error || !request) return <main className="ui-page"><ErrorState message={error || tr("Request not found.", "الطلب غير موجود.")} onRetry={() => void load()} /></main>;

  const completedSteps = steps.filter((step) => step.state === "done").length;
  const activeStep = Math.max(1, steps.findIndex((step) => step.state === "current") + 1 || steps.length);
  const progress = request.stage === "cancelled" ? Math.round((completedSteps / steps.length) * 100) : Math.round((activeStep / steps.length) * 100);
  const statusClass = request.status === "completed" ? "tracker-status--completed" : request.status === "cancelled" ? "tracker-status--cancelled" : "";

  return (
    <div className="request-tracker-page" lang={language} dir={direction}>
      <header className="tracker-topbar">
        <div><h1>{tr("Request Tracking System", "نظام تتبع الطلبات")}</h1><p>{tr("Employee Affairs – EGAS", "إدارة شؤون الموظفين – EGAS")}</p></div>
        <div className="tracker-request-badge">{tr("Request No.", "طلب رقم")} <strong>{request.id}</strong></div>
      </header>

      <main className="tracker-layout">
        <aside className="tracker-sidebar">
          <div className="tracker-logo-wrap"><div className="tracker-logo-circle"><img src={logoUrl} alt={tr("EGAS logo", "شعار EGAS")} /></div><p>{tr("Egyptian Natural Gas Holding Company", "الشركة المصرية القابضة للغازات الطبيعية")}</p></div>
          <section className="tracker-request-info" aria-labelledby="request-info-title">
            <h2 id="request-info-title">{tr("Request information", "بيانات الطلب")}</h2>
            <InfoRow label={tr("Employee", "الموظف")} value={request.employee.displayName} />
            <InfoRow label={tr("Department", "القسم")} value={request.employee.department} />
            <InfoRow label={tr("Employee number", "رقم الموظف")} value={request.employee.employeeNumber} />
            <InfoRow label={tr("Request number", "رقم الطلب")} value={request.id} />
            <InfoRow label={tr("Submission date", "تاريخ التقديم")} value={formatDate(request.createdAt, language)} />
          </section>
          <div className="tracker-promo"><label className="tracker-toggle"><input type="checkbox" defaultChecked aria-label={tr("Enable guidance messages", "تفعيل الرسائل الإرشادية")} /><span><i /></span></label><p>{tr("Together for faster, clearer service", "معًا نحو خدمة أسرع وأوضح")}</p></div>
          <p className="tracker-footnote">{tr("Internal Request Tracking System – Version 2.0", "نظام تتبع الطلبات الداخلي – الإصدار 2.0")}</p>
          <p className="tracker-footnote">{tr("Employee Affairs – EGAS", "إدارة شؤون الموظفين – EGAS")}</p>
        </aside>

        <section className="tracker-panel">
          <div className="tracker-summary">
            <div><p className="tracker-eyebrow">{tr("Mission information", "بيانات المأمورية")}</p><h2>{localizeLabel(request.originCity, language)} – {localizeLabel(request.destinationCity, language)}</h2><p className="tracker-muted">{formatDate(request.departureAt, language)} – {formatDate(request.returnAt, language)}</p></div>
            <div><p className="tracker-eyebrow">{tr("Request status", "حالة إتمام الطلب")}</p><span className={`tracker-status ${statusClass}`}>● &nbsp; {localizeLabel(request.stage, language)}</span></div>
            <div><p className="tracker-progress-label">{tr(`Stage ${activeStep} of ${steps.length} – ${completedSteps} stages approved`, `المرحلة ${activeStep} من ${steps.length} – تم اعتماد ${completedSteps} مراحل`)}</p><div className="tracker-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><p className="tracker-muted">{tr("Last updated", "آخر تحديث")}: {formatDateTime(request.updatedAt, language)}</p></div>
          </div>

          <div className="tracker-timeline-block">
            <h2>{tr("Request document workflow", "الدورة المستندية للطلب")}</h2><p className="tracker-muted">{tr("From submission through salary settlement and completion", "من التقديم حتى تسوية الرواتب واكتمال الطلب")}</p>
            <ol className="tracker-timeline">{steps.map((step, index) => <li key={step.stage} data-state={step.state}><span className="tracker-step-marker"><StepMarker state={step.state} number={index + 1} currentLabel={tr("Current stage", "المرحلة الحالية")} /></span><strong>{step.label}</strong><span className={`tracker-step-tag tracker-step-tag--${step.state}`}>{step.tag}</span><small>{step.meta}</small></li>)}</ol>
          </div>

          <div className={`tracker-note ${request.status === "cancelled" ? "tracker-note--cancelled" : request.status === "completed" ? "tracker-note--completed" : ""}`}>
            <span aria-hidden="true">ⓘ</span>
            <div><strong>{request.status === "cancelled" ? tr("Cancellation reason", "سبب إلغاء الطلب") : request.status === "completed" ? tr("Request closed", "تم إغلاق الطلب") : tr("Current stage note", "ملاحظة على المرحلة الحالية")}</strong><p>{request.status === "cancelled" ? request.cancellationReason : request.status === "completed" ? tr(`A final amount of ${formatCurrency(request.finalPrice ?? 0, language)} was approved.`, `تم اعتماد مبلغ نهائي قدره ${formatCurrency(request.finalPrice ?? 0, language)}.`) : tr(`The request is now with ${localizeLabel(request.stage, language)}. ${request.notes || "No additional notes."}`, `الطلب الآن لدى ${localizeLabel(request.stage, language)}. ${request.notes || "لا توجد ملاحظات إضافية."}`)}</p></div>
          </div>

          <section className="tracker-details-grid" aria-label={tr("Mission details", "تفاصيل المأمورية")}>
            <InfoCard label={tr("Transportation", "وسيلة الانتقال")} value={localizeLabel(request.transportationMethod, language)} />
            <InfoCard label={tr("Accommodation type", "نوع الإقامة")} value={localizeLabel(request.accommodationType, language)} />
            <InfoCard label={tr("Request notes", "ملاحظات الطلب")} value={request.notes || tr("No notes", "لا توجد ملاحظات")} />
          </section>

          <section className="tracker-audit" aria-labelledby="tracker-audit-title">
            <h2 id="tracker-audit-title">{tr("Request action history", "سجل إجراءات الطلب")}</h2>
            <ul>{request.auditEvents.slice().reverse().map((event) => <li key={event.id}><span><strong>{localizeLabel(event.action, language)}</strong><small>{localizeLabel(event.actorRole, language)}</small></span><div><p>{event.note || `${event.fromStage ? localizeLabel(event.fromStage, language) : tr("Request started", "بداية الطلب")} ← ${localizeLabel(event.toStage, language)}`}</p><time dateTime={event.createdAt}>{formatDateTime(event.createdAt, language)}</time></div></li>)}</ul>
          </section>
        </section>
      </main>

      <footer className="tracker-footer"><span>EGAS © 2026</span><span>{tr("Last updated", "آخر تحديث")}: {formatDateTime(request.updatedAt, language)}</span><span><Link to="/my-requests">{tr("My requests", "طلباتي")}</Link> · <Link to="/dashboard">{tr("Back to dashboard", "العودة إلى لوحة التحكم")}</Link></span></footer>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="tracker-info-row"><span /><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <article><small>{label}</small><strong>{value}</strong></article>;
}
