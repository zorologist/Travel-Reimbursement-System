// Role-specific summaries and the user's main starting actions will belong on this page.
import { Link } from "react-router-dom";

export function DashboardPage() {
  return (
    <main>
      <h1>Travel Reimbursement System</h1>
      <p>The dashboard will be implemented after development authentication.</p>
      <Link to="/requests/new">Create a new travel request</Link>
      <br />
      <Link to="/requests/EGAS-2026-0742">
        Open active request EGAS-2026-0742
      </Link>
      <br />
      <Link to="/login">Return to login</Link>
    </main>
  );
}
