import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SalaryReviewPanel } from "../components/salary/SalaryReviewPanel";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { BackButton } from "../components/ui/BackButton";
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

type SalaryTab = "track" | "check-request" | "salary";

function initials(displayName: string): string {
  return displayName
    .replace(/\([^)]*\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Prevents commas/quotes and spreadsheet formulas from escaping a CSV cell. */
export function safeCsvCell(value: string | number): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "0";
  const formulaSafe = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

function exportToExcel(items: SalaryQueueItem[]) {
  const headers = [
    "م",
    "رقم العامل",
    "الاسم",
    "الوظيفة",
    "الإدارة",
    "الجهة / غرض المأمورية",
    "المدينة",
    "من",
    "إلى",
    "عدد الليالي",
    "وقت الذهاب",
    "وقت العودة",
    "وسيلة الانتقال",
    "الإقامة",
    "بدل السفر",
    "بدل الانتقال",
    "فروق / إضافة",
    "الخصم",
    "الإجمالي",
  ];

  const csvRows = [
    ["تقرير بدل السفر والانتقالات للموظفين — الشركة المصرية القابضة للغازات الطبيعية (إيجاس)"].join(","),
    [],
    headers.join(","),
  ];

  items.forEach((item, index) => {
    const travelAllowance = item.calculation.overnightAmount + item.calculation.sameDayAmount + item.calculation.returnDayAmount;
    const departureDate = item.departureAt.slice(0, 10);
    const returnDate = item.returnAt.slice(0, 10);
    const depTime = new Date(item.departureAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: true });
    const retTime = new Date(item.returnAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: true });

    const row = [
      index + 1,
      safeCsvCell(item.employee.employeeNumber),
      safeCsvCell(item.employee.displayName),
      safeCsvCell(localizeLabel(item.employee.jobLevel, "ar")),
      safeCsvCell(item.employee.department),
      safeCsvCell(item.notes || "مأمورية عمل"),
      safeCsvCell(localizeLabel(item.destinationCity, "ar")),
      safeCsvCell(departureDate),
      safeCsvCell(returnDate),
      item.calculation.overnightCount,
      safeCsvCell(depTime),
      safeCsvCell(retTime),
      safeCsvCell(localizeLabel(item.transportationMethod, "ar")),
      safeCsvCell(localizeLabel(item.accommodationType, "ar")),
      travelAllowance,
      item.calculation.transportationCost,
      item.calculation.bonusAmount,
      item.calculation.penaltyAmount,
      item.calculation.totalAmount,
    ];
    csvRows.push(row.join(","));
  });

  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `تقرير_بدل_السفر_والانتقالات_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function SalaryDashboardPage() {
  const { user, logout } = useAuth();
  const { language, localizeError, tr } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SalaryTab>("track");

  // Each tab keeps its own queue + selected id + search + loading + error state,
  // so a bug or stale data in one tab can never clobber another tab's view.
  const [trackQueue, setTrackQueue] = useState<SalaryQueueItem[]>([]);
  const [trackSelectedId, setTrackSelectedId] = useState<string | null>(null);
  const [trackSearch, setTrackSearch] = useState("");
  const [trackLoading, setTrackLoading] = useState(true);
  const [trackError, setTrackError] = useState("");

  const [checkQueue, setCheckQueue] = useState<SalaryQueueItem[]>([]);
  const [checkSelectedId, setCheckSelectedId] = useState<string | null>(null);
  const [checkSearch, setCheckSearch] = useState("");
  const [checkLoading, setCheckLoading] = useState(true);
  const [checkError, setCheckError] = useState("");

  const [salaryQueue, setSalaryQueue] = useState<SalaryQueueItem[]>([]);
  const [salarySelectedId, setSalarySelectedId] = useState<string | null>(null);
  const [salarySearch, setSalarySearch] = useState("");
  const [salaryLoading, setSalaryLoading] = useState(true);
  const [salaryError, setSalaryError] = useState("");

  const [completedThisSession, setCompletedThisSession] = useState(0);

  const loadTrack = useCallback(async () => {
    setTrackLoading(true);
    setTrackError("");
    try {
      const list = await salaryApi.getTrackList();
      setTrackQueue(list);
      setTrackSelectedId((current) =>
        current && list.some((item) => item.id === current) ? current : (list[0]?.id ?? null),
      );
    } catch (loadError) {
      setTrackError(localizeError(loadError, "Unable to load the Track queue.", "تعذر تحميل قائمة التتبع."));
    } finally {
      setTrackLoading(false);
    }
  }, [localizeError]);

  const loadCheck = useCallback(async () => {
    setCheckLoading(true);
    setCheckError("");
    try {
      const list = await salaryApi.getCheckRequestList();
      setCheckQueue(list);
      setCheckSelectedId((current) =>
        current && list.some((item) => item.id === current) ? current : (list[0]?.id ?? null),
      );
    } catch (loadError) {
      setCheckError(localizeError(loadError, "Unable to load the Check Request queue.", "تعذر تحميل قائمة طلبات المراجعة."));
    } finally {
      setCheckLoading(false);
    }
  }, [localizeError]);

  const loadSalary = useCallback(async () => {
    setSalaryLoading(true);
    setSalaryError("");
    try {
      const list = await salaryApi.getSalaryList();
      setSalaryQueue(list);
      setSalarySelectedId((current) =>
        current && list.some((item) => item.id === current) ? current : (list[0]?.id ?? null),
      );
    } catch (loadError) {
      setSalaryError(localizeError(loadError, "Unable to load the Payroll queue.", "تعذر تحميل قائمة الرواتب."));
    } finally {
      setSalaryLoading(false);
    }
  }, [localizeError]);

  useEffect(() => {
    void loadTrack();
  }, [loadTrack]);
  useEffect(() => {
    if (activeTab === "check-request") void loadCheck();
  }, [activeTab, loadCheck]);
  useEffect(() => {
    if (activeTab === "salary") void loadSalary();
  }, [activeTab, loadSalary]);

  // The selected request for the side panel always belongs to the active tab.
  const queue = activeTab === "track" ? trackQueue : activeTab === "check-request" ? checkQueue : salaryQueue;
  const selectedId = activeTab === "track" ? trackSelectedId : activeTab === "check-request" ? checkSelectedId : salarySelectedId;
  const search = activeTab === "track" ? trackSearch : activeTab === "check-request" ? checkSearch : salarySearch;
  const loading = activeTab === "track" ? trackLoading : activeTab === "check-request" ? checkLoading : salaryLoading;
  const error = activeTab === "track" ? trackError : activeTab === "check-request" ? checkError : salaryError;
  const setSelectedId = activeTab === "track" ? setTrackSelectedId : activeTab === "check-request" ? setCheckSelectedId : setSalarySelectedId;
  const setSearch = activeTab === "track" ? setTrackSearch : activeTab === "check-request" ? setCheckSearch : setSalarySearch;
  const reload = activeTab === "track" ? loadTrack : activeTab === "check-request" ? loadCheck : loadSalary;

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
    setTrackQueue((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setCheckQueue((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSalaryQueue((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function finalizeRequest(note: string): Promise<void> {
    if (!selectedRequest) return;
    const finalizedId = selectedRequest.id;
    const finalized = await salaryApi.finalize(finalizedId, note);
    setTrackQueue((current) => current.map((item) => item.id === finalizedId ? finalized : item));
    setCheckQueue((current) => {
      const remaining = current.filter((item) => item.id !== finalizedId);
      setCheckSelectedId((selection) => selection === finalizedId ? (remaining[0]?.id ?? null) : selection);
      return remaining;
    });
    setSalaryQueue((current) => [finalized, ...current.filter((item) => item.id !== finalizedId)]);
    setSalarySelectedId(finalizedId);
    setCompletedThisSession((count) => count + 1);
  }

  function signOut() {
    void logout();
    navigate("/login", { replace: true });
  }

  const loadingState = loading;
  const errorState = error;

  return (
    <div className="salary-page">
      <header className="salary-navbar">
        <div className="salary-navbar-start">
          <BackButton />
          <div className="salary-brand">
            <h1>{tr("Payroll Dashboard", "لوحة تحكم الرواتب")}</h1>
            <p>{tr("EGAS · Payroll management & travel finalization", "إيجاس · إدارة الرواتب والاعتماد النهائي للسفر")}</p>
          </div>
        </div>
        <nav className="salary-nav" aria-label={tr("Payroll navigation", "التنقل في الرواتب")}>
          <span aria-current="page">{tr("Overview", "نظرة عامة")}</span>
          <Link to="/home">{tr("Main menu", "القائمة الرئيسية")}</Link>
        </nav>
        <div className="salary-user">
          <span className="salary-avatar" aria-hidden="true">
            {initials(user?.displayName ?? tr("Payroll User", "مسؤول الرواتب"))}
          </span>
          <span>
            <strong>{user?.displayName}</strong>
            <small>{tr("Payroll administrator", "مسؤول الرواتب")}</small>
          </span>
          <button type="button" onClick={signOut}>{tr("Sign out", "تسجيل الخروج")}</button>
        </div>
      </header>

      {useDevelopmentRepository && (
        <div className="salary-development-notice" role="status">
          {tr("The browser-only development repository is active for this session.", "مستودع التطوير الخاص بالمتصفح نشط لهذه الجلسة.")}
        </div>
      )}

      <div className="salary-tabs" role="tablist" aria-label={tr("Payroll dashboard sections", "أقسام لوحة الرواتب")}>
        <button type="button" role="tab" aria-selected={activeTab === "track"} className={`salary-tab ${activeTab === "track" ? "is-active" : ""}`} onClick={() => setActiveTab("track")}>
          {tr("Track", "التتبع")}
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "check-request"} className={`salary-tab ${activeTab === "check-request" ? "is-active" : ""}`} onClick={() => setActiveTab("check-request")}>
          {tr("Check Request", "طلبات المراجعة")}
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "salary"} className={`salary-tab ${activeTab === "salary" ? "is-active" : ""}`} onClick={() => setActiveTab("salary")}>
          {tr("Payroll", "الرواتب")}
        </button>
      </div>

      {loadingState ? (
        <main className="salary-state"><LoadingState message={tr("Loading salary review queue...", "جارٍ تحميل قائمة مراجعة الرواتب...")} /></main>
      ) : errorState ? (
        <main className="salary-state"><ErrorState message={errorState} onRetry={() => void reload()} /></main>
      ) : (
        <main className="salary-dashboard">
          <section className="salary-main-content">
            <section className="salary-stats" aria-label={tr("Payroll review summary", "ملخص مراجعة الرواتب")}>
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
                  {tr("Payroll review queue", "قائمة مراجعة الرواتب")} <span>{queue.length} {tr("requests", "طلبات")}</span>
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
                  <button type="button" onClick={() => void reload()}>{tr("Refresh", "تحديث")}</button>
                  <button
                    type="button"
                    style={{ backgroundColor: "#059669", color: "#ffffff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontWeight: 600, cursor: "pointer", marginLeft: "0.5rem" }}
                    onClick={() => exportToExcel(filteredQueue)}
                  >
                    📊 {tr("Export to Excel", "تصدير إلى إكسيل")}
                  </button>
                </div>
              </header>

              {queue.length === 0 ? (
                <EmptyState
                  title={tr("Payroll queue is clear", "قائمة الرواتب خالية")}
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
                          <td>{formatDate(item.departureAt, language)}{item.tripType === "one-way" ? "" : ` – ${formatDate(item.returnAt, language)}`}</td>
                          <td className="salary-table-money">{formatCurrency(item.calculation.totalAmount, language)}</td>
                          <td><span className="salary-status">{localizeLabel(item.status === "completed" ? "completed" : item.stage, language)}</span></td>
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
