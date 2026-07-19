import { Link } from "react-router-dom";
import "../styles/global.css";

export function ForbiddenPage() {
  return (
    <main className="ui-page">
      <section className="ui-state ui-state--error">
        <span className="ui-state-code">
          403
        </span>

        <h1>Access denied</h1>

        <p>
          You do not have permission to open this page.
        </p>

        <Link
          className="ui-state-button"
          to="/"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
