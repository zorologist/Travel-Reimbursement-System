import { Link } from "react-router-dom";

import type { RequestResponse } from "../../services/requestApi";

const statusLabels = { "in-progress": "In progress", completed: "Completed", cancelled: "Cancelled" } as const;

function date(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

export function RequestCard({ request }: { request: RequestResponse }) {
  return (
    <article className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-gray-800">{request.originCity} → {request.destinationCity}</h3><span className="text-xs text-gray-500">#{request.id}</span></div><p className="mt-1 text-sm text-gray-600">{date(request.departureAt)} – {date(request.returnAt)}</p>{request.status === "cancelled" && request.cancellationReason && <p className="mt-3 rounded bg-red-50 p-2 text-sm font-medium text-red-700">Cancellation reason: {request.cancellationReason}</p>}</div>
        <div className="sm:text-right"><span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{statusLabels[request.status]}</span>{request.status === "completed" && request.finalPrice !== undefined ? <p className="mt-2 text-sm font-bold text-[#1E5A34]">Confirmed amount: {request.finalPrice.toFixed(2)} EGP</p> : <p className="mt-2 text-xs italic text-gray-400">Financial totals appear after finalization.</p>}<Link className="request-card-link" to={`/requests/${request.id}`}>View details</Link></div>
      </div>
    </article>
  );
}
