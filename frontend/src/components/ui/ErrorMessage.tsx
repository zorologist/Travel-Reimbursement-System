import "../../styles/errorMessage.css";
import { useLanguage } from "../../hooks/useLanguage";

interface ErrorMessageProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
}

/** Accessible React version of the submitted error-message card design. */
export function ErrorMessage({
  message,
  title,
  onDismiss,
}: ErrorMessageProps) {
  const { tr } = useLanguage();
  return (
    <aside className="error-message-popup" role="alert" aria-live="assertive">
      <span className="error-message-icon" aria-hidden="true">!</span>
      <div className="error-message-content">
        <h3>{title ?? tr("Something went wrong", "حدث خطأ")}</h3>
        <p>{message}</p>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label={tr("Dismiss error", "إغلاق رسالة الخطأ")}>×</button>
      )}
    </aside>
  );
}
