import { useState } from "react";
import { Link } from "react-router-dom";

import { RequestList } from "../components/requests/RequestList";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useRequests } from "../hooks/useRequests";
import type { RequestStatus } from "../services/requestApi";
import "../styles/requests.css";

type Filter = "all" | RequestStatus;

export default function MyRequestsPage() {
  const { requests, loading, error, refetch } = useRequests();
  const [filter, setFilter] = useState<Filter>("all");
  const filteredRequests = requests.filter((request) => filter === "all" || request.status === filter);

  return (
    <main className="content-page requests-page">
      <header className="page-heading">
        <div><h1>My travel requests</h1><p>Follow each request from submission through final salary confirmation.</p></div>
        <Link className="primary-link" to="/requests/new">New request</Link>
      </header>

      <div className="request-filters" aria-label="Filter requests">
        {(["all", "in-progress", "completed", "cancelled"] as const).map((value) => (
          <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
            {value === "all" ? "All" : value.replace("-", " ")}
          </button>
        ))}
      </div>

      {loading ? <LoadingState message="Loading your travel requests..." /> : error ? <ErrorState message={error} onRetry={() => void refetch()} /> : <RequestList requests={filteredRequests} />}
    </main>
  );
}
