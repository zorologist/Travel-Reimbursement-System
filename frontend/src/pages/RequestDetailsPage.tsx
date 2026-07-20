import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { AuditEvent, WorkflowStage } from "@travel-reimbursement/shared";

import logoUrl from "../../EGAS.png";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { requestApi, type RequestDetailsResponse } from "../services/requestApi";
import "../styles/requestTracker.css";

type StepState = "done" | "current" | "pending";

const workflowSteps: Array<{ stage: WorkflowStage | "submitted"; label: string }> = [
  { stage: "submitted", label: "تم التقديم" },
  { stage: "manager-review", label: "مراجعة المدير المباشر" },
  { stage: "pr-review", label: "العلاقات العامة" },
  { stage: "transportation-review", label: "قسم النقل" },
  { stage: "timing-review", label: "مراجعة التوقيتات" },
  { stage: "salary-finalization", label: "تسوية الرواتب" },
  { stage: "completed", label: "اكتمال الطلب" },
];

const stageLabels: Record<WorkflowStage, string> = {
  "manager-review": "مراجعة المدير",
  "pr-review": "مراجعة العلاقات العامة",
  "transportation-review": "مراجعة النقل",
  "timing-review": "مراجعة التوقيتات",
  "salary-finalization": "تسوية الرواتب",
  completed: "مكتمل",
  cancelled: "ملغي",
};

function formatDate(value: string, includeTime = false): string {
  return new Intl.DateTimeFormat("ar-EG", includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(new Date(value));
}

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

function stepTag(request: RequestDetailsResponse, state: StepState, index: number): string {
  if (index === 0) return "تم إرسال الطلب";
  if (request.stage === "cancelled" && workflowSteps[index]?.stage === rejectedStage(request)) return "تم الرفض";
  if (state === "done") return "تم الاعتماد";
  if (state === "current") return "قيد المراجعة";
  return "لم يبدأ بعد";
}

function StepMarker({ state, number }: { state: StepState; number: number }) {
  if (state === "done") {
    return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (state === "current") return <span className="tracker-marker-dots" aria-label="المرحلة الحالية">•••</span>;
  return <span>{number}</span>;
}

export function RequestDetailsPage() {
  const { id = "" } = useParams();
  const [request, setRequest] = useState<RequestDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequest(await requestApi.getRequest(id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل بيانات الطلب.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const steps = useMemo(() => request ? workflowSteps.map((step, index) => {
    const state = stepState(request, index);
    const event = eventForStep(request.auditEvents, step.stage);
    return {
      ...step,
      state,
      tag: stepTag(request, state, index),
      meta: event ? formatDate(event.createdAt, true) : state === "current" ? "قيد المراجعة الآن" : "لم يبدأ بعد",
    };
  }) : [], [request]);

  if (loading) return <main className="ui-page"><LoadingState message="جاري تحميل تفاصيل الطلب..." /></main>;
  if (error || !request) return <main className="ui-page"><ErrorState message={error || "الطلب غير موجود."} onRetry={() => void load()} /></main>;

  const completedSteps = steps.filter((step) => step.state === "done").length;
  const activeStep = Math.max(1, steps.findIndex((step) => step.state === "current") + 1 || steps.length);
  const progress = request.stage === "cancelled" ? Math.round((completedSteps / steps.length) * 100) : Math.round((activeStep / steps.length) * 100);
  const statusClass = request.status === "completed" ? "tracker-status--completed" : request.status === "cancelled" ? "tracker-status--cancelled" : "";

  return (
    <div className="request-tracker-page" lang="ar" dir="rtl">
      <header className="tracker-topbar">
        <div><h1>نظام تتبع الطلبات</h1><p>إدارة شؤون الموظفين – EGAS</p></div>
        <div className="tracker-request-badge">طلب رقم <strong>{request.id}</strong></div>
      </header>

      <main className="tracker-layout">
        <aside className="tracker-sidebar">
          <div className="tracker-logo-wrap"><div className="tracker-logo-circle"><img src={logoUrl} alt="شعار EGAS" /></div><p>الشركة المصرية القابضة للغازات الطبيعية</p></div>
          <section className="tracker-request-info" aria-labelledby="request-info-title">
            <h2 id="request-info-title">بيانات الطلب</h2>
            <InfoRow label="الموظف" value={request.employee.displayName} />
            <InfoRow label="القسم" value={request.employee.department} />
            <InfoRow label="رقم الموظف" value={request.employee.employeeNumber} />
            <InfoRow label="رقم الطلب" value={request.id} />
            <InfoRow label="تاريخ التقديم" value={formatDate(request.createdAt)} />
          </section>
          <div className="tracker-promo"><label className="tracker-toggle"><input type="checkbox" defaultChecked aria-label="تفعيل الرسائل الإرشادية" /><span><i /></span></label><p>معًا نحو خدمة أسرع وأوضح</p></div>
          <p className="tracker-footnote">نظام تتبع الطلبات الداخلي – الإصدار 2.0</p>
          <p className="tracker-footnote">إدارة شؤون الموظفين – EGAS</p>
        </aside>

        <section className="tracker-panel">
          <div className="tracker-summary">
            <div><p className="tracker-eyebrow">بيانات المأمورية</p><h2>{request.originCity} – {request.destinationCity}</h2><p className="tracker-muted">{formatDate(request.departureAt)} – {formatDate(request.returnAt)}</p></div>
            <div><p className="tracker-eyebrow">حالة إتمام الطلب</p><span className={`tracker-status ${statusClass}`}>● &nbsp; {stageLabels[request.stage]}</span></div>
            <div><p className="tracker-progress-label">المرحلة {activeStep} من {steps.length} – تم اعتماد {completedSteps} مراحل</p><div className="tracker-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><p className="tracker-muted">آخر تحديث: {formatDate(request.updatedAt, true)}</p></div>
          </div>

          <div className="tracker-timeline-block">
            <h2>الدورة المستندية للطلب</h2><p className="tracker-muted">من التقديم حتى تسوية الرواتب واكتمال الطلب</p>
            <ol className="tracker-timeline">{steps.map((step, index) => <li key={step.stage} data-state={step.state}><span className="tracker-step-marker"><StepMarker state={step.state} number={index + 1} /></span><strong>{step.label}</strong><span className={`tracker-step-tag tracker-step-tag--${step.state}`}>{step.tag}</span><small>{step.meta}</small></li>)}</ol>
          </div>

          <div className={`tracker-note ${request.status === "cancelled" ? "tracker-note--cancelled" : request.status === "completed" ? "tracker-note--completed" : ""}`}>
            <span aria-hidden="true">ⓘ</span>
            <div><strong>{request.status === "cancelled" ? "سبب إلغاء الطلب" : request.status === "completed" ? "تم إغلاق الطلب" : "ملاحظة على المرحلة الحالية"}</strong><p>{request.status === "cancelled" ? request.cancellationReason : request.status === "completed" ? `تم اعتماد مبلغ نهائي قدره ${request.finalPrice?.toFixed(2) ?? "0.00"} جنيه مصري.` : `الطلب الآن لدى ${stageLabels[request.stage]}. ${request.notes || "لا توجد ملاحظات إضافية."}`}</p></div>
          </div>

          <section className="tracker-details-grid" aria-label="تفاصيل المأمورية">
            <InfoCard label="وسيلة الانتقال" value={request.transportationMethod} />
            <InfoCard label="نوع الإقامة" value={request.accommodationType.replaceAll("-", " ")} />
            <InfoCard label="ملاحظات الطلب" value={request.notes || "لا توجد ملاحظات"} />
          </section>

          <section className="tracker-audit" aria-labelledby="tracker-audit-title">
            <h2 id="tracker-audit-title">سجل إجراءات الطلب</h2>
            <ul>{request.auditEvents.slice().reverse().map((event) => <li key={event.id}><span><strong>{event.action}</strong><small>{event.actorRole}</small></span><div><p>{event.note || `${event.fromStage ?? "بداية الطلب"} ← ${event.toStage}`}</p><time dateTime={event.createdAt}>{formatDate(event.createdAt, true)}</time></div></li>)}</ul>
          </section>
        </section>
      </main>

      <footer className="tracker-footer"><span>EGAS © 2026</span><span>آخر تحديث: {formatDate(request.updatedAt, true)}</span><span><Link to="/my-requests">طلباتي</Link> · <Link to="/dashboard">العودة إلى لوحة التحكم</Link></span></footer>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="tracker-info-row"><span /><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <article><small>{label}</small><strong>{value}</strong></article>;
}
