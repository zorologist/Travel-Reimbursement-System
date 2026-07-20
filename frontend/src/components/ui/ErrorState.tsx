import "../../styles/global.css";
import { useLanguage } from "../../hooks/useLanguage";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  const { tr } = useLanguage();
  return (
    <section
      className="ui-state ui-state--error"
      role="alert"
    >
      <span
        className="ui-state-icon"
        aria-hidden="true"
      >
        !
      </span>

      <h1>{tr("Something went wrong", "حدث خطأ")}</h1>

      <p>{message}</p>

      {onRetry && (
        <button
          className="ui-state-button"
          type="button"
          onClick={onRetry}
        >
          {tr("Try again", "حاول مرة أخرى")}
        </button>
      )}
    </section>
  );
}
