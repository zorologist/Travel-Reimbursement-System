import { Link, Navigate, useNavigate } from "react-router-dom";
import logoUrl from "../../EGAS.png";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { localizeLabel } from "../i18n/format";
import "../styles/mainMenu.css";

export function MainMenuPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, tr } = useLanguage();

  if (!user) return <Navigate to="/login" replace />;

  const administrativeRole = user.roles.find((role) => role !== "employee");
  const roleLabel = administrativeRole
    ? tr(`${localizeLabel(administrativeRole, "en")} & Employee`, `${localizeLabel(administrativeRole, "ar")} وموظف`)
    : localizeLabel("employee", language);

  function handleSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="main-menu-page">
      <header className="main-menu-topbar">
        <Link className="main-menu-brand" to="/home" aria-label={tr("EGAS home", "الرئيسية - إيجاس")}>
          <img src={logoUrl} alt="EGAS" />
          <span>
            <strong>EGAS</strong>
            <small>{tr("Travel Reimbursement System", "نظام تعويضات السفر")}</small>
          </span>
        </Link>

        <div className="main-menu-account">
          <span>
            <strong>{user.displayName}</strong>
            <small>{roleLabel}</small>
          </span>
          <button className="main-menu-signout" type="button" onClick={handleSignOut}>
            {tr("Sign out", "تسجيل الخروج")}
          </button>
        </div>
      </header>

      <main className="main-menu-content">
        <section className="main-menu-intro" aria-labelledby="main-menu-title">
          <p className="main-menu-eyebrow">{tr(`${roleLabel} Services`, `خدمات ${roleLabel}`)}</p>
          <h1 id="main-menu-title">{tr("What would you like to do?", "ماذا تريد أن تفعل؟")}</h1>
          <p>
            {tr("Start a new travel request or open your dashboard to follow existing requests and their current approval stage.", "أنشئ طلب سفر جديداً أو افتح لوحة التحكم لمتابعة الطلبات الحالية ومرحلة اعتمادها.")}
          </p>
        </section>

        <section className="main-menu-actions" aria-label={tr("Available actions", "الإجراءات المتاحة")}>
          <Link className="main-menu-card main-menu-card--new" to="/requests/new">
            <span className="main-menu-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="main-menu-card-copy">
              <small>{tr("Travel services", "خدمات السفر")}</small>
              <strong>{tr("New Travel Request", "طلب سفر جديد")}</strong>
              <span>{tr("Create and submit a new request for approval.", "أنشئ طلباً جديداً وأرسله للاعتماد.")}</span>
            </span>
            <span className="main-menu-card-arrow" aria-hidden="true">
              {tr("→", "←")}
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
              <small>{tr("Request overview", "نظرة عامة على الطلبات")}</small>
              <strong>{tr("Open Dashboard", "فتح لوحة التحكم")}</strong>
              <span>{tr("Track current requests and review previous activity.", "تابع الطلبات الحالية وراجع النشاط السابق.")}</span>
            </span>
            <span className="main-menu-card-arrow" aria-hidden="true">
              {tr("→", "←")}
            </span>
          </Link>

          <Link className="main-menu-card main-menu-card--dashboard" to="/my-requests">
            <span className="main-menu-card-icon" aria-hidden="true">✓</span>
            <span className="main-menu-card-copy"><small>{tr("Personal workflow", "مسار العمل الشخصي")}</small><strong>{tr("My Requests", "طلباتي")}</strong><span>{tr("See status, final amounts, and the audit history.", "اعرض الحالة والمبالغ النهائية وسجل الإجراءات.")}</span></span>
            <span className="main-menu-card-arrow" aria-hidden="true">{tr("→", "←")}</span>
          </Link>

          {administrativeRole && administrativeRole !== "salary" && (
            <Link className="main-menu-card main-menu-card--dashboard" to="/approvals">
              <span className="main-menu-card-icon" aria-hidden="true">↗</span>
              <span className="main-menu-card-copy"><small>{tr("Department work", "عمل القسم")}</small><strong>{tr("Approval Queue", "قائمة الاعتماد")}</strong><span>{tr(`Review requests currently assigned to ${administrativeRole}.`, `راجع الطلبات المسندة حالياً إلى ${localizeLabel(administrativeRole, "ar")}.`)}</span></span>
              <span className="main-menu-card-arrow" aria-hidden="true">{tr("→", "←")}</span>
            </Link>
          )}
          {administrativeRole === "salary" && (
            <Link className="main-menu-card main-menu-card--dashboard" to="/salary">
              <span className="main-menu-card-icon" aria-hidden="true">£</span>
              <span className="main-menu-card-copy"><small>{tr("Salary work", "عمل الرواتب")}</small><strong>{tr("Finalization Queue", "قائمة الاعتماد النهائي")}</strong><span>{tr("Verify calculations and confirm reimbursement.", "تحقق من الحسابات وأكد مبلغ التعويض.")}</span></span>
              <span className="main-menu-card-arrow" aria-hidden="true">{tr("→", "←")}</span>
            </Link>
          )}
        </section>

        <p className="main-menu-help">
          {tr("Select one of the options above to continue.", "اختر أحد الخيارات أعلاه للمتابعة.")}
        </p>
      </main>

      <footer className="main-menu-footer">
        <span>{tr("© 2026 EGAS. All rights reserved.", "© 2026 إيجاس. جميع الحقوق محفوظة.")}</span>
        <span>{tr("Internal employee portal", "بوابة الموظفين الداخلية")}</span>
      </footer>
    </div>
  );
}
