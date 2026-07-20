import type { RequestDetailsResponse } from "../../services/requestApi";
import { useLanguage } from "../../hooks/useLanguage";
import { formatDateTime, localizeLabel } from "../../i18n/format";

export function RequestSummary({ request }: { request: RequestDetailsResponse }) {
  const { language, tr } = useLanguage();
  return <section className="request-detail-summary"><article><span>{tr("Status", "الحالة")}</span><strong data-status={request.status}>{localizeLabel(request.status, language)}</strong></article><article><span>{tr("Departure", "الذهاب")}</span><strong>{formatDateTime(request.departureAt, language)}</strong></article><article><span>{tr("Return", "العودة")}</span><strong>{formatDateTime(request.returnAt, language)}</strong></article><article><span>{tr("Transportation", "وسيلة الانتقال")}</span><strong>{localizeLabel(request.transportationMethod, language)}</strong></article></section>;
}
