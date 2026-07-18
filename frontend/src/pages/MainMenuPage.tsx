import { Link, Navigate, useNavigate } from "react-router-dom";
import logoUrl from "../../EGAS.png";
import {
  clearDevelopmentSession,
  getDevelopmentUser,
} from "../services/developmentAuth";
import "../styles/mainMenu.css";

export function MainMenuPage() {
  const navigate = useNavigate();
  const user = getDevelopmentUser();

  if (!user) return <Navigate to="/login" replace />;

  const administrativeRole = user.roles.find((role) => role !== "employee");
  const roleLabel = administrativeRole
    ? `${administrativeRole[0].toUpperCase()}${administrativeRole.slice(1)} & Employee`
    : "Employee";

  function handleSignOut() {
    clearDevelopmentSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="main-menu-page">
      <header className="main-menu-topbar">
        <Link className="main-menu-brand" to="/home" aria-label="EGAS home">
          <img src={logoUrl} alt="EGAS" />
          <span>
            <strong>EGAS</strong>
            <small>Travel Reimbursement System</small>
          </span>
        </Link>

        <div className="main-menu-account">
          <span>
            <strong>{user.displayName}</strong>
            <small>{roleLabel}</small>
          </span>
          <button className="main-menu-signout" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="main-menu-content">
        <section className="main-menu-intro" aria-labelledby="main-menu-title">
          <p className="main-menu-eyebrow">{roleLabel} Services</p>
          <h1 id="main-menu-title">What would you like to do?</h1>
          <p>
            Start a new travel request or open your dashboard to follow existing
            requests and their current approval stage.
          </p>
        </section>

        <section className="main-menu-actions" aria-label="Available actions">
          <Link className="main-menu-card main-menu-card--new" to="/requests/new">
            <span className="main-menu-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="main-menu-card-copy">
              <small>Travel services</small>
              <strong>New Travel Request</strong>
              <span>Create and submit a new request for approval.</span>
            </span>
            <span className="main-menu-card-arrow" aria-hidden="true">
              →
            </span>
          </Link>

          <Link className="main-menu-card main-menu-card--dashboard" to="/dashboard">
            <span className="main-menu-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
              </svg>
            </span>
            <span className="main-menu-card-copy">
              <small>Request overview</small>
              <strong>Open Dashboard</strong>
              <span>Track current requests and review previous activity.</span>
            </span>
            <span className="main-menu-card-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </section>

        <p className="main-menu-help">
          Select one of the options above to continue.
        </p>
      </main>

      <footer className="main-menu-footer">
        <span>© 2026 EGAS. All rights reserved.</span>
        <span>Internal employee portal</span>
      </footer>
    </div>
  );
}
