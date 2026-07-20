import type { RequestDetailsResponse } from "../../services/requestApi";

function date(value: string) {
  return new Intl.DateTimeFormat("en-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function RequestSummary({ request }: { request: RequestDetailsResponse }) {
  return <section className="request-detail-summary"><article><span>Status</span><strong data-status={request.status}>{request.status.replace("-", " ")}</strong></article><article><span>Departure</span><strong>{date(request.departureAt)}</strong></article><article><span>Return</span><strong>{date(request.returnAt)}</strong></article><article><span>Transportation</span><strong>{request.transportationMethod}</strong></article></section>;
}
