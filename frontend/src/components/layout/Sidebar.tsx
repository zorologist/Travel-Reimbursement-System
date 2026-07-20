import { NavLink } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

const reviewRoles = ["manager", "pr", "transportation", "timing"] as const;

export function Sidebar() {
  const { user } = useAuth();
  const canReview = reviewRoles.some((role) => user?.roles.includes(role));

  return (
    <aside className="app-sidebar" aria-label="Main navigation">
      <nav>
        <NavLink to="/dashboard">Overview</NavLink>
        <NavLink to="/requests/new">New request</NavLink>
        <NavLink to="/my-requests">My requests</NavLink>
        {canReview && <NavLink to="/approvals">Department queue</NavLink>}
        {user?.roles.includes("salary") && <NavLink to="/salary">Salary queue</NavLink>}
      </nav>
      <p>Development workspace<br /><small>Connected to authenticated feature APIs.</small></p>
    </aside>
  );
}
