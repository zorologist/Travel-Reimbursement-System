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
  const [showPassword, setShowPassword] = useState(false);
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

    navigate("/home");
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
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
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
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-controls="password"
                aria-pressed={showPassword}
                aria-label={showPassword ? tr("Hide password", "إخفاء كلمة المرور") : tr("Show password", "إظهار كلمة المرور")}
              >
                {showPassword ? tr("Hide", "إخفاء") : tr("Show", "إظهار")}
              </button>
            </div>
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

        <div className="demo-quick-login-section mt-6 border-t border-gray-200 pt-4 text-center">
          <p className="text-xs font-semibold text-gray-500 mb-2">{tr("Quick Demo Sign-In (Select Role)", "تسجيل دخول سريع لبيئة التطوير (اختر الدور)")}</p>
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <button
              type="button"
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => { setEmployeeNumber("admin"); setPassword("admin"); }}
            >
              👑 {tr("Manager / Admin (DEV004)", "مدير / مسؤول (DEV004)")}
            </button>
            <button
              type="button"
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => { setEmployeeNumber("pr"); setPassword("admin"); }}
            >
              🏢 {tr("PR Admin (DEV005)", "مسؤول العلاقات العامة (DEV005)")}
            </button>
            <button
              type="button"
              className="bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => { setEmployeeNumber("transportation"); setPassword("admin"); }}
            >
              🚗 {tr("Transportation Admin (DEV006)", "مسؤول الانتقالات (DEV006)")}
            </button>
            <button
              type="button"
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => { setEmployeeNumber("timing"); setPassword("admin"); }}
            >
              ⏱️ {tr("Timing Admin (DEV007)", "مسؤول المواعيد (DEV007)")}
            </button>
            <button
              type="button"
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => { setEmployeeNumber("payroll"); setPassword("admin"); }}
            >
              💰 {tr("Payroll Admin (DEV008)", "مسؤول الرواتب (DEV008)")}
            </button>
            <button
              type="button"
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-3 py-1.5 rounded-lg transition-colors"
              onClick={() => { setEmployeeNumber("employee"); setPassword("employee"); }}
            >
              👤 {tr("Employee (DEV001)", "موظف (DEV001)")}
            </button>
          </div>
        </div>

        {import.meta.env.DEV && (
          <details className="login-demo-accounts mt-4 text-xs text-gray-500">
            <summary className="cursor-pointer font-medium">{tr("Accepted usernames & passwords", "أسماء المستخدمين وكلمات المرور المقبولة")}</summary>
            <div className="p-2 bg-gray-50 rounded mt-1 text-left space-y-1">
              <p>• <strong>{tr("Admin / Manager", "مدير/مسؤول")}</strong>: <code>admin</code> or <code>DEV004</code> / <code>Admin@123</code> or <code>admin</code></p>
              <p>• <strong>{tr("PR Admin", "مسؤول العلاقات العامة")}</strong>: <code>pr</code> or <code>DEV005</code> / <code>Admin@123</code> or <code>admin</code></p>
              <p>• <strong>{tr("Transportation Admin", "مسؤول الانتقالات")}</strong>: <code>transportation</code> or <code>DEV006</code> / <code>Admin@123</code> or <code>admin</code></p>
              <p>• <strong>{tr("Timing Admin", "مسؤول المواعيد")}</strong>: <code>timing</code> or <code>DEV007</code> / <code>Admin@123</code> or <code>admin</code></p>
              <p>• <strong>{tr("Payroll Admin", "مسؤول الرواتب")}</strong>: <code>payroll</code> or <code>DEV008</code> / <code>Admin@123</code> or <code>admin</code></p>
              <p>• <strong>{tr("Employee", "موظف")}</strong>: <code>employee</code> or <code>DEV001</code> / <code>Employee@123</code> or <code>employee</code></p>
            </div>
          </details>
        )}

        <p className="footer-text">{tr("© 2026 EGAS. All rights reserved.", "© 2026 إيجاس. جميع الحقوق محفوظة.")}</p>
      </section>
    </main>
  );
}
