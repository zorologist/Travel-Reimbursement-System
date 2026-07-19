import type { RequestResponse } from "../../services/requestApi";
import { EmptyState } from "../ui/EmptyState";

interface RequestListProps {
  requests: readonly RequestResponse[];
}

const STATUS_LABELS: Readonly<Record<RequestResponse["status"], string>> = {
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Readonly<Record<RequestResponse["status"], string>> = {
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function RequestList({ requests }: RequestListProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No travel requests found"
        description="There are no requests matching the selected filter."
      />
    );
  }

  return (
    <ul className="space-y-4" aria-label="Travel requests">
      {requests.map((request) => (
        <li
          className="rounded-xl border bg-white p-5 shadow-sm"
          key={request.id}
        >
          <article className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800">
                  {request.travelFrom} → {request.travelTo}
                </h3>
                <span className="text-xs text-gray-500">#{request.id}</span>
              </div>

              <p className="mt-1 text-sm text-gray-600">
                {formatDate(request.departureAt)} – {formatDate(request.returnAt)}
              </p>

              {request.status === "cancelled" && request.cancellationReason && (
                <p className="mt-3 rounded bg-red-50 p-2 text-sm font-medium text-red-700">
                  Cancellation reason: {request.cancellationReason}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASSES[request.status]}`}
              >
                {STATUS_LABELS[request.status]}
              </span>

              {request.status === "completed" && request.finalPrice !== undefined ? (
                <p className="mt-2 text-sm font-bold text-[#1E5A34]">
                  Confirmed amount: {formatMoney(request.finalPrice)}
                </p>
              ) : (
                <p className="mt-2 text-xs italic text-gray-400">
                  Financial totals become visible after finalization.
                </p>
              )}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
