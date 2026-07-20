import { Link } from "react-router-dom";

import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { useRequests } from "../hooks/useRequests";
import { useLanguage } from "../hooks/useLanguage";
import { localizeLabel } from "../i18n/format";
import "../styles/dashboard.css";

export function DashboardPage() {
  const { user } = useAuth();
  const { language, tr } = useLanguage();
  const { requests, loading } = useRequests();
  const inProgress = requests.filter((request) => request.status === "in-progress").length;
  const completed = requests.filter((request) => request.status === "completed").length;
  const cancelled = requests.filter((request) => request.status === "cancelled").length;
  const latest = requests.slice(0, 3);
  const reviewRole = user?.roles.find((role) => ["manager", "pr", "transportation", "timing"].includes(role));

  if (loading) return <LoadingState message={tr("Preparing your dashboard...", "جارٍ تجهيز لوحة التحكم...")} />;

  return (
    <main className="content-page dashboard-page">
      <header className="page-heading">
        <div><h1>{tr("Welcome", "مرحباً")}, {user?.displayName.replace(/\s*\(Demo.*\)$/, "")}</h1><p>{tr("Here is the current status of your travel work.", "إليك الحالة الحالية لطلبات السفر الخاصة بك.")}</p></div>
        <Link className="primary-link" to="/requests/new">{tr("Create request", "إنشاء طلب")}</Link>
      </header>
      <section className="dashboard-stats" aria-label={tr("Request summary", "ملخص الطلبات")}>
        <article><span>{tr("Total requests", "إجمالي الطلبات")}</span><strong>{requests.length}</strong></article>
        <article><span>{tr("In progress", "قيد التنفيذ")}</span><strong>{inProgress}</strong></article>
        <article><span>{tr("Completed", "مكتمل")}</span><strong>{completed}</strong></article>
        <article><span>{tr("Cancelled", "ملغي")}</span><strong>{cancelled}</strong></article>
      </section>
      <section className="dashboard-grid">
        <article className="dashboard-panel">
          <header><div><h2>{tr("Recent requests", "أحدث الطلبات")}</h2><p>{tr("Your latest submitted missions", "أحدث المأموريات المرسلة")}</p></div><Link to="/my-requests">{tr("View all", "عرض الكل")}</Link></header>
          {latest.length === 0 ? <p>{tr("No requests submitted yet.", "لم يتم إرسال أي طلبات بعد.")}</p> : (
            <ul>{latest.map((request) => <li key={request.id}><Link to={`/requests/${request.id}`}><span><strong>{request.destinationCity}</strong><small>{request.id}</small></span><b data-status={request.status}>{localizeLabel(request.status, language)}</b></Link></li>)}</ul>
          )}
        </article>
        <aside className="dashboard-panel dashboard-actions">
          <h2>{tr("Workspaces", "مساحات العمل")}</h2>
          <Link to="/requests/new"><strong>{tr("New travel request", "طلب سفر جديد")}</strong><span>{tr("Submit a mission for approval →", "إرسال مأمورية للاعتماد ←")}</span></Link>
          {reviewRole && <Link to="/approvals"><strong>{tr(`${localizeLabel(reviewRole, "en")} review queue`, `قائمة مراجعة ${localizeLabel(reviewRole, "ar")}`)}</strong><span>{tr("Process department requests →", "معالجة طلبات القسم ←")}</span></Link>}
          {user?.roles.includes("salary") && <Link to="/salary"><strong>{tr("Salary finalization", "اعتماد الرواتب")}</strong><span>{tr("Review official amounts →", "مراجعة المبالغ الرسمية ←")}</span></Link>}
        </aside>
      </section>
    </main>
  );
}
