// Development sign-in lives here until it is replaced by the company's authentication system.
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logoUrl from "../../EGAS.png";
import "../styles/login.css";

export function LoginPage() {
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Authentication will be added when the development login API is ready.
    navigate("/dashboard");
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
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="username"
              required
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
            />
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" name="remember" />
              Remember me
            </label>
            <button className="forgot-password" type="button">
              Forgot password?
            </button>
          </div>

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        <p className="footer-text">© 2026 EGAS. All rights reserved.</p>
      </section>
    </main>
  );
}
