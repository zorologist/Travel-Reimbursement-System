import { Link } from "react-router-dom";
import "../styles/global.css";

export function NotFoundPage() {
  return (
    <main className="ui-page">
      <section className="ui-state">
        <span className="ui-state-code">
          404
        </span>

        <h1>Page not found</h1>

        <p>
          The page you requested does not exist.
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
