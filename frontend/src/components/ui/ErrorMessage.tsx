import "../../styles/errorMessage.css";

interface ErrorMessageProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
}

/** Accessible React version of the submitted error-message card design. */
export function ErrorMessage({
  message,
  title = "Something went wrong",
  onDismiss,
}: ErrorMessageProps) {
  return (
    <aside className="error-message-popup" role="alert" aria-live="assertive">
      <span className="error-message-icon" aria-hidden="true">!</span>
      <div className="error-message-content">
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss error">×</button>
      )}
    </aside>
  );
}
