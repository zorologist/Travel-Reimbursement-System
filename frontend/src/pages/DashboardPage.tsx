import { Link } from "react-router-dom";

import { LoadingState } from "../components/ui/LoadingState";
import { useAuth } from "../hooks/useAuth";
import { useRequests } from "../hooks/useRequests";
import "../styles/dashboard.css";

export function DashboardPage() {
  const { user } = useAuth();
  const { requests, loading } = useRequests();
  const inProgress = requests.filter((request) => request.status === "in-progress").length;
  const completed = requests.filter((request) => request.status === "completed").length;
  const cancelled = requests.filter((request) => request.status === "cancelled").length;
  const latest = requests.slice(0, 3);
  const reviewRole = user?.roles.find((role) => ["manager", "pr", "transportation", "timing"].includes(role));

  if (loading) return <LoadingState message="Preparing your dashboard..." />;

  return (
    <main className="content-page dashboard-page">
      <header className="page-heading">
        <div><h1>Welcome, {user?.displayName.replace(/\s*\(Demo.*\)$/, "")}</h1><p>Here is the current status of your travel work.</p></div>
        <Link className="primary-link" to="/requests/new">Create request</Link>
      </header>
      <section className="dashboard-stats" aria-label="Request summary">
        <article><span>Total requests</span><strong>{requests.length}</strong></article>
        <article><span>In progress</span><strong>{inProgress}</strong></article>
        <article><span>Completed</span><strong>{completed}</strong></article>
        <article><span>Cancelled</span><strong>{cancelled}</strong></article>
      </section>
      <section className="dashboard-grid">
        <article className="dashboard-panel">
          <header><div><h2>Recent requests</h2><p>Your latest submitted missions</p></div><Link to="/my-requests">View all</Link></header>
          {latest.length === 0 ? <p>No requests submitted yet.</p> : (
            <ul>{latest.map((request) => <li key={request.id}><Link to={`/requests/${request.id}`}><span><strong>{request.destinationCity}</strong><small>{request.id}</small></span><b data-status={request.status}>{request.status.replace("-", " ")}</b></Link></li>)}</ul>
          )}
        </article>
        <aside className="dashboard-panel dashboard-actions">
          <h2>Workspaces</h2>
          <Link to="/requests/new"><strong>New travel request</strong><span>Submit a mission for approval →</span></Link>
          {reviewRole && <Link to="/approvals"><strong>{reviewRole} review queue</strong><span>Process department requests →</span></Link>}
          {user?.roles.includes("salary") && <Link to="/salary"><strong>Salary finalization</strong><span>Review official amounts →</span></Link>}
        </aside>
      </section>
    </main>
  );
}
