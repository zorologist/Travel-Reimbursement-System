import type { AuditEvent } from "@travel-reimbursement/shared";
import { useLanguage } from "../../hooks/useLanguage";
import { formatDateTime, localizeLabel } from "../../i18n/format";

export function AuditTrail({ events }: { events: readonly AuditEvent[] }) {
  const { language, tr } = useLanguage();
  return <ul>{events.slice().reverse().map((event) => <li key={event.id}><span><strong>{localizeLabel(event.action, language)}</strong> {tr("by", "بواسطة")} {localizeLabel(event.actorRole, language)}</span><small>{formatDateTime(event.createdAt, language)}{event.note ? ` · ${event.note}` : ""}</small></li>)}</ul>;
}
