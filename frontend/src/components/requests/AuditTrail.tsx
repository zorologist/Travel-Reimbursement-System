import type { AuditEvent } from "@travel-reimbursement/shared";

function date(value: string) {
  return new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AuditTrail({ events }: { events: readonly AuditEvent[] }) {
  return <ul>{events.slice().reverse().map((event) => <li key={event.id}><span><strong>{event.action}</strong> by {event.actorRole}</span><small>{date(event.createdAt)}{event.note ? ` · ${event.note}` : ""}</small></li>)}</ul>;
}
