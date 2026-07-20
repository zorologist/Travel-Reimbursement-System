import type { RequestResponse } from "../../services/requestApi";
import { EmptyState } from "../ui/EmptyState";
import { RequestCard } from "./RequestCard";
import { useLanguage } from "../../hooks/useLanguage";

export function RequestList({ requests }: { requests: readonly RequestResponse[] }) {
  const { tr } = useLanguage();
  if (requests.length === 0) return <EmptyState title={tr("No travel requests found", "لا توجد طلبات سفر")} description={tr("There are no requests matching the selected filter.", "لا توجد طلبات تطابق عامل التصفية المحدد.")} />;
  return <ul className="space-y-4" aria-label={tr("Travel requests", "طلبات السفر")}>{requests.map((request) => <li key={request.id}><RequestCard request={request} /></li>)}</ul>;
}
