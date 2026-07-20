import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SalaryReviewPanel } from "../components/salary/SalaryReviewPanel";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { formatCurrency, formatDate, localizeLabel } from "../i18n/format";
import {
  salaryApi,
  type SalaryAdjustmentInput,
  type SalaryQueueItem,
} from "../services/salaryApi";
import { useDevelopmentRepository } from "../services/runtimeMode";
import "../styles/salary.css";

function initials(displayName: string): string {
  return displayName
    .replace(/\([^)]*\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function SalaryDashboardPage() {
  const { user, logout } = useAuth();
  const { language, localizeError, tr } = useLanguage();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<SalaryQueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [completedThisSession, setCompletedThisSession] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextQueue = await salaryApi.listQueue();
      setQueue(nextQueue);
      setSelectedId((current) =>
        current && nextQueue.some((item) => item.id === current)
          ? current
          : (nextQueue[0]?.id ?? null),
      );
    } catch (loadError) {
      setError(localizeError(loadError, "Unable to load the salary review queue.", "تعذر تحميل قائمة مراجعة الرواتب."));
    } finally {
      setLoading(false);
    }
  }, [localizeError]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const selectedRequest = queue.find((item) => item.id === selectedId) ?? null;
  const filteredQueue = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return queue;
    return queue.filter((item) =>
      [
        item.id,
        item.employee.displayName,
        item.employee.employeeNumber,
        item.employee.department,
        item.destinationCity,
      ].some((value) => value.toLowerCase().includes(normalizedSearch)),
    );
  }, [queue, search]);
  const pendingTotal = queue.reduce(
    (total, item) => total + item.calculation.totalAmount,
    0,
  );

  async function saveAdjustments(input: SalaryAdjustmentInput): Promise<void> {
    if (!selectedRequest) return;
    const updated = await salaryApi.updateAdjustments(selectedRequest.id, input);
    setQueue((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function finalizeRequest(note: string): Promise<void> {
    if (!selectedRequest) return;
    const finalizedId = selectedRequest.id;
    await salaryApi.finalize(finalizedId, note);
    setQueue((current) => {
      const remaining = current.filter((item) => item.id !== finalizedId);
      setSelectedId((currentSelection) =>
        currentSelection === finalizedId
          ? (remaining[0]?.id ?? null)
          : currentSelection,
      );
      return remaining;
    });
    setCompletedThisSession((count) => count + 1);
  }

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="salary-page">
      <header className="salary-navbar">
        <div className="salary-brand">
          <h1>{tr("Salary Dashboard", "لوحة تحكم الرواتب")}</h1>
          <p>{tr("EGAS · Salary management & travel finalization", "إيجاس · إدارة الرواتب والاعتماد النهائي للسفر")}</p>
        </div>
        <nav className="salary-nav" aria-label={tr("Salary navigation", "التنقل في الرواتب")}>
          <span aria-current="page">{tr("Overview", "نظرة عامة")}</span>
          <Link to="/home">{tr("Main menu", "القائمة الرئيسية")}</Link>
        </nav>
        <div className="salary-user">
          <span className="salary-avatar" aria-hidden="true">
            {initials(user?.displayName ?? tr("Salary User", "مسؤول الرواتب"))}
          </span>
          <span>
            <strong>{user?.displayName}</strong>
            <small>{tr("Salary administrator", "مسؤول الرواتب")}</small>
          </span>
          <button type="button" onClick={signOut}>{tr("Sign out", "تسجيل الخروج")}</button>
        </div>
      </header>

      {useDevelopmentRepository && (
        <div className="salary-development-notice" role="status">
          {tr("The browser-only development repository is active for this session.", "مستودع التطوير الخاص بالمتصفح نشط لهذه الجلسة.")}
        </div>
      )}

      {loading ? (
        <main className="salary-state"><LoadingState message={tr("Loading salary review queue...", "جارٍ تحميل قائمة مراجعة الرواتب...")} /></main>
      ) : error ? (
        <main className="salary-state"><ErrorState message={error} onRetry={() => void loadQueue()} /></main>
      ) : (
        <main className="salary-dashboard">
          <section className="salary-main-content">
            <section className="salary-stats" aria-label={tr("Salary review summary", "ملخص مراجعة الرواتب")}>
              <article className="salary-stat-card">
                <span>{tr("Review queue", "قائمة المراجعة")}</span>
                <div><strong>{queue.length}</strong><b>{tr("Pending", "معلق")}</b></div>
                <p>{tr("Select a row to open its verified calculation.", "اختر صفاً لفتح الحساب الذي تم التحقق منه.")}</p>
              </article>
              <article className="salary-stat-card">
                <span>{tr("Completed", "مكتمل")}</span>
                <div><strong>{completedThisSession}</strong><b className="salary-success">{tr("This session", "هذه الجلسة")}</b></div>
                <p>{tr("Requests finalized since this page was opened.", "الطلبات التي تم اعتمادها منذ فتح هذه الصفحة.")}</p>
              </article>
              <article className="salary-stat-card">
                <span>{tr("Pending official value", "القيمة الرسمية المعلقة")}</span>
                <div><strong>{formatCurrency(pendingTotal, language)}</strong></div>
                <p>{tr(`Across ${queue.length} verified request${queue.length === 1 ? "" : "s"}.`, `لعدد ${queue.length} من الطلبات التي تم التحقق منها.`)}</p>
              </article>
            </section>

            <section className="salary-queue-section" aria-labelledby="salary-queue-title">
              <header className="salary-queue-header">
                <h2 id="salary-queue-title">
                  {tr("Salary review queue", "قائمة مراجعة الرواتب")} <span>{queue.length} {tr("pending", "معلق")}</span>
                </h2>
                <div>
                  <label>
                    <span className="salary-sr-only">{tr("Search requests", "البحث في الطلبات")}</span>
                    <input
                      type="search"
                      value={search}
                      placeholder={tr("Search employee or request", "ابحث عن موظف أو طلب")}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <button type="button" onClick={() => void loadQueue()}>{tr("Refresh", "تحديث")}</button>
                </div>
              </header>

              {queue.length === 0 ? (
                <EmptyState
                  title={tr("Salary queue is clear", "قائمة الرواتب خالية")}
                  description={tr("There are no requests waiting for salary finalization.", "لا توجد طلبات تنتظر الاعتماد النهائي للرواتب.")}
                />
              ) : filteredQueue.length === 0 ? (
                <EmptyState
                  title={tr("No matching requests", "لا توجد طلبات مطابقة")}
                  description={tr("Try a different request ID, employee, department, or destination.", "جرّب رقم طلب أو موظف أو قسم أو وجهة مختلفة.")}
                />
              ) : (
                <div className="salary-table-wrap">
                  <table className="salary-table">
                    <thead>
                      <tr>
                        <th>{tr("Request ID", "رقم الطلب")}</th>
                        <th>{tr("Employee", "الموظف")}</th>
                        <th>{tr("Destination", "الوجهة")}</th>
                        <th>{tr("Travel dates", "تواريخ السفر")}</th>
                        <th>{tr("Official total", "الإجمالي الرسمي")}</th>
                        <th>{tr("Status", "الحالة")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQueue.map((item) => (
                        <tr
                          key={item.id}
                          className={item.id === selectedId ? "salary-row--selected" : undefined}
                          onClick={() => setSelectedId(item.id)}
                        >
                          <td>
                            <button
                              type="button"
                              className="salary-row-select"
                              aria-label={tr(`Review request ${item.id}`, `مراجعة الطلب ${item.id}`)}
                              onClick={() => setSelectedId(item.id)}
                            >
                              {item.id}
                            </button>
                          </td>
                          <td><strong>{item.employee.displayName}</strong><small>{item.employee.department}</small></td>
                          <td>{localizeLabel(item.destinationCity, language)}</td>
                          <td>{formatDate(item.departureAt, language)} – {formatDate(item.returnAt, language)}</td>
                          <td className="salary-table-money">{formatCurrency(item.calculation.totalAmount, language)}</td>
                          <td><span className="salary-status">{tr("Pending", "معلق")}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <footer className="salary-queue-footer">
                {tr("Showing", "عرض")} <strong>{filteredQueue.length}</strong> {tr("of", "من")} <strong>{queue.length}</strong> {tr("requests", "طلبات")}
              </footer>
            </section>
          </section>

          {selectedRequest ? (
            <SalaryReviewPanel
              key={selectedRequest.id}
              request={selectedRequest}
              onSave={saveAdjustments}
              onFinalize={finalizeRequest}
            />
          ) : (
            <aside className="salary-review salary-review--empty">
              <EmptyState
                title={tr("Select a request", "اختر طلباً")}
                description={tr("Choose a pending request to verify its calculation and finalize payment.", "اختر طلباً معلقاً للتحقق من حسابه واعتماد الدفع.")}
              />
            </aside>
          )}
        </main>
      )}
    </div>
  );
}
