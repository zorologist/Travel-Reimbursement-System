// Development sign-in lives here until it is replaced by the company's authentication system.
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import logoUrl from "../../EGAS.png";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import "../styles/login.css";
import { LoadingState } from "../components/ui/LoadingState";
import { useDirectoryPasswordLogin, useWindowsAuthentication } from "../services/runtimeMode";

const DIRECTORY_USERNAME_PREFIX = "EGAS\\";

function accountNameWithoutDirectoryPrefix(value: string): string {
  return value.replace(/^\s*EGAS[\\/]/i, "").replace(/^[\\/]+/, "");
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, restore, user } = useAuth();
  const { tr, localizeError } = useLanguage();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (useWindowsAuthentication && loading) {
    return <LoadingState message={tr("Signing in with your Windows account...", "Signing in with your Windows account...")} />;
  }
  if (useWindowsAuthentication && user) return <Navigate to="/home" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    let authenticatedUser;

    // Normalize Arabic numerals to English digits
    const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const normalizedAccountName = employeeNumber
      .trim()
      .toUpperCase()
      .replace(/[٠-٩]/g, (char: string) => {
        const index = arabicNumerals.indexOf(char);
        return index !== -1 ? String(index) : char;
      });
    const normalizedUsername = useDirectoryPasswordLogin
      ? `${DIRECTORY_USERNAME_PREFIX}${accountNameWithoutDirectoryPrefix(normalizedAccountName)}`
      : normalizedAccountName;

    try {
      authenticatedUser = await login(normalizedUsername, password, remember);
    } catch (loginError) {
      setError(localizeError(
        loginError,
        "Sign-in could not be completed. Try again or contact IT support.",
        "تعذر تسجيل الدخول. حاول مرة أخرى أو تواصل مع الدعم الفني.",
      ));
      return;
    } finally {
      setSubmitting(false);
    }
    if (!authenticatedUser) {
      setError(useDirectoryPasswordLogin
        ? tr("Invalid Windows username or password.", "اسم مستخدم الويندوز أو كلمة المرور غير صحيحة.")
        : tr("Invalid development employee number or password.", "رقم الموظف أو كلمة المرور غير صحيحة."));
      return;
    }

    const requestedPath =
      typeof location.state === "object" &&
        location.state !== null &&
        "from" in location.state &&
        typeof location.state.from === "string" &&
        location.state.from.startsWith("/") &&
        !location.state.from.startsWith("//") &&
        location.state.from !== "/login"
        ? location.state.from
        : "/home";
    navigate(requestedPath, { replace: true });
  }

  return (
    <main className="login-page">
      <div className="login-overlay-left">
        <section className="login-container" aria-labelledby="login-title">
          <div className="logo-area">
            <img src={logoUrl} alt="EGAS logo" />
          </div>

          <h1 id="login-title">{tr("Welcome Back", "مرحباً بعودتك")}</h1>
          <p className="subtitle">{tr("Please sign in to your EGAS account", "يرجى تسجيل الدخول إلى حساب إيجاس")}</p>

          {useWindowsAuthentication ? (
            <div className="login-windows-auth">
              <p>{tr(
                "Windows sign-in could not be completed. Confirm that you are on the company network and that IT has registered your account.",
                "Windows sign-in could not be completed. Confirm that you are on the company network and that IT has registered your account.",
              )}</p>
              <button type="button" className="login-button" onClick={() => void restore()}>
                {tr("Try Windows sign-in again", "Try Windows sign-in again")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">
                  {useDirectoryPasswordLogin ? tr("Windows Username", "اسم مستخدم الويندوز") : tr("Employee Number", "رقم الموظف")}
                </label>
                {useDirectoryPasswordLogin ? (
                  <>
                    <div className="directory-username-field">
                      <span className="directory-username-prefix" aria-hidden="true">{DIRECTORY_USERNAME_PREFIX}</span>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={employeeNumber}
                        onChange={(event) => {
                          setEmployeeNumber(accountNameWithoutDirectoryPrefix(event.target.value));
                          setError("");
                        }}
                        autoComplete="username"
                        aria-describedby="directory-username-help"
                        required
                        placeholder="username"
                      />
                    </div>
                    <p id="directory-username-help" className="directory-username-help">
                      {tr("Type only your Windows username after", "اكتب اسم مستخدم الويندوز فقط بعد")}{" "}
                      <bdi dir="ltr">EGAS\</bdi>. {tr("Full example:", "مثال كامل:")}{" "}
                      <bdi dir="ltr">EGAS\username</bdi>
                    </p>
                  </>
                ) : (
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
                )}
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
                {!useDirectoryPasswordLogin && (
                  <span className="login-access-note">{tr("Development access", "دخول بيئة التطوير")}</span>
                )}
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
          )}

          <p className="footer-text">{tr("© 2026 EGAS. All rights reserved.", "© 2026 إيجاس. جميع الحقوق محفوظة.")}</p>
        </section>
      </div>

      <div className="login-overlay-right">
        <div className="company-info-panel">
          <img src={logoUrl} alt="EGAS Logo" className="company-logo-large" />
          <h2 className="company-name-ar">الشركة المصرية القابضة للغازات الطبيعية - ايجاس</h2>
          <div className="gold-separator"></div>
          <h3 className="company-name-en">Egyptian Natural Gas Holding Company – EGAS</h3>
        </div>
      </div>
    </main>
  );
}
