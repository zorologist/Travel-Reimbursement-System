import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SalaryReviewPanel } from "../components/salary/SalaryReviewPanel";
import {
  formatSalaryDateRange,
  salaryMoney,
} from "../components/salary/salaryFormat";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../hooks/useAuth";
import {
  salaryApi,
  type SalaryAdjustmentInput,
  type SalaryQueueItem,
} from "../services/salaryApi";
import "../styles/salary.css";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load the salary review queue.";
}

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
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

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
          <h1>Salary Dashboard</h1>
          <p>EGAS · Salary management &amp; travel finalization</p>
        </div>
        <nav className="salary-nav" aria-label="Salary navigation">
          <span aria-current="page">Overview</span>
          <Link to="/home">Main menu</Link>
        </nav>
        <div className="salary-user">
          <span className="salary-avatar" aria-hidden="true">
            {initials(user?.displayName ?? "Salary User")}
          </span>
          <span>
            <strong>{user?.displayName}</strong>
            <small>Salary administrator</small>
          </span>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {import.meta.env.DEV && (
        <div className="salary-development-notice" role="status">
          Development data is active. Production actions will use the salary API endpoints.
        </div>
      )}

      {loading ? (
        <main className="salary-state"><LoadingState message="Loading salary review queue..." /></main>
      ) : error ? (
        <main className="salary-state"><ErrorState message={error} onRetry={() => void loadQueue()} /></main>
      ) : (
        <main className="salary-dashboard">
          <section className="salary-main-content">
            <section className="salary-stats" aria-label="Salary review summary">
              <article className="salary-stat-card">
                <span>Review queue</span>
                <div><strong>{queue.length}</strong><b>Pending</b></div>
                <p>Select a row to open its verified calculation.</p>
              </article>
              <article className="salary-stat-card">
                <span>Completed</span>
                <div><strong>{completedThisSession}</strong><b className="salary-success">This session</b></div>
                <p>Requests finalized since this page was opened.</p>
              </article>
              <article className="salary-stat-card">
                <span>Pending official value</span>
                <div><strong>{salaryMoney.format(pendingTotal)} <small>EGP</small></strong></div>
                <p>Across {queue.length} verified request{queue.length === 1 ? "" : "s"}.</p>
              </article>
            </section>

            <section className="salary-queue-section" aria-labelledby="salary-queue-title">
              <header className="salary-queue-header">
                <h2 id="salary-queue-title">
                  Salary review queue <span>{queue.length} pending</span>
                </h2>
                <div>
                  <label>
                    <span className="salary-sr-only">Search requests</span>
                    <input
                      type="search"
                      value={search}
                      placeholder="Search employee or request"
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <button type="button" onClick={() => void loadQueue()}>Refresh</button>
                </div>
              </header>

              {queue.length === 0 ? (
                <EmptyState
                  title="Salary queue is clear"
                  description="There are no requests waiting for salary finalization."
                />
              ) : filteredQueue.length === 0 ? (
                <EmptyState
                  title="No matching requests"
                  description="Try a different request ID, employee, department, or destination."
                />
              ) : (
                <div className="salary-table-wrap">
                  <table className="salary-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Employee</th>
                        <th>Destination</th>
                        <th>Travel dates</th>
                        <th>Official total</th>
                        <th>Status</th>
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
                              aria-label={`Review request ${item.id}`}
                              onClick={() => setSelectedId(item.id)}
                            >
                              {item.id}
                            </button>
                          </td>
                          <td><strong>{item.employee.displayName}</strong><small>{item.employee.department}</small></td>
                          <td>{item.destinationCity}</td>
                          <td>{formatSalaryDateRange(item.departureAt, item.returnAt)}</td>
                          <td className="salary-table-money">{salaryMoney.format(item.calculation.totalAmount)} <small>EGP</small></td>
                          <td><span className="salary-status">Pending</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <footer className="salary-queue-footer">
                Showing <strong>{filteredQueue.length}</strong> of <strong>{queue.length}</strong> requests
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
                title="Select a request"
                description="Choose a pending request to verify its calculation and finalize payment."
              />
            </aside>
          )}
        </main>
      )}
    </div>
  );
}
