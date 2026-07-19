
import type { ReactNode } from "react";
import "../../styles/global.css";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section
      className="ui-state"
      aria-labelledby="empty-state-title"
    >
      <span
        className="ui-state-icon"
        aria-hidden="true"
      >
        ○
      </span>

      <h1 id="empty-state-title">
        {title}
      </h1>

      {description && (
        <p>{description}</p>
      )}

      {action && (
        <div className="ui-state-action">
          {action}
        </div>
      )}
    </section>
  );
}