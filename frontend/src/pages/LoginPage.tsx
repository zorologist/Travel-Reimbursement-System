// Development sign-in lives here until it is replaced by the company's authentication system.
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logoUrl from "../../EGAS.png";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import "../styles/login.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { tr, localizeError } = useLanguage();
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
      setError(localizeError(loginError, "Unable to sign in.", "تعذر تسجيل الدخول."));
      return;
    } finally {
      setSubmitting(false);
    }
    if (!authenticatedUser) {
      setError(tr("Invalid development employee number or password.", "رقم الموظف أو كلمة المرور غير صحيحة."));
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

        <h1 id="login-title">{tr("Welcome Back", "مرحباً بعودتك")}</h1>
        <p className="subtitle">{tr("Please sign in to your EGAS account", "يرجى تسجيل الدخول إلى حساب إيجاس")}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{tr("Employee Number", "رقم الموظف")}</label>
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
              placeholder={tr("Enter your development employee number", "أدخل رقم الموظف الخاص ببيئة التطوير")}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{tr("Password", "كلمة المرور")}</label>
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
              placeholder={tr("Enter your password", "أدخل كلمة المرور")}
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
              {tr("Remember me", "تذكرني")}
            </label>
            <span className="login-access-note">{tr("Development access", "دخول بيئة التطوير")}</span>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? tr("Signing in...", "جارٍ تسجيل الدخول...") : tr("Sign In", "تسجيل الدخول")}
          </button>
        </form>

        {import.meta.env.DEV && (
          <details className="login-demo-accounts">
            <summary>{tr("Development accounts", "حسابات التطوير")}</summary>
            <p>{tr("Employee", "موظف")}: DEV001 / Employee@123</p>
            <p>{tr("Manager", "مدير")}: DEV004 / Admin@123</p>
            <p>{tr("PR", "العلاقات العامة")}: DEV005 · {tr("Transportation", "الانتقالات")}: DEV006 · {tr("Timing", "المواعيد")}: DEV007 · {tr("Salary", "الرواتب")}: DEV008</p>
            <small>{tr("All department accounts use Admin@123.", "تستخدم جميع حسابات الأقسام كلمة المرور Admin@123.")}</small>
          </details>
        )}

        <p className="footer-text">{tr("© 2026 EGAS. All rights reserved.", "© 2026 إيجاس. جميع الحقوق محفوظة.")}</p>
      </section>
    </main>
  );
}
