import type { RequestResponse } from "../../services/requestApi";
import { EmptyState } from "../ui/EmptyState";
import { RequestCard } from "./RequestCard";

export function RequestList({ requests }: { requests: readonly RequestResponse[] }) {
  if (requests.length === 0) return <EmptyState title="No travel requests found" description="There are no requests matching the selected filter." />;
  return <ul className="space-y-4" aria-label="Travel requests">{requests.map((request) => <li key={request.id}><RequestCard request={request} /></li>)}</ul>;
}
