import "../../styles/global.css";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Loading information...",
}: LoadingStateProps) {
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

      <p>{message}</p>
    </div>
  );
}