import "../../styles/global.css";
import { useLanguage } from "../../hooks/useLanguage";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message,
}: LoadingStateProps) {
  const { tr } = useLanguage();
  return (
    <div
      className="ui-state"
      role="status"
      aria-live="polite"
    >
      <span
        className="ui-spinner"
        aria-hidden="true"
      />

      <p>{message ?? tr("Loading information...", "جارٍ تحميل البيانات...")}</p>
    </div>
  );
}
