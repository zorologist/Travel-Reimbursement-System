// Development sign-in lives here until it is replaced by the company's authentication system.
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logoUrl from "../../EGAS.png";
import { useAuth } from "../hooks/useAuth";
import "../styles/login.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    let authenticatedUser;
    try {
      authenticatedUser = await login(employeeNumber, password, remember);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
      return;
    } finally {
      setSubmitting(false);
    }
    if (!authenticatedUser) {
      setError("Invalid development employee number or password.");
      return;
    }

    navigate(authenticatedUser.roles.includes("salary") ? "/salary" : "/home");
  }

  return (
    <main className="login-page">
      <header className="top-bar">
        <img src={logoUrl} alt="EGAS" />
      </header>

      <section className="login-container" aria-labelledby="login-title">
        <div className="logo-area">
          <img src={logoUrl} alt="EGAS logo" />
        </div>

        <h1 id="login-title">Welcome Back</h1>
        <p className="subtitle">Please sign in to your EGAS account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Employee Number</label>
            <input
              type="text"
              id="username"
              name="username"
              value={employeeNumber}
              onChange={(event) => {
                setEmployeeNumber(event.target.value);
                setError("");
              }}
              autoComplete="username"
              required
              placeholder="Enter your development employee number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
            />
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Remember me
            </label>
            <span className="login-access-note">Development access</span>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {import.meta.env.DEV && (
          <details className="login-demo-accounts">
            <summary>Development accounts</summary>
            <p>Employee: DEV001 / Employee@123</p>
            <p>Manager: DEV004 / Admin@123</p>
            <p>PR: DEV005 · Transportation: DEV006 · Timing: DEV007 · Salary: DEV008</p>
            <small>All department accounts use Admin@123.</small>
          </details>
        )}

        <p className="footer-text">© 2026 EGAS. All rights reserved.</p>
      </section>
    </main>
  );
}
