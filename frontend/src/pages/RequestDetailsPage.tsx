import { Link, useParams } from "react-router-dom";
import logoUrl from "../../EGAS.png";
import "../styles/requestTracker.css";

type StepState = "done" | "current" | "pending";

const steps: Array<{
  label: string;
  meta: string;
  state: StepState;
  tag: string;
}> = [
  { label: "تم التقديم", meta: "15/07/2026", state: "done", tag: "تم إرسال الطلب" },
  { label: "مراجعة المدير المباشر", meta: "12:40 – 10/07/2026", state: "done", tag: "موافقة دون ملاحظات" },
  { label: "العلاقات العامة", meta: "11/07 – 7/07/2026", state: "done", tag: "تم الاعتماد" },
  { label: "قسم النقل", meta: "09:50 – 12/07/2026", state: "done", tag: "إعداد بدل النقل" },
  { label: "مراجعة التوقيتات", meta: "قيد المراجعة الآن", state: "current", tag: "بانتظار الحضور" },
  { label: "تسوية الرواتب", meta: "لم يبدأ بعد", state: "pending", tag: "لم يبدأ بعد" },
  { label: "الاعتماد المالي المباشر", meta: "لم يبدأ بعد", state: "pending", tag: "لم يبدأ بعد" },
];

function StepMarker({ state, number }: { state: StepState; number: number }) {
  if (state === "done") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (state === "current") {
    return <span className="tracker-marker-dots" aria-label="المرحلة الحالية">•••</span>;
  }

  return <span>{number}</span>;
}

export function RequestDetailsPage() {
  const { id = "EGAS-2026-0742" } = useParams();

  return (
    <div className="request-tracker-page" lang="ar" dir="rtl">
      <header className="tracker-topbar">
        <div>
          <h1>نظام تتبع الطلبات</h1>
          <p>إدارة شؤون الموظفين – EGAS</p>
        </div>
        <div className="tracker-request-badge">طلب رقم <strong>{id}</strong></div>
      </header>

      <main className="tracker-layout">
        <aside className="tracker-sidebar">
          <div className="tracker-logo-wrap">
            <div className="tracker-logo-circle"><img src={logoUrl} alt="شعار EGAS" /></div>
            <p>الشركة المصرية القابضة للغازات الطبيعية</p>
          </div>

          <section className="tracker-request-info" aria-labelledby="request-info-title">
            <h2 id="request-info-title">بيانات الطلب</h2>
            <InfoRow label="القسم" value="شؤون الموظفين" />
            <InfoRow label="رقم الطلب" value={id} />
            <InfoRow label="تاريخ التقديم" value="10 يوليو 2026" />
          </section>

          <div className="tracker-promo">
            <label className="tracker-toggle">
              <input type="checkbox" defaultChecked aria-label="تفعيل الرسائل الإرشادية" />
              <span><i /></span>
            </label>
            <p>معًا نحو خدمة أسرع وأوضح</p>
          </div>
          <p className="tracker-footnote">نظام تتبع الطلبات الداخلي – الإصدار 2.0</p>
          <p className="tracker-footnote">إدارة شؤون الموظفين – EGAS</p>
        </aside>

        <section className="tracker-panel">
          <div className="tracker-summary">
            <div>
              <p className="tracker-eyebrow">بيانات الوردية</p>
              <h2>القاهرة – الإسكندرية</h2>
              <p className="tracker-muted">10 يونيو – 14 يوليو 2026</p>
            </div>
            <div>
              <p className="tracker-eyebrow">حالة إتمام الطلب</p>
              <span className="tracker-status">● &nbsp; قيد التنفيذ</span>
            </div>
            <div>
              <p className="tracker-progress-label">المرحلة 5 من 7 – تم اعتماد 4 مراحل</p>
              <div className="tracker-progress" role="progressbar" aria-valuenow={57} aria-valuemin={0} aria-valuemax={100}>
                <span />
              </div>
              <p className="tracker-muted">5 أيام متبقية</p>
            </div>
          </div>

          <div className="tracker-timeline-block">
            <h2>الدورة المستندية للطلب</h2>
            <p className="tracker-muted">من التقديم حتى الاعتماد المالي المباشر</p>
            <ol className="tracker-timeline">
              {steps.map((step, index) => (
                <li key={step.label} data-state={step.state}>
                  <span className="tracker-step-marker"><StepMarker state={step.state} number={index + 1} /></span>
                  <strong>{step.label}</strong>
                  <span className={`tracker-step-tag tracker-step-tag--${step.state}`}>{step.tag}</span>
                  <small>{step.meta}</small>
                </li>
              ))}
            </ol>
          </div>

          <div className="tracker-note">
            <span aria-hidden="true">ⓘ</span>
            <div><strong>ملاحظة على المرحلة الحالية</strong><p>يرجى التحقق من سجل الحضور والانصراف مقابل تواريخ العمل قبل تحويل الطلب إلى تسوية الرواتب.</p></div>
          </div>
        </section>
      </main>

      <footer className="tracker-footer">
        <span>EGAS © 2026</span>
        <span>آخر تحديث: 17 يونيو 2026 – 10:56 مساءً</span>
        <Link to="/dashboard">العودة إلى لوحة التحكم</Link>
      </footer>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="tracker-info-row"><span /><div><small>{label}</small><strong>{value}</strong></div></div>;
}
