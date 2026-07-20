import { Link } from "react-router-dom";
import "../styles/global.css";
import { useLanguage } from "../hooks/useLanguage";

export function ForbiddenPage() {
  const { tr } = useLanguage();
  return (
    <main className="ui-page">
      <section className="ui-state ui-state--error">
        <span className="ui-state-code">
          403
        </span>

        <h1>{tr("Access denied", "تم رفض الوصول")}</h1>

        <p>
          {tr("You do not have permission to open this page.", "ليس لديك صلاحية لفتح هذه الصفحة.")}
        </p>

        <Link
          className="ui-state-button"
          to="/"
        >
          {tr("Return home", "العودة للرئيسية")}
        </Link>
      </section>
    </main>
  );
}
