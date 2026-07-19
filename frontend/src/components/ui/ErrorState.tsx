import "../../styles/global.css";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
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

      <h1>Something went wrong</h1>

      <p>{message}</p>

      {onRetry && (
        <button
          className="ui-state-button"
          type="button"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </section>
  );
}
