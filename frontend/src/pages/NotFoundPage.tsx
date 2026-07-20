import { Link } from "react-router-dom";
import "../styles/global.css";
import { useLanguage } from "../hooks/useLanguage";

export function NotFoundPage() {
  const { tr } = useLanguage();
  return (
    <main className="ui-page">
      <section className="ui-state">
        <span className="ui-state-code">
          404
        </span>

        <h1>{tr("Page not found", "الصفحة غير موجودة")}</h1>

        <p>
          {tr("The page you requested does not exist.", "الصفحة التي طلبتها غير موجودة.")}
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
