import { useState } from "react";
import { Link } from "react-router-dom";

import { RequestList } from "../components/requests/RequestList";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useRequests } from "../hooks/useRequests";
import type { RequestStatus } from "../services/requestApi";
import { useLanguage } from "../hooks/useLanguage";
import { localizeLabel } from "../i18n/format";
import "../styles/requests.css";

type Filter = "all" | RequestStatus;

export default function MyRequestsPage() {
  const { requests, loading, error, refetch } = useRequests();
  const { language, tr } = useLanguage();
  const [filter, setFilter] = useState<Filter>("all");
  const filteredRequests = requests.filter((request) => filter === "all" || request.status === filter);

  return (
    <main className="content-page requests-page">
      <header className="page-heading">
        <div><h1>{tr("My travel requests", "طلبات السفر الخاصة بي")}</h1><p>{tr("Follow each request from submission through final salary confirmation.", "تابع كل طلب من الإرسال وحتى الاعتماد النهائي للرواتب.")}</p></div>
        <Link className="primary-link" to="/requests/new">{tr("New request", "طلب جديد")}</Link>
      </header>

      <div className="request-filters" aria-label={tr("Filter requests", "تصفية الطلبات")}>
        {(["all", "in-progress", "completed", "cancelled"] as const).map((value) => (
          <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
            {value === "all" ? tr("All", "الكل") : localizeLabel(value, language)}
          </button>
        ))}
      </div>

      {loading ? <LoadingState message={tr("Loading your travel requests...", "جارٍ تحميل طلبات السفر...")} /> : error ? <ErrorState message={error} onRetry={() => void refetch()} /> : <RequestList requests={filteredRequests} />}
    </main>
  );
}
